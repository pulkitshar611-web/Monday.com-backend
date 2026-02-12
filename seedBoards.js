require('dotenv').config();
const { Board, Group, Item, sequelize } = require('./models');

const seedBoards = async () => {
  try {
    await sequelize.sync({ alter: true });

    const boardsData = [
      {
        name: 'Project Pipeline',
        groups: [
          {
            title: 'Active Projects',
            color: '#0085ff',
            items: [
              { name: 'Website Redesign', status: 'Working on it' },
              { name: 'Mobile App API', status: 'Waiting' }
            ]
          },
          {
            title: 'Completed',
            color: '#00c875',
            items: [
              { name: 'Q1 Security Audit', status: 'Done' }
            ]
          }
        ]
      },
      {
        name: 'AI Future Projects',
        groups: [
          {
            title: 'Research Phase',
            color: '#a25ddc',
            items: [
              { name: 'LLM Fine-tuning', status: 'Working on it' },
              { name: 'Vision Model R&D', status: 'Stuck' }
            ]
          }
        ]
      },
      {
        name: 'DM Inquiries',
        columns: [
          { id: 'name', title: 'Inquiry Name', type: 'text' },
          { id: 'person', title: 'Assignee', type: 'person' },
          {
            id: 'source', title: 'Source', type: 'status', options: [
              { label: 'Instagram', color: '#e2445c' },
              { label: 'Website', color: '#0085ff' },
              { label: 'Email', color: '#00c875' },
              { label: 'WhatsApp', color: '#25d366' }
            ]
          },
          {
            id: 'urgency', title: 'Urgency', type: 'status', options: [
              { label: 'Low', color: '#0085ff' },
              { label: 'Medium', color: '#ffcb00' },
              { label: 'High', color: '#e2445c' }
            ]
          },
          {
            id: 'status', title: 'Status', type: 'status', options: [
              { label: 'New', color: '#0085ff' },
              { label: 'In Progress', color: '#fdab3d' },
              { label: 'Resolved', color: '#00c875' },
              { label: 'Spam', color: '#c4c4c4' }
            ]
          },
          { id: 'receivedDate', title: 'Received Date', type: 'date' }
        ],
        groups: [
          {
            title: 'New Inquiries',
            color: '#0085ff',
            items: [
              { name: 'Inquiry from Instagram', status: 'New', source: 'Instagram', urgency: 'High' },
              { name: 'Website Contact Form', status: 'In Progress', source: 'Website', urgency: 'Medium' }
            ]
          }
        ]
      }
    ];

    for (const bData of boardsData) {
      const [board] = await Board.findOrCreate({
        where: { name: bData.name },
        defaults: {
          type: 'board',
          columns: bData.columns || [
            { id: 'name', title: 'Item Name', type: 'text' },
            { id: 'person', title: 'Person', type: 'person' },
            { id: 'status', title: 'Status', type: 'status' },
            { id: 'timeline', title: 'Timeline', type: 'timeline' }
          ]
        }
      });

      for (const gData of bData.groups) {
        const [group] = await Group.findOrCreate({
          where: { title: gData.title, BoardId: board.id },
          defaults: { color: gData.color }
        });

        for (const iData of gData.items) {
          await Item.findOrCreate({
            where: { name: iData.name, GroupId: group.id },
            defaults: {
              status: iData.status,
              source: iData.source,
              urgency: iData.urgency
            }
          });
        }
      }
    }

    console.log('Boards and items seeded successfully!');
  } catch (err) {
    console.error('Error seeding boards:', err);
  } finally {
    process.exit();
  }
};

seedBoards();
