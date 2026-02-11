const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Item, Notification, Group, Board, User } = require('../models');

// @route   GET api/items/my
// @desc    Get items assigned to the current user
router.get('/my', auth, async (req, res) => {
  try {
    const items = await Item.findAll({
      where: { assignedToId: req.user.id },
      include: [
        {
          model: Group,
          include: [{ model: Board }]
        },
        { model: Item, as: 'parentItem' }
      ]
    });
    res.json(items);
  } catch (err) {
    console.error('Error in GET /my:', err);
    res.status(500).send('Server error');
  }
});

// @route   POST api/items
router.post('/', auth, async (req, res) => {
  try {
    const itemData = {
      ...req.body,
      assignedToId: req.body.assignedToId || req.user.id,
      receivedDate: req.body.receivedDate || new Date().toISOString(),
      status: req.body.status || 'Working on it'
    };

    const item = await Item.create(itemData);

    // If assigned to someone, create notification
    if (item.assignedToId && item.assignedToId !== req.user.id) {
      await Notification.create({
        UserId: item.assignedToId,
        content: `You have been assigned a new task: ${item.name}`,
        type: 'task_assigned',
        link: `/board`
      });
    }

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/items/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });

    const oldAssigneeId = item.assignedToId;
    const oldStatus = item.status;
    await item.update(req.body);

    // If assignment changed, notify new user
    if (req.body.assignedToId && req.body.assignedToId !== oldAssigneeId) {
      await Notification.create({
        UserId: req.body.assignedToId,
        content: `You have been assigned a task: ${item.name}`,
        type: 'task_assigned',
        link: `/board`
      });
    }

    // If status changed to Done, notify Admins
    if (item.status === 'Done' && oldStatus !== 'Done') {
      const admins = await User.findAll({ where: { role: 'Admin' } });
      const completedBy = await User.findByPk(req.user.id); // Get user who made the change (from auth token)

      for (const admin of admins) {
        // Don't notify if the admin is the one who completed it (optional, but good UX)
        if (admin.id !== req.user.id) {
          await Notification.create({
            UserId: admin.id,
            content: `Task "${item.name}" marked as Done by ${completedBy ? completedBy.name : 'a user'}`,
            type: 'task_completed',
            link: `/board`
          });
        }
      }
    }

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/items/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });
    await item.destroy();
    res.json({ msg: 'Item removed' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
