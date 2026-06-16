const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, escapeMarkdown } = require('discord.js');
const { Player, Match } = require('../../dbObjects.js');
const { calculateElo } = require('../../services/calculateElo.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('record-match')
        .setDescription('Record the outcome of a match against one or more opponents')
        .addUserOption(option => option.setName('1st_place').setDescription('The winner of the match').setRequired(true))
        .addStringOption(option => option.setName('2nd_place').setDescription('Second place player(s)').setRequired(true))
        .addStringOption(option => option.setName('3rd_place').setDescription('Third place player(s)').setRequired(false))
        .addStringOption(option => option.setName('4th_place').setDescription('Fourth place player(s)').setRequired(false)),

	async execute(interaction) {

        await interaction.deferReply();

        try{
            const winner = interaction.options.getUser('1st_place')

            const extractUserIds = (mentionString) => {
                if (!mentionString) return [];
                const regex = /<@!?(\d+)>/g;
                let match;
                const ids = [];
                while ((match = regex.exec(mentionString)) !== null) {
                    ids.push(match[1]);
                }
                return ids;
            };

            const [winnerPlayer] = await Player.findOrCreate({ 
                where: { discordId: winner.id, serverId: interaction.guildId }, 
                defaults: { username: winner.username, serverId: interaction.guildId } 
            });

            // Create JSON object array to keep track of Elo data
            let eloData = [
                {
                    player: winnerPlayer,
                    eloPre: winnerPlayer.currentElo,
                    place: 1,
                    eloChange: 0,
                    eloPost: 0
                }
            ];

            const loserPlayers = [];

            const processPlacement = async (mentionString, place) => {
                const ids = extractUserIds(mentionString);
                for (const id of ids) {
                    // Skip if user is already recorded in a higher placement
                    if (eloData.some(e => e.player.discordId === id)) continue;

                    let user;
                    try {
                        user = await interaction.client.users.fetch(id);
                    } catch (error) {
                        console.error(`Failed to fetch user ${id}`);
                        continue;
                    }

                    const [loserPlayer] = await Player.findOrCreate({
                        where: { discordId: id, serverId: interaction.guildId },
                        defaults: { username: user.username, serverId: interaction.guildId }
                    });

                    loserPlayers.push(loserPlayer);
                    eloData.push({
                        player: loserPlayer,
                        eloPre: loserPlayer.currentElo,
                        place: place,
                        eloChange: 0,
                        eloPost: 0
                    });
                }
            };

            await processPlacement(interaction.options.getString('2nd_place'), 2);
            await processPlacement(interaction.options.getString('3rd_place'), 3);
            await processPlacement(interaction.options.getString('4th_place'), 4);

            // Determine match type 
            let matchType;
            const totalPlayers = eloData.length;
            if (totalPlayers === 2) {
                matchType = '2p';
            } else if (totalPlayers === 3) {
                matchType = '3p';
            } else if (totalPlayers >= 4) {
                matchType = '4p';
            } else {
                return interaction.editReply('At least 2 players are needed for a match.');
            }

            // Calculate Elo changes
            eloData = calculateElo(eloData);

            // Update stats
            await winnerPlayer.increment(['matchesPlayedTotal', 'matchesWonTotal', `matchesPlayed${matchType}`, `matchesWon${matchType}`]);
            
            for (const loserPlayer of loserPlayers) {
                await loserPlayer.increment(['matchesPlayedTotal', `matchesPlayed${matchType}`]);
            }

            // Reload players to get updated stats from the database
            await winnerPlayer.reload();
            for (const loserPlayer of loserPlayers) {
                await loserPlayer.reload();
            }
            
            // Update currentElo, streaks, bestElo and worstElo
            for (const eloRecord of eloData) {
                const player = eloRecord.player;
                
                player.currentElo = eloRecord.eloPost;
                
                if (player.currentElo > player.bestElo) player.bestElo = player.currentElo;
                if (player.currentElo < player.worstElo) player.worstElo = player.currentElo;
                
                if (eloRecord.place === 1) {
                    player.currentWinStreak += 1;
                    player.currentLossStreak = 0;
                    if (player.currentWinStreak > player.maxWinStreak) player.maxWinStreak = player.currentWinStreak;
                } else {
                    player.currentLossStreak += 1;
                    player.currentWinStreak = 0;
                    if (player.currentLossStreak > player.maxLossStreak) player.maxLossStreak = player.currentLossStreak;
                }
                
                await player.save();
            }
        
            const match = await Match.create({
                winnerId: winnerPlayer.id,
                matchType: matchType,
                serverId: interaction.guildId
            });
            
            // Insert into UserMatch junction table
            for (const eloRecord of eloData) {
                await match.addPlayer(eloRecord.player, {
                    through: {
                        serverId: interaction.guildId,
                        eloBefore: eloRecord.eloPre,
                        eloAfter: eloRecord.eloPost
                    }
                });
            }

            // Create the message using the Elo data JSON object
            let message = '';
            for (const eloRecord of eloData) {
                const player = eloRecord.player;
                const sign = eloRecord.eloChange > 0 ? '+' : '';
                let emoji = '☠️';
                if (eloRecord.place === 1) emoji = '🥇';
                else if (eloRecord.place === 2) emoji = '🥈';
                else if (eloRecord.place === 3) emoji = '🥉';

                message += `${emoji} **${escapeMarkdown(player.username)}**: ${eloRecord.eloPre} → ${eloRecord.eloPost} (${sign}${eloRecord.eloChange})\n`;
            }

            const embed = new EmbedBuilder().setColor('#47a166').setTitle(`Match Recorded: ${matchType}`)
                .addFields({ name: 'Player Ratings', value: message })


            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error recording match:', error);
            await interaction.editReply('There was an error while trying to record the match.');
        }
	},
};