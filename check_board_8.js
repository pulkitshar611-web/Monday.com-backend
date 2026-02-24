const { Board, Group, Item } = require('./models');

async function check() {
    const board = await Board.findByPk(8, {
        include: [{
            model: Group,
            as: 'Groups',
            include: [{
                model: Item,
                as: 'items'
            }]
        }]
    });

    if (!board) {
        console.log('Board 8 not found');
        process.exit(0);
    }

    console.log('Board:', board.name);
    board.Groups.forEach(g => {
        console.log(`Group: ${g.title}, Items: ${g.items.length}`);
        g.items.forEach(i => {
            console.log(` - Item: ${i.name}, AssignedTo: ${i.assignedToId}`);
        });
    });
    process.exit(0);
}

check();
