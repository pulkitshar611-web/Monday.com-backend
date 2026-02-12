const { sequelize, User, Board, Group, Item, Notification, File, Form, Folder } = require('./models');
const bcrypt = require('bcryptjs');

const rebuild = async () => {
  try {
    console.log('Starting DB Rebuild (FORCE SYNC)...');

    // Disable FK checks to allow dropping tables cleanly
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Explicitly drop tables that might be stuck
    const tables = [
      'board_files', 'board_notifications', 'board_items', 'board_groups', 'board_forms', 'board_boards', 'board_folders', 'board_users',
      'Files', 'Notifications', 'Items', 'Groups', 'Forms', 'Boards', 'Folders', 'Users'
    ];
    for (const table of tables) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`Dropped ${table}`);
      } catch (e) {
        console.log(`Failed to drop ${table}: `, e.message);
      }
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Force sync drops all tables and recreates them
    await sequelize.sync({ force: true });

    console.log('Tables recreated.');

    // Create a fresh admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await User.create({
      name: 'Admin',
      email: 'admin@monday.com',
      password: hashedPassword,
      role: 'Admin',
      status: 'active'
    });

    console.log('Cleanup complete. Only admin@monday.com remains.');
    process.exit(0);
  } catch (err) {
    console.error('Rebuild failed:', err);
    process.exit(1);
  }
};

rebuild();
