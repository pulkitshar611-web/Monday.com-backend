const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Board, Item, Group, User, File, Form } = require('../models');
const { Op } = require('sequelize');

// @route   GET api/search
// @desc    Search across all boards, items, users, files, forms
router.get('/', auth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ boards: [], items: [], users: [], files: [], forms: [] });

  try {
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'Manager';
    const userId = String(req.user.id);
    const searchOp = { [Op.like]: `%${q}%` };

    // Identify boards where user is assigned
    const assignedItemsForAccess = await Item.findAll({
      where: {
        [Op.or]: [
          { assignedToId: userId },
          { people: { [Op.regexp]: `(^|[^0-9])${userId}([^0-9]|$)` } },
          { person: userId },
          { subItemsData: { [Op.regexp]: `(^|[^0-9])${userId}([^0-9]|$)` } }
        ]
      },
      include: [{ model: Group, attributes: ['BoardId'] }]
    });
    const assignedBoardIds = [...new Set(assignedItemsForAccess.map(i => i.Group?.BoardId).filter(id => id))];

    const [boards, allItems, users, files, forms] = await Promise.all([
      // Search Boards
      Board.findAll({
        where: {
          name: searchOp,
          ...(isAdmin ? {} : {
            [Op.or]: [{ id: assignedBoardIds }, { ownerId: userId }]
          })
        },
        attributes: ['id', 'name', 'workspace', 'type']
      }),

      // Search Items
      Item.findAll({
        where: { name: searchOp },
        include: [
          {
            model: Group,
            include: [{ model: Board, attributes: ['id', 'name'] }]
          }
        ],
        limit: 50
      }),

      // Search Users
      User.findAll({
        where: {
          [Op.or]: [
            { name: searchOp },
            { email: searchOp }
          ]
        },
        attributes: ['id', 'name', 'email', 'avatar', 'role']
      }),

      // Search Files
      File.findAll({
        where: { name: searchOp },
        limit: 20
      }),

      // Search Forms
      Form.findAll({
        where: {
          title: searchOp,
          ...(isAdmin ? {} : { BoardId: assignedBoardIds })
        },
        include: [{ model: Board, attributes: ['id', 'name'] }]
      })
    ]);

    // Post-filter items for non-admins (must be assigned to the item or its board)
    const filteredItems = isAdmin ? allItems : allItems.filter(item => {
      const isBoardAssigned = assignedBoardIds.includes(item.Group?.BoardId);
      const isItemAssigned = String(item.assignedToId) === userId ||
        new RegExp(`(^|[^0-9])${userId}([^0-9]|$)`).test(String(item.people || '')) ||
        String(item.person) === userId ||
        new RegExp(`(^|[^0-9])${userId}([^0-9]|$)`).test(String(item.subItemsData || ''));
      return isBoardAssigned || isItemAssigned;
    });

    res.json({ boards, items: filteredItems.slice(0, 20), users, files, forms });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
