const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Player, Match } = require('../../dbObjects.js');
const { Op } = require('sequelize');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('display-profile')
        .setDescription('Display the stats of a player.')
        .addUserOption(option => option.setName('user').setDescription('Player to display').setRequired(true)),

	async execute(interaction) {

        // Defer the reply 
        await interaction.deferReply();

        try {

            const user = interaction.options.getUser('user')
            const player = await Player.findOne({ where: { discordId: user.id, username: user.username} });

            if (!player) {
                return interaction.editReply("This user has never played any games!");
            }

            // This could probably be optimized
            
            // Get the ranking of the player based on total winrate
            const allPlayers = await Player.findAll({
                            where:{
                                matchesPlayedTotal: { [Op.gte]: 10 }
                            }
                        });
            
                        allPlayers.sort((a, b) => {
                            const winRateA = a.getWinRate();
                            const winRateB = b.getWinRate();
                            if (winRateA === winRateB) {
                                return b[`matchesPlayedTotal`] - a[`matchesPlayedTotal`];
                            }
                            return winRateB - winRateA;
                        });
            
            const index = allPlayers.findIndex(u => u.discordId === user.id);
            let leaderboardRanking = ''
            if(index === -1){
                leaderboardRanking = "\`unranked\`";
            } else{
                leaderboardRanking = allPlayers.findIndex(u => u.discordId === user.id) + 1;
            }
            
            
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
                case "\`unranked\`":
                    leaderboardRankingDisplayed = "\`unranked\`";
                    break
                default:
                    leaderboardRankingDisplayed = `${leaderboardRanking}.`;
            }

            const playerEmbed = new EmbedBuilder()
                .setTitle(`${leaderboardRankingDisplayed} ${player.username}`)
                .setColor(embedColor)
                .setThumbnail(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`)
                .addFields(
                { name: 'Total Winrate:', value: `**${player.getWinRate()}%**`, inline: true },
                { name: 'Games Played', value: `${player.matchesPlayedTotal}`, inline: true },
                { name: 'Bio', value: `${player.bio}`, inline: true },
                { name: 'Winrate (2p):', value: `**${player.getWinRate('2p')}%**`, inline: true },
                { name: 'Winrate (3p):', value: `**${player.getWinRate('3p')}%**`, inline: true },
                { name: 'Winrate (4p):', value: `**${player.getWinRate('4p')}%**`, inline: true },
                // { name: 'Leaderboard', value: '1', inline: true },
                // { name: '\u200B', value: '\u200B' },
                
                
	            )           
                .setFooter({ text: 'Brought to you by John Arcana' })

            await interaction.editReply({ embeds: [playerEmbed] });
        } catch (error) {
            console.error('Error fetching player data:', error);
            await interaction.editReply('There was an error while executing this command.');
        }
	},
};