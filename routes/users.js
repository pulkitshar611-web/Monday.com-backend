const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const { User } = require('../models');
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Images only!'));
  }
});

// @route   GET api/users
// @desc    Get all users
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ msg: 'Access denied' });
    const { Item, Group, Board } = require('../models');
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{
        model: Item,
        include: [{
          model: Group,
          include: [{ model: Board }]
        }]
      }]
    });
    res.json(users);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/upload-avatar
router.post('/upload-avatar', auth, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ avatarUrl });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, phone, address, avatar } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // If email is changing, check if new email is already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ msg: 'Email is already taken' });
      }
      user.email = email;
    }

    // Only update fields that are provided
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (avatar) user.avatar = avatar;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Incorrect current password' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users
// @desc    Create a user (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ msg: 'Access denied' });
    const { name, email, password, role, avatar, phone, address } = req.body;

    let user = await User.findOne({ where: { email } });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({
      name, email, password: hashedPassword, role, avatar, phone, address
    });

    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/:id
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if admin OR if user is updating themselves (but usually admin updates role/status)
    // For simplicity, let admins update anyone.
    if (req.user.role !== 'Admin') return res.status(403).json({ msg: 'Access denied' });
    const { name, email, phone, address, role, status, password } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const updates = { name, email, phone, address, role, status };
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    await user.update(updates);
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/users/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ msg: 'Access denied' });
    await User.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'User removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
