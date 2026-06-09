const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { Player, Match } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('record-match')
        .setDescription('Record the outcome of a match against one or more opponents')
        .addUserOption(option => option.setName('winner').setDescription('First user').setRequired(true))
        .addUserOption(option => option.setName('opponent-1').setDescription('The opponent').setRequired(true))
        .addUserOption(option => option.setName('opponent-2').setDescription('Second opponent, optional').setRequired(false))
        .addUserOption(option => option.setName('opponent-3').setDescription('Third opponent, optional').setRequired(false))
        .addIntegerOption(option => option.setName('duration').setDescription('Duration of the match in minutes').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction) {

        await interaction.deferReply();

        try{
            const winner = interaction.options.getUser('winner')

            const losers = [
                interaction.options.getUser('opponent-1'),
                interaction.options.getUser('opponent-2'),
                interaction.options.getUser('opponent-3')
            ].filter(Boolean);

            const duration = interaction.options.getInteger('duration') || 0;

            // Determine match type 
            let matchType;
            const totalPlayers = 1 + losers.length;
            if (totalPlayers === 2) {
                matchType = '2p';
            } else if (totalPlayers === 3) {
                matchType = '3p';
            } else if (totalPlayers === 4) {
                matchType = '4p';
            }

            const [winnerPlayer] = await Player.findOrCreate({ 
                where: { discordId: winner.id, serverId: interaction.guildId }, 
                defaults: { username: winner.username, serverId: interaction.guildId } 
            });
            const loserPlayers = [];
            for (const loser of losers) {
                const [loserPlayer] = await Player.findOrCreate({
                    where: { discordId: loser.id, serverId: interaction.guildId },
                    defaults: { username: loser.username, serverId: interaction.guildId }
                });
                loserPlayers.push(loserPlayer);
            }

            // Save stats before updating, to display them later
            const previousStats = [];
            previousStats.push(winnerPlayer.getWinRate(matchType));
            loserPlayers.forEach(player => previousStats.push(player.getWinRate(matchType)));

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
        
            const match = await Match.create({
                winnerId: winnerPlayer.id,
                durationInMinutes: duration,
                matchType: matchType,
                serverId: interaction.guildId
            });
            
            await match.setPlayers([winnerPlayer, ...loserPlayers], { through: { serverId: interaction.guildId } }); 

            // Create the message
            let message = '';
            for (let i = 0; i < totalPlayers; i++) {
                const player = (i === 0) ? winnerPlayer : loserPlayers[i - 1];
                const currentWinRate = player.getWinRate(matchType);
                if (i === 0){
                    message = `🥇 **${player.username}**: ${previousStats[i]}% → ${currentWinRate}%\n`;
                } else { 
                    message += `☠️ **${player.username}**: ${previousStats[i]}% → ${currentWinRate}%\n`;
                }
            }



            const embed = new EmbedBuilder().setColor('#47a166').setTitle(`Match Recorded: ${matchType}`)
                .addFields({ name: 'Player Ratings', value: message })

            if(duration !== 0){
                embed.setFooter({ text: `The match was ${duration} minutes long.` })
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error recording match:', error);
            await interaction.editReply('There was an error while trying to record the match.');
        }
	},
};