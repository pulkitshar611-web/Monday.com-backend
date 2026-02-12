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
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('items');

    if (!tableInfo.expectedCloseDate) {
      console.log('Adding missing column: expectedCloseDate');
      await queryInterface.addColumn('items', 'expectedCloseDate', { type: DataTypes.STRING, allowNull: true });
    }
    if (!tableInfo.isUnread) {
      console.log('Adding missing column: isUnread');
      await queryInterface.addColumn('items', 'isUnread', { type: DataTypes.BOOLEAN, defaultValue: false });
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
