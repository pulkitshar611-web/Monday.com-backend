const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Notification } = require('../models');

// @route   GET api/notifications
router.get('/', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'Manager';
    const whereClause = isAdmin ? {} : { UserId: req.user.id };

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    console.log(`[GET NOTIFICATIONS] User: ${req.user.id} Admin: ${isAdmin} Found: ${notifications.length}`);
    res.json(notifications);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/notifications/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, UserId: req.user.id }
    });
    if (!notification) return res.status(404).json({ msg: 'Notification not found' });

    await notification.update({ isRead: true });
    res.json(notification);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
