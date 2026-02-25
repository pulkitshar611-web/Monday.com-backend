const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { TimeSession, Item, Group, Board, User } = require('../models');
const { Op } = require('sequelize');

// @route   POST api/time/start
// @desc    Start a time session for an item
router.post('/start', auth, async (req, res) => {
    try {
        const { itemId } = req.body;
        const userId = req.user.id;

        // Check if there's already an active session for this user
        const activeSession = await TimeSession.findOne({
            where: { userId, isActive: true }
        });

        if (activeSession) {
            // Stop current session first
            const now = new Date();
            const start = new Date(activeSession.startTime);
            const diffSeconds = Math.floor((now - start) / 1000);
            activeSession.endTime = now;
            activeSession.duration += diffSeconds;
            activeSession.isActive = false;
            await activeSession.save();
        }

        // Create new session
        const newSession = await TimeSession.create({
            itemId,
            userId,
            startTime: new Date(),
            isActive: true
        });

        res.json(newSession);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/time/stop
// @desc    Stop active time session
router.post('/stop', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const activeSession = await TimeSession.findOne({
            where: { userId, isActive: true }
        });

        if (!activeSession) {
            return res.status(400).json({ msg: 'No active session found' });
        }

        const now = new Date();
        const start = new Date(activeSession.startTime);
        const diffSeconds = Math.floor((now - start) / 1000);

        activeSession.endTime = now;
        activeSession.duration += diffSeconds;
        activeSession.isActive = false;
        await activeSession.save();

        res.json(activeSession);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/time/item/:itemId
// @desc    Get all time sessions for an item
router.get('/item/:itemId', auth, async (req, res) => {
    try {
        const sessions = await TimeSession.findAll({
            where: { itemId: req.params.itemId },
            include: [{ model: User, attributes: ['id', 'name', 'avatar'] }]
        });
        res.json(sessions);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/time/board/:boardId
// @desc    Get aggregated time for a board
router.get('/board/:boardId', auth, async (req, res) => {
    try {
        const board = await Board.findByPk(req.params.boardId, {
            include: [{
                model: Group,
                as: 'Groups',
                include: [{
                    model: Item,
                    as: 'items',
                    include: [{
                        model: TimeSession,
                        as: 'timeSessions',
                        include: [{ model: User, attributes: ['id', 'name'] }]
                    }]
                }]
            }]
        });

        if (!board) return res.status(404).json({ msg: 'Board not found' });

        // Aggregate by user
        const userStats = {};
        board.Groups.forEach(group => {
            group.items.forEach(item => {
                item.timeSessions.forEach(session => {
                    if (!userStats[session.userId]) {
                        userStats[session.userId] = {
                            userId: session.userId,
                            userName: session.User.name,
                            totalDuration: 0,
                            sessions: []
                        };
                    }

                    let sessionDuration = session.duration;
                    if (session.isActive) {
                        const now = new Date();
                        const start = new Date(session.startTime);
                        sessionDuration += Math.floor((now - start) / 1000);
                    }

                    userStats[session.userId].totalDuration += sessionDuration;
                });
            });
        });

        res.json(Object.values(userStats));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/time/active
// @desc    Get current active session for user
router.get('/active', auth, async (req, res) => {
    try {
        const session = await TimeSession.findOne({
            where: { userId: req.user.id, isActive: true },
            include: [{ model: Item, attributes: ['id', 'name'] }]
        });
        res.json(session);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/time/stats

// @desc    Get aggregated time stats for all users and boards
router.get('/stats', auth, async (req, res) => {
    try {
        const sessions = await TimeSession.findAll({
            include: [
                { model: User, attributes: ['id', 'name', 'avatar'] },
                {
                    model: Item,
                    include: [{
                        model: Group,
                        include: [{ model: Board, attributes: ['id', 'name'] }]
                    }]
                }
            ]
        });

        const stats = {
            totalDuration: 0,
            byUser: {},
            byBoard: {},
            lastSessions: sessions.slice(-10).reverse()
        };

        sessions.forEach(session => {
            let duration = session.duration;
            if (session.isActive) {
                duration += Math.floor((new Date() - new Date(session.startTime)) / 1000);
            }

            stats.totalDuration += duration;

            // Group by user
            if (!stats.byUser[session.userId]) {
                stats.byUser[session.userId] = {
                    id: session.userId,
                    name: session.User.name,
                    total: 0
                };
            }
            stats.byUser[session.userId].total += duration;

            // Group by board
            const board = session.Item?.Group?.Board;
            if (board) {
                if (!stats.byBoard[board.id]) {
                    stats.byBoard[board.id] = {
                        id: board.id,
                        name: board.name,
                        total: 0
                    };
                }
                stats.byBoard[board.id].total += duration;
            }
        });

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

