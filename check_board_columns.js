const { sequelize } = require('./models');

async function checkBoardsTable() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('boards');
        console.log('Columns in "boards" table:');
        console.log(JSON.stringify(Object.keys(tableInfo), null, 2));

        if (!tableInfo.columns) {
            console.log('MISSING COLUMN: columns');
        } else {
            console.log('Column "columns" exists and is of type:', tableInfo.columns.type);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkBoardsTable();
