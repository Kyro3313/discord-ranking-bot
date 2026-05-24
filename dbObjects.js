const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Player = require('./models/Player.js')(sequelize, Sequelize.DataTypes);
const Match = require('./models/Match.js')(sequelize, Sequelize.DataTypes);

// Define the junction table
const UserMatch = sequelize.define('UserMatch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
}, { 
  timestamps: false
});

// Many-to-Many
Player.belongsToMany(Match, { through: UserMatch, foreignKey: 'discordId' });
Match.belongsToMany(Player, { through: UserMatch, foreignKey: 'matchId' });

// One-to-Many
Match.belongsTo(Player, { 
  as: 'Winner', 
  foreignKey: 'winnerId' 
});
Player.hasMany(Match, {
  as: 'WonMatches', 
  foreignKey: 'winnerId' 
});

module.exports = { sequelize, Player, Match, UserMatch };
