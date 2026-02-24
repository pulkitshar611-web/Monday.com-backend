const { Group } = require('./models');

async function check() {
    const group = await Group.findOne();
    console.log('Group attributes:', Object.keys(Group.rawAttributes));
    console.log('Group data:', group ? group.toJSON() : 'No groups');
    process.exit(0);
}

check();
