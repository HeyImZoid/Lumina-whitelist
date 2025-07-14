// db.js
import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

const Whitelist = sequelize.define('Whitelist', {
  key: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  robloxUsername: {
    type: DataTypes.STRING,
    allowNull: false
  },
  discordId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  robloxId: {
  type: DataTypes.STRING,
  allowNull: true
  },
  whitelistType: {
    type: DataTypes.ENUM('Standard', 'Premium'),
    allowNull: false,
    defaultValue: 'Standard'
  }
});

export const Cooldown = sequelize.define('Cooldown', {
  discordId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  lastClaimed: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

await sequelize.sync({ alter: true }); // auto adds missing columns if safe
export { Whitelist };