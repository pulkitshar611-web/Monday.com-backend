const { Board, Group, Item } = require('../models');

/**
 * Middleware to check if a user has 'full' access to a board.
 * Admins and Managers always have full access.
 * Regular users only have full access if they have at least one assigned task on the board.
 */
module.exports = async (req, res, next) => {
    try {
        const { id, role } = req.user;
        const isAdmin = role === 'Admin';
        const isManager = role === 'Manager';

        if (isAdmin || isManager) {
            return next();
        }

        // Determine target BoardId based on the request
        let boardId = req.params.boardId || req.body.BoardId;

        // If boardId is not directly available, try to infer it from other params
        if (!boardId && req.params.id) {
            // If the route is /api/boards/:id
            if (req.baseUrl.endsWith('/api/boards')) {
                boardId = req.params.id;
            }
            // If the route is /api/items/:id, find the board via group
            else if (req.baseUrl.endsWith('/api/items')) {
                const item = await Item.findByPk(req.params.id, {
                    include: [{ model: Group, attributes: ['BoardId'] }]
                });
                if (item && item.Group) {
                    boardId = item.Group.BoardId;
                }
            }
            // If the route is /api/groups/:id (if such route exists), find board
            else if (req.baseUrl.endsWith('/api/groups')) {
                const group = await Group.findByPk(req.params.id);
                if (group) {
                    boardId = group.BoardId;
                }
            }
        }

        // Fallback: If we still don't have boardId but have GroupId in body
        if (!boardId && req.body.GroupId) {
            const group = await Group.findByPk(req.body.GroupId);
            if (group) boardId = group.BoardId;
        }

        if (!boardId) {
            // If we can't determine the board, we can't check permissions.
            // Usually this means the resource doesn't exist or it's a global action.
            return next();
        }

        // Check if user has any assigned tasks on this board
        const assignmentCount = await Item.count({
            where: { assignedToId: id },
            include: [{
                model: Group,
                where: { BoardId: boardId }
            }]
        });

        if (assignmentCount > 0) {
            return next();
        }

        return res.status(403).json({
            msg: 'Access denied: You are not assigned to any tasks on this board.',
            code: 'BOARD_ACCESS_DENIED'
        });

    } catch (err) {
        console.error('Permission check error:', err);
        res.status(500).send('Server error during permission check');
    }
};
