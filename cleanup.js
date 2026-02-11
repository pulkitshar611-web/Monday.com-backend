const { sequelize, User, Board, Group, Item, Notification, File, Form } = require('./models');
const bcrypt = require('bcryptjs');

const rebuild = async () => {
  try {
    console.log('Starting DB Rebuild (FORCE SYNC)...');

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
