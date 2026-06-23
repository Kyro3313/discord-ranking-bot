const { SlashCommandBuilder, EmbedBuilder, escapeMarkdown } = require('discord.js');
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
            const player = await Player.findOne({ where: { discordId: user.id, serverId: interaction.guildId } });

            if (!player) {
                return interaction.editReply("This user has never played any games!");
            }

            // This could probably be optimized
            
            // Get the ranking of the player based on total winrate
            const allPlayers = await Player.findAll({
                            where:{
                                matchesPlayedTotal: { [Op.gte]: 10 },
                                serverId: interaction.guildId
                            }
                        });
            
                        allPlayers.sort((a, b) => {
                            const eloA = a.currentElo;
                            const eloB = b.currentElo;
                            if (eloA === eloB) {
                                return b[`matchesPlayedTotal`] - a[`matchesPlayedTotal`];
                            }
                            return eloB - eloA;
                        });
            
            const leaderboardRanking = allPlayers.findIndex(u => u.discordId === user.id) + 1;          
            
            // Add Emoji if the player is in the top 3
            let leaderboardRankingDisplayed = ""
            let embedColor = "#5965ee"

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
                // If unranked the index is (-1 + 1) = 0
                case 0:
                    leaderboardRankingDisplayed = "";
                    embedColor = "#949494";
                    break
                default:
                    leaderboardRankingDisplayed = `${leaderboardRanking}#`;
            }

            const matches = await player.getMatches({
                order: [['date', 'DESC']],
                limit: 4,
                include: [
                    { model: Player } 
                ]
            });

            let recentMatchesText = '';
            if (matches && matches.length > 0) {
                matches.forEach((match) => {
                    const isWinner = match.winnerId === player.id;
                    const result = isWinner ? '🥇 **Won**' : '❌ **Lost**';
                    // Removed displayed opponents in favor of a more simple display.
                    // const opponents = match.Players.filter(p => p.discordId !== player.discordId).map(p => `${escapeMarkdown(p.username)}`);
                    // const opponentsText = opponents.length > 0 ? `vs ${opponents.join(', ')}` : 'vs Unknown';

                    // Format date using Discord relative timestamp
				    const dateString = `<t:${Math.floor(match.date.getTime() / 1000)}:d>`; 
                    recentMatchesText += `${result} on ${dateString}\n`;
                });
            } else {
                recentMatchesText = 'No recent matches.';
            }

            // Calculate streaks
            const allMatches = await player.getMatches({
                order: [['date', 'ASC']]
            });

            let currentWinStreak = 0;
            let maxWinStreak = 0;
            let currentLossStreak = 0;
            let maxLossStreak = 0;

            allMatches.forEach(match => {
                if (match.winnerId === player.id) {
                    currentWinStreak++;
                    currentLossStreak = 0;
                    if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
                } else {
                    currentLossStreak++;
                    currentWinStreak = 0;
                    if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
                }
            });

            const playerEmbed = new EmbedBuilder()
                .setTitle(`${leaderboardRankingDisplayed} ${escapeMarkdown(player.username)}`)
                .setColor(embedColor)
                .setThumbnail(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`)
                .setDescription(`${player.bio}`)    
                .addFields(
                { name: 'Current Elo', value: `**${player.currentElo}**`, inline: true },
                { name: 'Games Played', value: `${player.matchesPlayedTotal}`, inline: true },
                { name: 'Max/Min Elo', value: `Peak: ${player.bestElo}\nLowest: ${player.worstElo}`, inline: true },
	            )    
                .addFields(
                { name: 'Win Rate', value: `Total: ${player.getWinRate()}%\n2p: ${player.getWinRate('2p')}%\n3p: ${player.getWinRate('3p')}%\n4p: ${player.getWinRate('4p')}%`, inline: true },
                // Blank field for spacing
                { name: '\u200b', value: '\u200b', inline: true },
                { name: 'Recent Matches', value: recentMatchesText, inline: true },

	            )   
                .addFields(
                { name: 'Win Streak', value: `🔥 Current: ${player.currentWinStreak}\n🏆 Best: ${player.maxWinStreak}\n`, inline: true},
                { name: 'Loss Streak', value: `❄️ Current: ${player.currentLossStreak}\n🧊 Worst: ${player.maxLossStreak}\n`, inline: true},
	            )            

            if(leaderboardRanking === 0){
                playerEmbed.setFooter({text: `You are \`unranked\`.\n Play ${10 - player.matchesPlayedTotal} more matches to appear in the leaderboard.`})
            }

            await interaction.editReply({ embeds: [playerEmbed] });
        } catch (error) {
            console.error('Error fetching player data:', error);
            await interaction.editReply('There was an error while executing this command.');
        }
	},
};