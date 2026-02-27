const { sequelize } = require('./models');
const { DataTypes } = require('sequelize');

async function fix() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('time_sessions');
        const columns = Object.keys(tableInfo);
        console.log('Columns found in time_sessions:', columns.join(', '));
        const lowerColumns = columns.map(k => k.toLowerCase());

        if (!lowerColumns.includes('parentitemid')) {
            console.log('Adding parentItemId to time_sessions...');
            await queryInterface.addColumn('time_sessions', 'parentItemId', {
                type: DataTypes.BIGINT,
                allowNull: true
            });
            console.log('Done!');
        } else {
            console.log('parentItemId already exists.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

fix();
