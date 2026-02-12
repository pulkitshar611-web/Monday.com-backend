require('dotenv').config();
const { Board, Group, Item, sequelize, User } = require('./models');

const seedInquiriesBoard = async () => {
    try {
        await sequelize.sync();

        // 1. Create specific users to match the UI screenshot
        const usersToCreate = [
            { name: 'Alice', email: 'alice@example.com', password: 'password123' },
            { name: 'Bob', email: 'bob@example.com', password: 'password123' },
            { name: 'Charlie', email: 'charlie@example.com', password: 'password123' }
        ];

        const users = {};
        for (const u of usersToCreate) {
            const [user] = await User.findOrCreate({
                where: { email: u.email },
                defaults: u
            });
            users[u.name] = user;
        }

        const dmInquiriesColumns = [
            { id: 'name', title: 'Item Name', type: 'text' },
            {
                id: 'source', title: 'Source', type: 'status', options: [
                    { label: 'Instagram', color: '#e2445c' },
                    { label: 'Email', color: '#00c875' },
                    { label: 'Website', color: '#0085ff' },
                    { label: 'WhatsApp', color: '#25d366' }
                ]
            },
            { id: 'person', title: 'Assigned Agent', type: 'person' },
            {
                id: 'urgency', title: 'Urgency', type: 'status', options: [
                    { label: 'High', color: '#e2445c' },
                    { label: 'Medium', color: '#ffcb00' },
                    { label: 'Low', color: '#0085ff' }
                ]
            },
            {
                id: 'status', title: 'Status', type: 'status', options: [
                    { label: 'New', color: '#0085ff' },
                    { label: 'Replied', color: '#fdab3d' },
                    { label: 'Resolved', color: '#00c875' },
                    { label: 'Spam', color: '#c4c4c4' }
                ]
            },
            { id: 'receivedDate', title: 'Received Date', type: 'date' }
        ];

        const [board] = await Board.findOrCreate({
            where: { name: 'DM Inquiries - Master Board' },
            defaults: {
                type: 'board',
                columns: dmInquiriesColumns
            }
        });

        // Always update columns to match the latest design
        await board.update({ columns: dmInquiriesColumns });

        const groups = [
            { id: 'unread', title: 'Unread', color: '#e2445c' },
            { id: 'in-progress', title: 'In Progress', color: '#ffcb00' }
        ];

        for (const gData of groups) {
            const [group] = await Group.findOrCreate({
                where: { title: gData.title, BoardId: board.id },
                defaults: { color: gData.color }
            });

            if (gData.id === 'unread') {
                const items = [
                    { name: 'Sarah Johnson - Product Inquiry', assignedToId: users['Alice'].id, source: 'Instagram', urgency: 'High', status: 'New', receivedDate: '2025-01-28', isUnread: true },
                    { name: 'Mike Chen - Bulk Order', assignedToId: users['Bob'].id, source: 'Email', urgency: 'Medium', status: 'New', receivedDate: '2025-01-27', isUnread: true }
                ];
                for (const i of items) {
                    await Item.upsert({
                        ...i,
                        GroupId: group.id
                    });
                }
            } else if (gData.id === 'in-progress') {
                const items = [
                    { name: 'Emma Davis - Custom Design', assignedToId: users['Charlie'].id, source: 'Website', urgency: 'Low', status: 'Replied', receivedDate: '2025-01-26', isUnread: false }
                ];
                for (const i of items) {
                    await Item.upsert({
                        ...i,
                        GroupId: group.id
                    });
                }
            }
        }

        console.log('DM Inquiries seeded successfully with Alice, Bob, and Charlie!');
    } catch (err) {
        console.error('Error seeding board:', err);
    } finally {
        process.exit();
    }
};

seedInquiriesBoard();
