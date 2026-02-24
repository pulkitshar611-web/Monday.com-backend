const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const { Board, Group, Item, User } = require('../models');
const checkBoardAccess = require('../middleware/checkBoardAccess');

// DEBUG LOG: Ensure this file is loaded
console.log('--- BOARDS ROUTER INITIALIZING ---');

/**
 * @route   DELETE api/boards/:id
 * @desc    Delete a board by ID. 
 *          This is now at the TOP of the file to ensure it matches first.
 */
router.delete('/:id', auth, async (req, res) => {
  const boardId = req.params.id;
  console.log(`[ROUTE HIT] DELETE /api/boards/${boardId} (User: ${req.user.id}, Role: ${req.user.role})`);

  try {
    if (req.user.role !== 'Admin') {
      console.log(`[DELETE DENIED] User ${req.user.id} is not an Admin`);
      return res.status(403).json({ msg: 'Access denied: Requires Admin role' });
    }

    const board = await Board.findByPk(boardId);

    if (!board) {
      console.log(`[DELETE INFO] Board ${boardId} not found. Returning 200 for idempotency.`);
      return res.status(200).json({
        msg: `Board ${boardId} already deleted or does not exist.`,
        id: boardId,
        success: true
      });
    }

    await board.destroy();
    console.log(`[DELETE SUCCESS] Board ${boardId} has been removed.`);
    res.json({ msg: 'Board deleted successfully', id: boardId, success: true });
  } catch (err) {
    console.error(`[DELETE ERROR] Critical fail for board ${boardId}:`, err);
    res.status(500).json({ msg: 'Server error during deletion', error: err.message });
  }
});

// @route   GET api/boards/archived
router.get('/archived', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const isManager = req.user.role === 'Manager';

    const boards = await Board.findAll({
      where: { isArchived: true },
      include: [{
        model: Group,
        as: 'Groups',
        required: false,
        include: [{
          model: Item,
          as: 'items',
          required: false,
          where: isAdmin || isManager ? {} : { assignedToId: req.user.id }
        }]
      }]
    });

    const filtered = boards.filter(b => {
      if (isAdmin || isManager) return true;
      // For archived boards, we check if they HAVE any items assigned to the user
      // Since it's archived, we only show it if they WERE involved.
      const hasAssignments = (b.Groups || []).some(g => (g.items || []).length > 0);
      return hasAssignments;
    });

    res.json(filtered);
  } catch (err) {
    console.error('boards.js GET /archived error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/boards/test
router.get('/test', (req, res) => {
  res.json({ msg: 'Boards router is working', id: 'TEST_ROUTE' });
});

// @route   GET api/boards/health
router.get('/health', async (req, res) => {
  try {
    await Board.findOne();
    res.json({ status: 'ok', msg: 'Database connection for Boards is healthy' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// @route   GET api/boards
router.get('/', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const isManager = req.user.role === 'Manager';

    const commonInclude = [{
      model: Group,
      as: 'Groups',
      required: false,
      include: [{
        model: Item,
        as: 'items',
        required: false,
        include: [
          { model: Item, as: 'subItems' },
          { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email', 'avatar'] }
        ]
      }]
    }];

    // 1. Get all boards
    const allBoards = await Board.findAll({
      include: commonInclude
    });

    // 2. Identify boards where user is assigned
    const assignedItems = await Item.findAll({
      where: { assignedToId: String(req.user.id) },
      include: [{
        model: Group,
        as: 'Group', // Default association name for Item.belongsTo(Group)
        attributes: ['BoardId']
      }]
    });

    // FALLBACK: If 'Group' (capital) doesn't work, try 'group' (lowercase) or check raw column
    const assignedBoardIds = [...new Set(assignedItems.map(item => {
      const group = item.Group || item.group;
      return group?.BoardId;
    }).filter(id => id))];

    console.log(`[BOARDS DEBUG] User: ${req.user.id}, Role: ${req.user.role}, AssignedItems: ${assignedItems.length}, AssignedBoardIds: ${JSON.stringify(assignedBoardIds)}`);

    // 3. Mark access levels AND filter for non-admins
    const filteredBoards = allBoards
      .map(b => {
        const board = b.toJSON();
        const isAssigned = assignedBoardIds.includes(b.id);

        if (isAdmin || isManager) {
          board.access = 'full';
          return board;
        } else if (isAssigned) {
          board.access = 'full';
          return board;
        } else {
          // For non-assigned boards, regular users get 'view' access if we decide to show them
          // BUT the requirement is "only see relevant boards", so we filter them out.
          board.access = 'view';
          return board;
        }
      })
      .filter(b => {
        if (isAdmin || isManager) return true;
        return b.access === 'full'; // Only return assigned boards for regular users
      });

    res.json(filteredBoards);
  } catch (err) {
    console.error('boards.js GET / error:', err);
    res.status(500).json({ msg: 'Server error fetching boards' });
  }
});

// @route   POST api/boards
router.post('/', [auth, checkPermission('createMainBoards')], async (req, res) => {
  try {
    // if (req.user.role !== 'Admin' && req.user.role !== 'Manager') return res.status(403).json({ msg: 'Access denied' });
    const board = await Board.create(req.body);
    await Group.create({ title: 'New Group', BoardId: board.id });
    res.json(board);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   POST api/boards/:id/groups
router.post('/:id/groups', [auth, checkBoardAccess], async (req, res) => {
  try {
    const group = await Group.create({ ...req.body, BoardId: req.params.id });
    res.json(group);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/boards/:id
router.patch('/:id', [auth, checkBoardAccess], async (req, res) => {
  try {
    const board = await Board.findByPk(req.params.id);
    if (!board) return res.status(404).json({ msg: 'Board not found' });

    const allowedUpdates = ['name', 'type', 'folder', 'columns', 'isFavorite', 'isArchived'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        board[field] = req.body[field];
      }
    });

    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
