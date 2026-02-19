require('dotenv').config();
const { Board, sequelize } = require('./models');

const updateSiraColumns = async () => {
    try {
        await sequelize.sync({ alter: true }); // This will add the new columns if they don't exist

        const commercialSiraColumns = [
            { id: 'itemIdSerial', title: 'Item ID (auto generated)', type: 'text' },
            { id: 'name', title: 'Name', type: 'text' },
            { id: 'subitems', title: 'Subitems', type: 'text' },
            { id: 'person', title: 'Person', type: 'person' },
            { id: 'receivedDate', title: 'Received Date', type: 'date' },
            { id: 'expectedSubmissionDate', title: 'Submission Date', type: 'date' },
            { id: 'dateSubmitted', title: 'Date Submiited', type: 'date' },
            {
                id: 'status', title: 'Status', type: 'status', options: [
                    { label: 'Working on it', color: '#fdab3d' },
                    { label: 'Done', color: '#00c875' },
                    { label: 'Stuck', color: '#e2445c' },
                    { label: 'Waiting', color: '#0085ff' },
                    { label: 'For Client Review', color: '#ffcb00' },
                    { label: 'Waiting for Details', color: '#0086c0' },
                    { label: 'Waiting for VSS Cert', color: '#e2445c' },
                    { label: '90% Payment', color: '#a25ddc' },
                    { label: 'Lead', color: '#0085ff' },
                    { label: 'Negotiation', color: '#fdab3d' },
                    { label: 'Proposal Sent', color: '#ffcb00' },
                    { label: 'Won', color: '#00c875' },
                    { label: 'Lost', color: '#e2445c' },
                    { label: 'Research', color: '#0085ff' },
                    { label: 'POC', color: '#a25ddc' },
                    { label: 'MVP', color: '#ffcb00' }
                ]
            },
            { id: 'people', title: 'People', type: 'people' },
            { id: 'comments', title: 'Comments', type: 'text' },
            { id: 'comments2', title: 'Comments #2', type: 'text' },
            { id: 'source', title: 'Source of inquiry', type: 'text' }
        ];

        const board = await Board.findOne({
            where: { name: 'Commercial - SIRA' }
        });

        if (board) {
            await board.update({ columns: commercialSiraColumns });
            console.log('Commercial - SIRA board columns updated successfully!');
        } else {
            console.log('Commercial - SIRA board not found.');
        }

    } catch (err) {
        console.error('Error updating board:', err);
    } finally {
        process.exit();
    }
};

updateSiraColumns();
