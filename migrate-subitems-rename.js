require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});

async function migrate() {
    try {
        // We already added subItems column, so we should drop it and add subItemsData in case it hasn't been migrated or needs renaming
        // Alternatively, just rename
        await sequelize.query(`
      ALTER TABLE Items 
      DROP COLUMN IF EXISTS subItems,
      ADD COLUMN IF NOT EXISTS subItemsData TEXT NULL
    `);
        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}

migrate();
