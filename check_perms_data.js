const { Permission, Role, User } = require('./models');

async function checkPermissions() {
    try {
        const permissions = await Permission.findAll();
        console.log('--- Permission Keys ---');
        permissions.forEach(p => console.log(`- ${p.key}: ${p.label}`));

        const roles = await Role.findAll();
        console.log('\n--- Roles and their Permissions ---');
        roles.forEach(role => {
            console.log(`Role: ${role.name}`);
            console.log(`Permissions: ${JSON.stringify(role.permissions, null, 2)}`);
        });

        const users = await User.findAll({ limit: 5 });
        console.log('\n--- Users and their Roles/Permissions ---');
        users.forEach(user => {
            console.log(`User: ${user.name}, Role String: ${user.role}, Permissions: ${JSON.stringify(user.permissions, null, 2)}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPermissions();
