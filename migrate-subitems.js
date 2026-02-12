require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});

async function migrate() {
    try {
        await sequelize.query(`
      ALTER TABLE Items 
      ADD COLUMN IF NOT EXISTS parentItemId INT NULL,
      ADD COLUMN IF NOT EXISTS subItems TEXT NULL
    `);
        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}

migrate();
