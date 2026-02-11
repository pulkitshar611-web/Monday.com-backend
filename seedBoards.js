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
      }
    ];

    for (const bData of boardsData) {
      const [board] = await Board.findOrCreate({
        where: { name: bData.name },
        defaults: { type: 'board' }
      });

      for (const gData of bData.groups) {
        const [group] = await Group.findOrCreate({
          where: { title: gData.title, BoardId: board.id },
          defaults: { color: gData.color }
        });

        for (const iData of gData.items) {
          await Item.findOrCreate({
            where: { name: iData.name, GroupId: group.id },
            defaults: { status: iData.status }
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
