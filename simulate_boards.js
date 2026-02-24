const { Board, Group, Item, User } = require('./models');

async function simulate() {
    const userId = 2; // Kiaan tech
    const reqUser = { id: userId, role: 'User' };

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
                { model: User, as: 'assignedUser', attributes: ['name', 'email', 'avatar'] }
            ]
        }]
    }];

    const allBoards = await Board.findAll({
        include: commonInclude
    });

    const assignedItems = await Item.findAll({
        where: { assignedToId: String(userId) },
        include: [{
            model: Group,
            // as: 'Group', // Association name might be Group
            attributes: ['BoardId']
        }]
    });

    console.log('Assigned items count:', assignedItems.length);
    const assignedBoardIds = [...new Set(assignedItems.map(item => {
        // Sequelize defaults to model name if as is not specified
        // But look at item.toJSON() to be sure
        const json = item.toJSON();
        return json.Group?.BoardId || json.group?.BoardId;
    }).filter(id => id))];

    console.log('Assigned board IDs:', assignedBoardIds);

    const filteredBoards = allBoards
        .map(b => {
            const board = b.toJSON();
            const isAssigned = assignedBoardIds.includes(b.id);
            if (isAssigned) board.access = 'full';
            else board.access = 'view';
            return board;
        })
        .filter(b => b.access === 'full');

    console.log('Filtered boards count:', filteredBoards.length);
    if (filteredBoards.length > 0) {
        console.log('First board name:', filteredBoards[0].name);
        const groups = filteredBoards[0].Groups || [];
        console.log('Groups in first board:', groups.length);
        if (groups.length > 0) {
            const items = groups[0].items || [];
            console.log('Items in first group:', items.length);
            const myItems = items.filter(i => String(i.assignedToId) === String(userId));
            console.log('My items in first group:', myItems.length);
        }
    }
    process.exit(0);
}

simulate();
