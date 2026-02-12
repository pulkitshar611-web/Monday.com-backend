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

    // Defensive filtering: Ensure board.Groups exists before filtering
    const filteredBoards = showAll ? boards : boards.filter(board => {
      return board.Groups && board.Groups.some(group => group.items && group.items.length > 0);
    });

    res.json(filteredBoards);
  } catch (err) {
    console.error('boards.js GET / error:', err);
    res.status(500).json({
      msg: 'Server error fetching boards',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET api/boards/health
// @desc    Check DB connection for boards
router.get('/health', async (req, res) => {
  try {
    await Board.findOne();
    res.json({ status: 'ok', msg: 'Database connection for Boards is healthy' });
  } catch (err) {
    console.error('Boards Health Check Failed:', err);
    res.status(500).json({ status: 'error', error: err.message });
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
