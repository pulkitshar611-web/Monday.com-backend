const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('Admin', 'Manager', 'User'), defaultValue: 'User' },
  avatar: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
}, {
  tableName: 'users'
});

const Board = sequelize.define('Board', {
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: 'board' }, // pipeline, ai-future, etc.
  workspace: { type: DataTypes.STRING, defaultValue: 'Main Workspace' },
  folder: { type: DataTypes.STRING, defaultValue: 'General' }, // Active Projects, Commercial, etc.
  columns: { type: DataTypes.JSON }, // Store column definitions: [{id: 'status', title: 'Status', type: 'status'}, ...]
  isFavorite: { type: DataTypes.BOOLEAN, defaultValue: false },
  isArchived: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'boards'
});

const Folder = sequelize.define('Folder', {
  name: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'folders'
});

const Group = sequelize.define('Group', {
  title: { type: DataTypes.STRING, allowNull: false },
  color: { type: DataTypes.STRING }
}, {
  tableName: 'groups'
});

const Item = sequelize.define('Item', {
  name: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING }, // Main status
  person: { type: DataTypes.STRING }, // Legacy string field, prefer assignedToId
  timeline: { type: DataTypes.STRING },
  receivedDate: { type: DataTypes.STRING },
  progress: { type: DataTypes.INTEGER, defaultValue: 0 },
  timeTracking: { type: DataTypes.STRING, defaultValue: '00:00:00' },
  plannedTime: { type: DataTypes.STRING, defaultValue: '00:00:00' },
  payment: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  isSubItem: { type: DataTypes.BOOLEAN, defaultValue: false },
  // Flexible fields
  priority: { type: DataTypes.STRING },
  risk: { type: DataTypes.STRING }, // Low, Medium, High
  dealValue: { type: DataTypes.DECIMAL(10, 2) },
  dealStatus: { type: DataTypes.STRING }, // Lead, Negotiation, etc.
  invoiceSent: { type: DataTypes.BOOLEAN, defaultValue: false },
  aiModel: { type: DataTypes.STRING },
  source: { type: DataTypes.STRING }, // Lead source e.g. Instagram, Website
  urgency: { type: DataTypes.STRING }, // Priority e.g. Low, Medium, High
  expectedSubmissionDate: { type: DataTypes.STRING },
  revisionDates: { type: DataTypes.STRING },
  comments: { type: DataTypes.TEXT },
  isUnread: { type: DataTypes.BOOLEAN, defaultValue: false },
  customFields: { type: DataTypes.JSON }, // For any extra data
  // New fields for ItemDetailPanel tabs
  updates: { type: DataTypes.TEXT }, // JSON string of updates array
  filesData: { type: DataTypes.TEXT }, // JSON string of files array (renamed to avoid collision with association)
  activity: { type: DataTypes.TEXT }, // JSON string of activity log array
  parentItemId: { type: DataTypes.INTEGER, allowNull: true }, // For subitems
  subItemsData: { type: DataTypes.TEXT }, // JSON string of subitems array (renamed to avoid collision with association)
  connectTasks: { type: DataTypes.TEXT } // JSON string of connected tasks
}, {
  tableName: 'items'
});

const Notification = sequelize.define('Notification', {
  content: { type: DataTypes.STRING, allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  type: { type: DataTypes.STRING },
  link: { type: DataTypes.STRING }
}, {
  tableName: 'notifications'
});

const File = sequelize.define('File', {
  name: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  size: { type: DataTypes.INTEGER },
  type: { type: DataTypes.STRING },
  uploadedBy: { type: DataTypes.STRING }
}, {
  tableName: 'files'
});

const Form = sequelize.define('Form', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
  fields: { type: DataTypes.JSON }, // Store form structure as JSON
  isPublished: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'forms'
});

const Automation = sequelize.define('Automation', {
  trigger: { type: DataTypes.STRING, allowNull: false },
  triggerValue: { type: DataTypes.STRING },
  action: { type: DataTypes.STRING, allowNull: false },
  actionValue: { type: DataTypes.STRING },
  enabled: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'automations'
});

// Associations
User.hasMany(Notification, { foreignKey: 'UserId' });
Notification.belongsTo(User, { foreignKey: 'UserId' });

Board.hasMany(Group, { as: 'Groups', foreignKey: 'BoardId', onDelete: 'CASCADE' });
Group.belongsTo(Board, { foreignKey: 'BoardId' });

Group.hasMany(Item, { as: 'items', foreignKey: 'GroupId', onDelete: 'CASCADE' });
Item.belongsTo(Group, { foreignKey: 'GroupId' });

Item.hasMany(Item, { as: 'subItems', foreignKey: 'parentItemId', onDelete: 'CASCADE' });
Item.belongsTo(Item, { as: 'parentItem', foreignKey: 'parentItemId' });

User.hasMany(Item, { foreignKey: 'assignedToId' });
Item.belongsTo(User, { as: 'assignedUser', foreignKey: 'assignedToId' });

Item.hasMany(File, { as: 'files', foreignKey: 'ItemId', onDelete: 'CASCADE' });
File.belongsTo(Item, { foreignKey: 'ItemId' });
User.hasMany(File, { foreignKey: 'userId', onDelete: 'CASCADE' });
File.belongsTo(User, { foreignKey: 'userId' });

Board.hasMany(Form, { foreignKey: 'BoardId', onDelete: 'CASCADE' });
Form.belongsTo(Board, { foreignKey: 'BoardId' });

User.hasMany(Automation, { foreignKey: 'UserId' });
Automation.belongsTo(User, { foreignKey: 'UserId' });

module.exports = {
  sequelize,
  User,
  Board,
  Folder,
  Group,
  Item,
  Notification,
  File,
  Form,
  Automation
};
