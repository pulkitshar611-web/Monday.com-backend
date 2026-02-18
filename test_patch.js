const { Item } = require('./models');

async function testUpdate() {
    try {
        const item = await Item.findOne(); // Get any item
        if (!item) {
            console.log('No items found to test update.');
            return;
        }
        console.log('Testing update for Item:', item.id);
        await item.update({ expectedSubmissionDate: '2026-03-01' });

        const updated = await Item.findByPk(item.id);
        console.log('Updated expectedSubmissionDate:', updated.expectedSubmissionDate);
    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        process.exit();
    }
}

testUpdate();
