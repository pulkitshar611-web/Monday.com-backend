const bcrypt = require('bcryptjs');
require('dotenv').config();
const { User, Board, Group, Item, Notification, sequelize } = require('./models');

const seedData = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced. Seeding data...');

    const [admin] = await User.findOrCreate({
      where: { email: 'admin@monday.com' },
      defaults: {
        name: 'System Admin',
        password: await bcrypt.hash('admin123', 10),
        role: 'Admin',
        status: 'active'
      }
    });

    const userInstances = { 'System Admin': admin };

    // --- Active Projects Folder ---

    // Board: Project Pipeline
    const [pipelineBoard] = await Board.findOrCreate({
      where: { name: 'Project Pipeline' },
      defaults: {
        type: 'pipeline',
        folder: 'Active Projects',
        columns: JSON.stringify([
          { id: 'status', title: 'Status', type: 'status' },
          { id: 'priority', title: 'Priority', type: 'status' },
          { id: 'progress', title: 'Progress', type: 'progress' },
          { id: 'timeline', title: 'Timeline', type: 'timeline' }
        ])
      }
    });

    // Board: SIRA Projects
    const [siraBoard] = await Board.findOrCreate({
      where: { name: 'SIRA Projects' },
      defaults: {
        type: 'board',
        folder: 'Active Projects',
        columns: JSON.stringify([
          { id: 'name', title: 'Item Name', type: 'text' },
          { id: 'person', title: 'Person', type: 'person' },
          { id: 'status', title: 'Status', type: 'status' },
          { id: 'timeline', title: 'Timeline', type: 'timeline' },
          { id: 'receivedDate', title: 'Received Date', type: 'date' },
          { id: 'progress', title: 'Progress', type: 'progress' },
          { id: 'payment', title: 'Payment (Numbers)', type: 'payment' },
          { id: 'timeTracking', title: 'Time Tracking', type: 'time_tracking' }
        ])
      }
    });

    const [siraGroup] = await Group.findOrCreate({
      where: { title: 'Mustafa - Project Manager', BoardId: siraBoard.id },
      defaults: { color: '#00c875' }
    });

    /* Comment out dummy data items
    const siraItems = [
      { name: 'D25-117 Desert Leisure', assignedToId: admin.id, status: 'For Client Review', timeline: 'Aug 28 - Sep 9', receivedDate: '2025-08-28', progress: 50 },
      { name: 'D24-668 Magnus Tech', assignedToId: admin.id, status: 'Waiting for Details', timeline: 'Mar 21 - Mar 26', receivedDate: '2024-03-21', progress: 10 },
      { name: 'D23-269 Union Coop', assignedToId: admin.id, status: 'Waiting for VSS Cert', timeline: 'Sep 13 - Sep 16', receivedDate: '2023-09-13', progress: 0 },
      { name: 'D24-479 Capricorn', assignedToId: admin.id, status: '90% Payment', timeline: 'Jul 20 - Jul 27', receivedDate: '2024-07-20', progress: 80 }
    ];

    for (const item of siraItems) {
      await Item.findOrCreate({
        where: { name: item.name, GroupId: siraGroup.id },
        defaults: {
          ...item,
          BoardId: siraBoard.id, 
          payment: 0.00,
          timeTracking: '00:00:00'
        }
      });
    }
    */


    // --- AI & Innovation Folder ---

    // Board: AI Future Projects
    const [aiFutureBoard] = await Board.findOrCreate({
      where: { name: 'AI Future Projects' },
      defaults: {
        type: 'ai_future',
        folder: 'AI & Innovation',
        columns: JSON.stringify([
          { id: 'person', title: 'Owner', type: 'person' },
          { id: 'aiModel', title: 'AI Model', type: 'text' },
          { id: 'status', title: 'Status', type: 'status' },
          { id: 'risk', title: 'Risk Level', type: 'status' },
          { id: 'priority', title: 'Priority', type: 'status' },
          { id: 'timeline', title: 'Timeline', type: 'timeline' },
          { id: 'progress', title: 'Progress', type: 'progress' }
        ])
      }
    });

    await Group.findOrCreate({ where: { title: 'Upcoming Concepts', BoardId: aiFutureBoard.id }, defaults: { color: '#579bfc' } });

    await Group.findOrCreate({ where: { title: 'Experiments', BoardId: aiFutureBoard.id }, defaults: { color: '#a25ddc' } });

    // Board: AI R&D Roadmap
    await Board.findOrCreate({
      where: { name: 'AI R&D Roadmap' },
      defaults: {
        type: 'roadmap',
        folder: 'AI & Innovation',
        columns: JSON.stringify([
          { id: 'person', title: 'Owner', type: 'person' },
          { id: 'status', title: 'Status', type: 'status' },
          { id: 'timeline', title: 'Timeline', type: 'timeline' },
          { id: 'progress', title: 'Progress', type: 'progress' }
        ])
      }
    });


    // --- Commercial Folder ---

    // Board: Commercial - SIRA
    const [commercialBoard] = await Board.findOrCreate({
      where: { name: 'Commercial - SIRA' },
      defaults: {
        type: 'commercial',
        folder: 'Commercial',
        columns: JSON.stringify([
          { id: 'person', title: 'Account Manager', type: 'person' },
          { id: 'dealValue', title: 'Deal Value', type: 'payment' },
          { id: 'dealStatus', title: 'Deal Status', type: 'status' },
          { id: 'payment', title: 'Payment %', type: 'progress' },
          { id: 'invoiceSent', title: 'Invoice Sent', type: 'checkbox' },
          { id: 'receivedDate', title: 'Expected Close Date', type: 'date' }
        ])
      }
    });

    await Group.findOrCreate({ where: { title: 'Active Deals', BoardId: commercialBoard.id }, defaults: { color: '#0085ff' } });

    await Group.findOrCreate({ where: { title: 'Closed Won', BoardId: commercialBoard.id }, defaults: { color: '#00c875' } });

    // Board: DM Inquiries - Master Board
    await Board.findOrCreate({
      where: { name: 'DM Inquiries - Master Board' },
      defaults: {
        type: 'inquiries',
        folder: 'Commercial',
        columns: JSON.stringify([
          { id: 'status', title: 'Status', type: 'status' },
          { id: 'receivedDate', title: 'Date', type: 'date' },
          { id: 'person', title: 'Contact', type: 'text' }
        ])
      }
    });

    console.log('Seeding complete!');

  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    process.exit();
  }
};

seedData();
