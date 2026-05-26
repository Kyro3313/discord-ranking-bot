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
      defaultValue: "Set a description with \`\\setbio\`!"
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

  // Instance method to calculate win rate
  Player.prototype.getWinRate = function(matchType = 'Total') {
    const playedKey = `matchesPlayed${matchType}`;
    const wonKey = `matchesWon${matchType}`;

    const played = this.getDataValue(playedKey);
    const won = this.getDataValue(wonKey);

    if (played === 0) {
      return 0;
    }
    return Math.round((won / played) * 100);
  };
  return Player;
};