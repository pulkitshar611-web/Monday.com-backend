require('dotenv').config();
const { Board, Group, Item, sequelize } = require('./models');

const seedSiraBoard = async () => {
    try {
        await sequelize.sync();

        const commercialSiraColumns = [
            { id: 'name', title: 'Item Name', type: 'text' },
            { id: 'person', title: 'Account Manager', type: 'person' },
            { id: 'dealValue', title: 'Deal Value', type: 'currency' },
            {
                id: 'dealStatus', title: 'Deal Status', type: 'status', options: [
                    { label: 'Lead', color: '#0085ff' },
                    { label: 'Negotiation', color: '#fdab3d' },
                    { label: 'Proposal Sent', color: '#ffcb00' },
                    { label: 'Won', color: '#00c875' },
                    { label: 'Lost', color: '#e2445c' }
                ]
            },
            { id: 'progress', title: 'Payment %', type: 'progress' },
            { id: 'invoiceSent', title: 'Invoice Sent', type: 'checkbox' },
            { id: 'expectedCloseDate', title: 'Expected Close Date', type: 'date' }
        ];

        const [board] = await Board.findOrCreate({
            where: { name: 'Commercial - SIRA' },
            defaults: {
                type: 'board',
                columns: commercialSiraColumns
            }
        });

        // Always update columns to match the latest design
        await board.update({ columns: commercialSiraColumns });

        const groups = [
            { id: 'active-deals', title: 'Active Deals', color: '#0085ff' },
            { id: 'closed-won', title: 'Closed Won', color: '#00c875' }
        ];

        for (const gData of groups) {
            const [group] = await Group.findOrCreate({
                where: { title: gData.title, BoardId: board.id },
                defaults: { color: gData.color }
            });

            if (gData.id === 'active-deals') {
                const items = [
                    { name: 'Global Solutions - Integration', assignedToId: 3, dealValue: 200000, dealStatus: 'Lead', progress: 10, invoiceSent: false, expectedCloseDate: '2025-03-15' },
                    { name: 'Acme Corp - Enterprise License', assignedToId: 1, dealValue: 150000, dealStatus: 'Negotiation', progress: 60, invoiceSent: false, expectedCloseDate: '2025-02-15' },
                    { name: 'TechStart Inc - Consulting', assignedToId: 2, dealValue: 75000, dealStatus: 'Proposal Sent', progress: 30, invoiceSent: false, expectedCloseDate: '2025-02-28' }
                ];
                for (const i of items) {
                    await Item.findOrCreate({
                        where: { name: i.name, GroupId: group.id },
                        defaults: i
                    });
                }
            } else if (gData.id === 'closed-won') {
                const items = [
                    { name: 'SmartCo - Annual Contract', assignedToId: 1, dealValue: 120000, dealStatus: 'Won', progress: 100, invoiceSent: true, expectedCloseDate: '2025-01-20' }
                ];
                for (const i of items) {
                    await Item.findOrCreate({
                        where: { name: i.name, GroupId: group.id },
                        defaults: i
                    });
                }
            }
        }

        console.log('Commercial - SIRA seeded successfully!');
    } catch (err) {
        console.error('Error seeding board:', err);
    } finally {
        process.exit();
    }
};

seedSiraBoard();
