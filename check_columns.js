const { sequelize } = require('./models');

async function describeTable() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('items');
        console.log('Columns in "items" table:');
        console.log(JSON.stringify(Object.keys(tableInfo), null, 2));
    } catch (err) {
        console.error('Error describing table:', err);
    } finally {
        process.exit();
    }
}

describeTable();
