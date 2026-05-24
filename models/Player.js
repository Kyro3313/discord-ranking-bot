module.exports = (sequelize, DataTypes) => {

  const Player = sequelize.define('Player', {
    discordId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },

    bio: {
      type: DataTypes.TEXT,
      defaultValue: "No description set."
    },

    matchesPlayedTotal: { type: DataTypes.INTEGER, defaultValue: 0 },
    matchesWonTotal: { type: DataTypes.INTEGER, defaultValue: 0 },
    
    matchesPlayed2p: { type: DataTypes.INTEGER, defaultValue: 0 },
    matchesWon2p: { type: DataTypes.INTEGER, defaultValue: 0 },

    matchesPlayed3p: { type: DataTypes.INTEGER, defaultValue: 0 },
    matchesWon3p: { type: DataTypes.INTEGER, defaultValue: 0 },

    matchesPlayed4p: { type: DataTypes.INTEGER, defaultValue: 0 },
    matchesWon4p: { type: DataTypes.INTEGER, defaultValue: 0 },
  }, {
    timestamps: true
  });
  return Player;
};