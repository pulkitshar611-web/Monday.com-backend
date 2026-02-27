require('dotenv').config();
const { Board, sequelize } = require('./models');

const updatePayroll = async () => {
    try {
        const board = await Board.findOne({ where: { name: 'Payroll Management' } });
        if (board) {
            let cols = board.columns;
            console.log('Columns type:', typeof cols);

            // Handle if cols is a string (some environments might not auto-parse JSON)
            if (typeof cols === 'string') {
                try {
                    cols = JSON.parse(cols);
                } catch (e) {
                    console.error('Failed to parse columns JSON string');
                    process.exit();
                }
            }

            if (!Array.isArray(cols)) {
                console.log('Columns is not an array, it is:', cols);
                process.exit();
            }

            // Update the 'name' column to type 'person'
            const updatedCols = cols.map(c => {
                if (c.id === 'name') {
                    return { ...c, title: 'Employee Name', type: 'person' };
                }
                return c;
            });

            await board.update({ columns: updatedCols });
            console.log('Payroll board columns updated: Employee Name is now a People column.');
        } else {
            console.log('Payroll Management board not found.');
        }
    } catch (err) {
        console.error('Error updating payroll board:', err);
    } finally {
        process.exit();
    }
};

updatePayroll();
