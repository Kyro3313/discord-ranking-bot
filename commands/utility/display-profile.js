const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Users, Matches } = require('../../dbObjects.js');
const sequelize = require('sequelize');

module.exports = {
	data: new SlashCommandBuilder().setName('display-profile').
              setDescription('Display the stats of a player.')
              .addUserOption(option => option.setName('user').setDescription('Player to display').setRequired(true)),

	async execute(interaction) {

        // Defer the reply 
        await interaction.deferReply();

        try {

            // User is the discord.js user object, player is the row from the DB
            const user = interaction.options.getUser('user')
            const player = await Users.findOne({ where: { userId: user.id, username: user.username} });

            if (!player) {
                return interaction.editReply("This user is not in the database yet!");
            }


            // Find the user's rank
            const allPlayers = await Users.findAll({
                order: [['currentElo', 'DESC']]
            });
            const leaderboardRanking = allPlayers.findIndex(u => u.userId === player.userId) + 1;

            // Add Emoji if the player is in the top 3
            let leaderboardRankingDisplayed = ""
            let embedColor = "#57aaee"

            switch(leaderboardRanking){
                case 1:
                    leaderboardRankingDisplayed = "👑";
                    embedColor = "#ffcb51";
                    break
                case 2:
                    leaderboardRankingDisplayed = "🥈";
                    embedColor = "#cbd5dc";
                    break
                case 3:
                    leaderboardRankingDisplayed = "🥉";
                    embedColor = "#fe8b42";
                    break
                default:
                    leaderboardRankingDisplayed = `${leaderboardRanking}.`;
            }
            console.log(player.wins / player.matchesPlayed)
            const winRate = Math.round(player.wins / player.matchesPlayed * 100);
            const gamesPlayed = player.matchesPlayed;

            const playerEmbed = new EmbedBuilder()
                .setTitle(`${leaderboardRankingDisplayed} ${player.username}`)
                .setColor(embedColor)
                .setThumbnail(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`)
                .addFields(
                { name: 'Current Elo:', value: `**${player.currentElo}**`, inline: true },
                // { name: 'Leaderboard', value: '1', inline: true },
                // { name: '\u200B', value: '\u200B' },
                { name: 'Win Rate', value: `${winRate}%`, inline: true },
                { name: 'Games Played', value: `${gamesPlayed}`, inline: true },
	            )           
                .setFooter({ text: 'Brought to you by John Arcana' })

            await interaction.editReply({ embeds: [playerEmbed] });
        } catch (error) {
            console.error('Error fetching player data:', error);
            await interaction.editReply('There was an error while executing this command.');
        }
	},
};