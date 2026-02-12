const { sequelize } = require('./models');

async function migrateDatabase() {
    try {
        console.log('Starting database migration...');

        // This will add the new columns to existing tables
        await sequelize.sync({ alter: true });

        console.log('✅ Database migration completed successfully!');
        console.log('New columns added: updates, files, activity');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateDatabase();
