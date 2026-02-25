const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Item, Notification, Group, Board, User } = require('../models');
const checkBoardAccess = require('../middleware/checkBoardAccess');

// @route   GET api/items/my
// @desc    Get items assigned to the current user
router.get('/my', auth, async (req, res) => {
  try {
    const items = await Item.findAll({
      where: {}, // Return all items for full visibility
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
router.post('/', [auth, checkBoardAccess], async (req, res) => {
  try {
    // Filter updates: fields in the model go to the root, others to customFields
    const modelFields = Object.keys(Item.rawAttributes);
    const updates = {};
    const customFields = {};

    for (const [key, value] of Object.entries(req.body)) {
      if (modelFields.includes(key)) {
        updates[key] = value;
      } else {
        customFields[key] = value;
      }
    }

    const itemData = {
      ...updates,
      customFields: Object.keys(customFields).length > 0 ? customFields : null,
      assignedToId: updates.assignedToId || req.user.id,
      receivedDate: updates.receivedDate || new Date().toISOString(),
      status: updates.status || 'Working on it'
    };

    const item = await Item.create(itemData);

    // If assigned to someone, create notification
    // SKIP if it's a Team ID (from frontend localstorage, usually 13+ digits)
    const isTeamId = item.assignedToId && String(item.assignedToId).length > 10;
    if (item.assignedToId && item.assignedToId !== req.user.id && !isTeamId) {
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
router.patch('/:id', [auth, checkBoardAccess], async (req, res) => {
  try {
    console.log(`[PATCH ITEM] ID: ${req.params.id} Body:`, JSON.stringify(req.body));
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });

    const oldAssigneeId = item.assignedToId;
    const oldStatus = item.status;

    // Filter updates: fields in the model go to the root, others to customFields
    const modelFields = Object.keys(Item.rawAttributes);
    const updates = {};

    // Parse existing customFields if it's a string
    let customFields = item.customFields || {};
    if (typeof customFields === 'string') {
      try {
        customFields = JSON.parse(customFields);
      } catch (e) {
        customFields = {};
      }
    } else {
      // It's already an object, spread it to clone
      customFields = { ...customFields };
    }

    let hasCustomUpdates = false;

    for (const [key, value] of Object.entries(req.body)) {
      if (modelFields.includes(key)) {
        updates[key] = value;
      } else {
        // Stash unknown/dynamic fields in customFields
        customFields[key] = value;
        hasCustomUpdates = true;
      }
    }

    if (hasCustomUpdates) {
      updates.customFields = customFields;
    }

    await item.update(updates);

    // If assignment changed, notify new user
    // SKIP if it's a Team ID (from frontend localstorage, usually 13+ digits)
    const newAssignedId = req.body.assignedToId;
    const isTeamId = newAssignedId && String(newAssignedId).length > 10;
    if (newAssignedId && newAssignedId !== oldAssigneeId && !isTeamId) {
      await Notification.create({
        UserId: newAssignedId,
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
    console.error('[PATCH ITEM ERROR]:', err);
    res.status(500).send('Server error: ' + err.message);
  }
});

// @route   DELETE api/items/:id
router.delete('/:id', [auth, checkBoardAccess], async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });

    // ONLY Admins, Managers, or the Board Coordinator (req.isCoordinator) can delete items
    // Regular assigned collaborators can only edit, not delete (Client requirement)
    if (req.user.role !== 'Admin' && req.user.role !== 'Manager' && !req.isCoordinator) {
      return res.status(403).json({ msg: 'Access denied: Only coordinators and admins can delete data.' });
    }

    await item.destroy();
    res.json({ msg: 'Item removed' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
