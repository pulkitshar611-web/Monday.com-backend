const { User, Board, Group, Item } = require('./models');

async function checkData() {
    try {
        const users = await User.findAll({ attributes: ['id', 'name', 'role'] });
        console.log('Users:', JSON.stringify(users, null, 2));

        const items = await Item.findAll({
            attributes: ['id', 'name', 'assignedToId'],
            include: [{
                model: Group,
                include: [{
                    model: Board,
                    attributes: ['id', 'name']
                }]
            }]
        });
        console.log('Items with Assignments:', JSON.stringify(items, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
