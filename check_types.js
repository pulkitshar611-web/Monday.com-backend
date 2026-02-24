const { Item } = require('./models');

async function check() {
    const items = await Item.findAll({ limit: 5 });
    items.forEach(i => {
        console.log(`Item: ${i.id}, assignedToId value: ${i.assignedToId}, type: ${typeof i.assignedToId}`);
    });
    process.exit(0);
}

check();
