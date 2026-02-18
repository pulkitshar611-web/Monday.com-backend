const dotenv = require('dotenv');

dotenv.config();

const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const { DataTypes } = require('sequelize');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Global request logger
app.use((req, res, next) => {
  console.log(`[GLOBAL LOG] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/items', require('./routes/items'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/search', require('./routes/search'));
app.use('/api/files', require('./routes/files'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/automations', require('./routes/automations'));

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(async () => {
    console.log('Database connection established.');

    // SAFE MIGRATION: Add columns if they are missing
    try {
      const queryInterface = sequelize.getQueryInterface();
      const tableInfo = await queryInterface.describeTable('items');

      if (!tableInfo.expectedSubmissionDate) {
        console.log('Adding missing column: expectedSubmissionDate');
        await queryInterface.addColumn('items', 'expectedSubmissionDate', { type: DataTypes.STRING, allowNull: true });
      }
      if (!tableInfo.revisionDates) {
        console.log('Adding missing column: revisionDates');
        await queryInterface.addColumn('items', 'revisionDates', { type: DataTypes.STRING, allowNull: true });
      }
      if (!tableInfo.comments) {
        console.log('Adding missing column: comments');
        await queryInterface.addColumn('items', 'comments', { type: DataTypes.TEXT, allowNull: true });
      }
      if (!tableInfo.plannedTime) {
        console.log('Adding missing column: plannedTime');
        await queryInterface.addColumn('items', 'plannedTime', { type: DataTypes.STRING, defaultValue: '00:00:00' });
      }
      if (!tableInfo.isUnread) {
        console.log('Adding missing column: isUnread');
        await queryInterface.addColumn('items', 'isUnread', { type: DataTypes.BOOLEAN, defaultValue: false });
      }
      if (!tableInfo.source) {
        console.log('Adding missing column: source');
        await queryInterface.addColumn('items', 'source', { type: DataTypes.STRING, allowNull: true });
      }
      if (!tableInfo.urgency) {
        console.log('Adding missing column: urgency');
        await queryInterface.addColumn('items', 'urgency', { type: DataTypes.STRING, allowNull: true });
      }
      if (!tableInfo.dealValue) {
        console.log('Adding missing column: dealValue');
        await queryInterface.addColumn('items', 'dealValue', { type: DataTypes.DECIMAL(10, 2), allowNull: true });
      }
      if (!tableInfo.risk) {
        console.log('Adding missing column: risk');
        await queryInterface.addColumn('items', 'risk', { type: DataTypes.STRING, allowNull: true });
      }
      if (!tableInfo.priority) {
        console.log('Adding missing column: priority');
        await queryInterface.addColumn('items', 'priority', { type: DataTypes.STRING, allowNull: true });
      }
      if (!tableInfo.connectTasks) {
        console.log('Adding missing column: connectTasks');
        await queryInterface.addColumn('items', 'connectTasks', { type: DataTypes.TEXT, allowNull: true });
      }

      console.log('✅ All column migrations completed successfully.');
    } catch (error) {
      console.warn('⚠️  Table migration skipped (items table may not exist yet):', error.message);
      console.log('💡 If this is a fresh installation, please import the database schema first.');
    }

    // Boards Migrations
    try {
      const queryInterface2 = sequelize.getQueryInterface();
      const boardTableInfo = await queryInterface2.describeTable('boards');
      if (!boardTableInfo.isFavorite) {
        console.log('Adding missing column: isFavorite to boards');
        await queryInterface2.addColumn('boards', 'isFavorite', { type: DataTypes.BOOLEAN, defaultValue: false });
      }
      if (!boardTableInfo.isArchived) {
        console.log('Adding missing column: isArchived to boards');
        await queryInterface2.addColumn('boards', 'isArchived', { type: DataTypes.BOOLEAN, defaultValue: false });
      }
      if (!boardTableInfo.viewConfig) {
        console.log('Adding missing column: viewConfig to boards');
        await queryInterface2.addColumn('boards', 'viewConfig', { type: DataTypes.TEXT, allowNull: true });
      }
      console.log('✅ Boards table migrations completed successfully.');
    } catch (error) {
      console.warn('⚠️  Boards table migration skipped (boards table may not exist yet):', error.message);
    }

    return sequelize.sync();
  })
  .then(() => {
    console.log('Database synced');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// 404 Handler - MUST BE LAST
app.use((req, res) => {
  console.log(`[404 ERROR] No route found for: ${req.method} ${req.url}`);
  res.status(404).json({
    msg: "Requested endpoint not found",
    method: req.method,
    path: req.url
  });
});
