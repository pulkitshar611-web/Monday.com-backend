const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Board, Group, Item, User } = require('../models');

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
    const boards = await Board.findAll({
      where: { isArchived: true },
      include: [{
        model: Group,
        as: 'Groups',
        required: false
      }]
    });
    res.json(boards);
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
    const showAll = req.user.role === 'Admin';
    const boards = await Board.findAll({
      include: [{
        model: Group,
        as: 'Groups',
        required: false,
        include: [{
          model: Item,
          as: 'items',
          where: showAll ? {} : { assignedToId: req.user.id },
          required: false,
          include: [
            { model: Item, as: 'subItems' },
            { model: User, as: 'assignedUser', attributes: ['name', 'email', 'avatar'] }
          ]
        }]
      }]
    });

    const filteredBoards = showAll ? boards : boards.filter(board => {
      return board.Groups && board.Groups.some(group => group.items && group.items.length > 0);
    });

    res.json(filteredBoards);
  } catch (err) {
    console.error('boards.js GET / error:', err);
    res.status(500).json({ msg: 'Server error fetching boards' });
  }
});

// @route   POST api/boards
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ msg: 'Access denied' });
    const board = await Board.create(req.body);
    await Group.create({ title: 'New Group', BoardId: board.id });
    res.json(board);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   POST api/boards/:id/groups
router.post('/:id/groups', auth, async (req, res) => {
  try {
    const group = await Group.create({ ...req.body, BoardId: req.params.id });
    res.json(group);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/boards/:id
router.patch('/:id', auth, async (req, res) => {
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
