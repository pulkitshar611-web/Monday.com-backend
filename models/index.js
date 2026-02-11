const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
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
});

const Board = sequelize.define('Board', {
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: 'board' }, // pipeline, ai-future, etc.
  workspace: { type: DataTypes.STRING, defaultValue: 'Main Workspace' },
  folder: { type: DataTypes.STRING, defaultValue: 'General' }, // Active Projects, Commercial, etc.
  columns: { type: DataTypes.JSON } // Store column definitions: [{id: 'status', title: 'Status', type: 'status'}, ...]
});

const Folder = sequelize.define('Folder', {
  name: { type: DataTypes.STRING, allowNull: false }
});

const Group = sequelize.define('Group', {
  title: { type: DataTypes.STRING, allowNull: false },
  color: { type: DataTypes.STRING }
});

const Item = sequelize.define('Item', {
  name: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING }, // Main status
  person: { type: DataTypes.STRING }, // Legacy string field, prefer assignedToId
  timeline: { type: DataTypes.STRING },
  receivedDate: { type: DataTypes.STRING },
  progress: { type: DataTypes.INTEGER, defaultValue: 0 },
  timeTracking: { type: DataTypes.STRING, defaultValue: '00:00:00' },
  payment: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  isSubItem: { type: DataTypes.BOOLEAN, defaultValue: false },
  // Flexible fields
  priority: { type: DataTypes.STRING },
  risk: { type: DataTypes.STRING }, // Low, Medium, High
  dealValue: { type: DataTypes.DECIMAL(10, 2) },
  dealStatus: { type: DataTypes.STRING }, // Lead, Negotiation, etc.
  invoiceSent: { type: DataTypes.BOOLEAN, defaultValue: false },
  aiModel: { type: DataTypes.STRING },
  customFields: { type: DataTypes.JSON } // For any extra data
});

const Notification = sequelize.define('Notification', {
  content: { type: DataTypes.STRING, allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  type: { type: DataTypes.STRING },
  link: { type: DataTypes.STRING }
});

const File = sequelize.define('File', {
  name: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  size: { type: DataTypes.INTEGER },
  type: { type: DataTypes.STRING },
  uploadedBy: { type: DataTypes.STRING }
});

const Form = sequelize.define('Form', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
  fields: { type: DataTypes.JSON }, // Store form structure as JSON
  isPublished: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// Associations
User.hasMany(Notification);
Notification.belongsTo(User);

Board.hasMany(Group, { as: 'Groups', onDelete: 'CASCADE' });
Group.belongsTo(Board);

Group.hasMany(Item, { as: 'items', onDelete: 'CASCADE' });
Item.belongsTo(Group);

Item.hasMany(Item, { as: 'subItems', foreignKey: 'parentItemId', onDelete: 'CASCADE' });
Item.belongsTo(Item, { as: 'parentItem', foreignKey: 'parentItemId' });

User.hasMany(Item, { foreignKey: 'assignedToId' });
Item.belongsTo(User, { as: 'assignedUser', foreignKey: 'assignedToId' });

Item.hasMany(File, { as: 'files', onDelete: 'CASCADE' });
File.belongsTo(Item);
User.hasMany(File, { foreignKey: 'userId', onDelete: 'CASCADE' });
File.belongsTo(User, { foreignKey: 'userId' });

Board.hasMany(Form, { onDelete: 'CASCADE' });
Form.belongsTo(Board);

module.exports = {
  sequelize,
  User,
  Board,
  Folder,
  Group,
  Item,
  Notification,
  File,
  Form
};
