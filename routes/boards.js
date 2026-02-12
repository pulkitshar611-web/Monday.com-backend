const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Board, Group, Item, User } = require('../models');

// @route   GET api/boards
router.get('/', auth, async (req, res) => {
  try {
    // Admins see everything by default, Users only see assigned tasks
    const showAll = req.user.role === 'Admin';
    const boards = await Board.findAll({
      include: [{
        model: Group,
        as: 'Groups',
        required: false, // Keep Groups even if empty, but filter them if they shouldn't exist?
        // Actually, if we want to filter BOARDS, we should use required: !showAll on the items and groups.
        include: [{
          model: Item,
          as: 'items',
          where: showAll ? {} : { assignedToId: req.user.id },
          required: false, // Keep this false to let frontend handle empty groups if board is valid?
          // No, if we want to filter the BOARD itself, we need at least one level to be required.
          include: [
            { model: Item, as: 'subItems' },
            { model: User, as: 'assignedUser', attributes: ['name', 'email', 'avatar'] }
          ]
        }]
      }]
    });

    // Filter boards in JS for better control if required: true is too noisy
    const filteredBoards = showAll ? boards : boards.filter(board => {
      return board.Groups.some(group => group.items && group.items.length > 0);
    });

    res.json(filteredBoards);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route   POST api/boards
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ msg: 'Access denied' });
    const board = await Board.create(req.body);
    // Create a default group
    await Group.create({ title: 'New Group', BoardId: board.id });
    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route   POST api/boards/:id/groups
router.post('/:id/groups', auth, async (req, res) => {
  try {
    const group = await Group.create({
      ...req.body,
      BoardId: req.params.id
    });
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/boards/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findByPk(req.params.id);
    if (!board) return res.status(404).json({ msg: 'Board not found' });

    // Allow updating columns
    if (req.body.columns) {
      board.columns = req.body.columns;
    }

    // Allow updating other fields if needed
    if (req.body.name) board.name = req.body.name;
    if (req.body.type) board.type = req.body.type;

    await board.save();
    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
