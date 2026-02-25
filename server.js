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
app.use('/api/roles', require('./routes/roles'));
app.use('/api/permissions', require('./routes/permissions'));
app.use('/api/folders', require('./routes/folders'));
app.use('/api/time', require('./routes/timeTracking'));



const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(async () => {
    console.log('Database connection established.');

    // 1. Initial sync to ensure tables exist
    await sequelize.sync();
    console.log('Initial sync completed.');

    // SAFE MIGRATION: Add columns if they are missing
    try {
      const queryInterface = sequelize.getQueryInterface();

      // Items migrations
      try {
        const tableInfo = await queryInterface.describeTable('items');
        const itemColumns = Object.keys(tableInfo).map(k => k.toLowerCase());

        const addCol = async (col, type, def = undefined) => {
          if (!itemColumns.includes(col.toLowerCase())) {
            console.log(`Adding missing column to items: ${col}`);
            const options = { type, allowNull: true };
            if (def !== undefined) options.defaultValue = def;
            await queryInterface.addColumn('items', col, options);
          }
        };

        await addCol('expectedSubmissionDate', DataTypes.STRING);
        await addCol('revisionDates', DataTypes.STRING);
        await addCol('comments', DataTypes.TEXT);
        await addCol('plannedTime', DataTypes.STRING, '00:00:00');
        await addCol('isUnread', DataTypes.BOOLEAN, false);
        await addCol('source', DataTypes.STRING);
        await addCol('urgency', DataTypes.STRING);
        await addCol('dealValue', DataTypes.DECIMAL(10, 2));
        await addCol('risk', DataTypes.STRING);
        await addCol('priority', DataTypes.STRING);
        await addCol('connectTasks', DataTypes.TEXT);
        await addCol('dateSubmitted', DataTypes.STRING);
        await addCol('comments2', DataTypes.TEXT);
        await addCol('people', DataTypes.STRING);
        await addCol('itemIdSerial', DataTypes.STRING);
        await addCol('subitems', DataTypes.STRING);
        await addCol('dealStatus', DataTypes.STRING);
        await addCol('invoiceSent', DataTypes.BOOLEAN, false);
        await addCol('aiModel', DataTypes.STRING);
        await addCol('customFields', DataTypes.JSON);
        await addCol('updates', DataTypes.TEXT);
        await addCol('filesData', DataTypes.TEXT);
        await addCol('activity', DataTypes.TEXT);
        await addCol('subItemsData', DataTypes.TEXT);
        await addCol('parentItemId', DataTypes.INTEGER);
        await addCol('payment', DataTypes.DECIMAL(10, 2), 0.00);
        await addCol('phone', DataTypes.STRING);
        await addCol('location', DataTypes.STRING);
        await addCol('link', DataTypes.TEXT);

        // Ensure assignedToId is STRING
        if (itemColumns.includes('assignedtoid')) {
          const actualKey = Object.keys(tableInfo).find(k => k.toLowerCase() === 'assignedtoid');
          if (tableInfo[actualKey].type.toLowerCase().includes('int')) {
            console.log('Migrating assignedToId from INT to STRING');
            await queryInterface.changeColumn('items', 'assignedToId', { type: DataTypes.STRING, allowNull: true });
          }
        }
      } catch (e) {
        console.warn('Items migration error:', e.message);
      }

      // Boards Migrations
      try {
        const boardTableInfo = await queryInterface.describeTable('boards');
        const boardColumns = Object.keys(boardTableInfo).map(k => k.toLowerCase());
        if (!boardColumns.includes('isfavorite')) await queryInterface.addColumn('boards', 'isFavorite', { type: DataTypes.BOOLEAN, defaultValue: false });
        if (!boardColumns.includes('isarchived')) await queryInterface.addColumn('boards', 'isArchived', { type: DataTypes.BOOLEAN, defaultValue: false });
        if (!boardColumns.includes('viewconfig')) await queryInterface.addColumn('boards', 'viewConfig', { type: DataTypes.TEXT, allowNull: true });
        if (!boardColumns.includes('ownerid')) await queryInterface.addColumn('boards', 'ownerId', { type: DataTypes.STRING, allowNull: true });
      } catch (e) {
        console.warn('Boards migration error:', e.message);
      }

      // Users Migrations
      try {
        const userTableInfo = await queryInterface.describeTable('users');
        const userColumns = Object.keys(userTableInfo).map(k => k.toLowerCase());
        if (!userColumns.includes('roleid')) await queryInterface.addColumn('users', 'roleId', { type: DataTypes.INTEGER, allowNull: true });
        if (!userColumns.includes('permissions')) await queryInterface.addColumn('users', 'permissions', { type: DataTypes.JSON, allowNull: true });
        if (!userColumns.includes('phone')) await queryInterface.addColumn('users', 'phone', { type: DataTypes.STRING, allowNull: true });
        if (!userColumns.includes('address')) await queryInterface.addColumn('users', 'address', { type: DataTypes.STRING, allowNull: true });
        if (!userColumns.includes('status')) await queryInterface.addColumn('users', 'status', { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' });

        if (userTableInfo.role && userTableInfo.role.type.toLowerCase().includes('enum')) {
          console.log('Migrating role from ENUM to STRING');
          await queryInterface.changeColumn('users', 'role', { type: DataTypes.STRING, defaultValue: 'User' });
        }
      } catch (e) {
        console.warn('Users migration error:', e.message);
      }

      // Roles Migrations
      try {
        const roleTableInfo = await queryInterface.describeTable('roles');
        const roleColumns = Object.keys(roleTableInfo).map(k => k.toLowerCase());
        if (!roleColumns.includes('permissions')) await queryInterface.addColumn('roles', 'permissions', { type: DataTypes.JSON, allowNull: true });
      } catch (e) {
        console.warn('Roles migration error:', e.message);
      }

    } catch (error) {
      console.error('Migration system error:', error.message);
    }

    // Final sync with alter: true to ensure everything is perfect
    return sequelize.sync({ alter: true });
  })
  .then(async () => {
    console.log('Database fully synced (alter: true applied)');

    // Seed Permissions
    const { Permission, Role } = require('./models');
    const existingPermCount = await Permission.count();
    if (existingPermCount === 0) {
      console.log('Seeding default permissions...');
      const defaultPerms = [
        { category: 'Account Settings', key: 'inviteUsers', label: 'Invite new team members' },
        { category: 'Account Settings', key: 'uploadFiles', label: 'Upload files to boards' },
        { category: 'Account Settings', key: 'deleteFiles', label: 'Permanently delete files' },
        { category: 'Account Settings', key: 'createWorkspaces', label: 'Create new workspaces' },
        { category: 'Board Management', key: 'createMainBoards', label: 'Create new boards' },
        { category: 'Board Management', key: 'deleteSelfOwnedBoards', label: 'Archive or delete self-owned boards' },
        { category: 'Board Management', key: 'createBoardViews', label: 'Create board views (Dashboard, Table, etc.)' },
        { category: 'Board Management', key: 'exportExcel', label: 'Export board data to Excel' },
        { category: 'Board Management', key: 'moveGroups', label: 'Move groups between boards' },
        { category: 'Item Management', key: 'deleteSelfItems', label: 'Delete self-created items' },
        { category: 'Item Management', key: 'deleteOtherItems', label: 'Delete items created by other users' },
        { category: 'Item Management', key: 'moveItems', label: 'Move items to different boards' },
        { category: 'User & Team Management', key: 'manageMembers', label: 'Manage team members' },
        { category: 'User & Team Management', key: 'viewTeams', label: 'View user profile pages' },
        { category: 'User & Team Management', key: 'editRoles', label: 'Modify user roles and permissions' }
      ];
      // Use ignoreDuplicates to avoid ER_DUP_ENTRY if some perms were already created
      await Permission.bulkCreate(defaultPerms, { ignoreDuplicates: true });
      console.log('✅ Permissions seeded.');
    }

    // Seed Roles
    const existingRoleCount = await Role.count();
    if (existingRoleCount === 0) {
      console.log('Seeding default roles...');
      const permsDefinitions = await Permission.findAll();
      const defaultPermsMap = {};
      permsDefinitions.forEach(p => defaultPermsMap[p.key] = false);

      const adminPerms = {};
      permsDefinitions.forEach(p => adminPerms[p.key] = true);

      const defaultRoles = [
        { name: 'Admin', permissions: adminPerms, isCustom: false },
        { name: 'Member', permissions: defaultPermsMap, isCustom: false },
        { name: 'Viewer', permissions: defaultPermsMap, isCustom: false },
        { name: 'Guest', permissions: defaultPermsMap, isCustom: false }
      ];
      // Use ignoreDuplicates for safety
      await Role.bulkCreate(defaultRoles, { ignoreDuplicates: true });
      console.log('✅ Roles seeded.');
    }

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
