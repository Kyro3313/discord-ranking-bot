module.exports = (sequelize, DataTypes) => {
  const Match = sequelize.define('Match', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    matchType: {
      type: DataTypes.ENUM,
      values: ['2p', '3p', '4p'],
      allowNull: false
    },
    durationInMinutes: {
      type: DataTypes.INTEGER, 
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    winnerId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Players',
        key: 'discordId'
      }
    }
  });
  return Match;
};