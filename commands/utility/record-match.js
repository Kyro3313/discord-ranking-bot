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


            const [winnerPlayer] = await Player.findOrCreate({ where: { discordId: winner.id, username: winner.username} })
            const loserPlayers = [];
            for (const loser of losers) {
                const [loserPlayer] = await Player.findOrCreate({
                    where: { discordId: loser.id },
                    defaults: { username: loser.username }
                });
                loserPlayers.push(loserPlayer);
            }
        
            const match = await Match.create({
                winnerId: winnerPlayer.discordId,
                durationInMinutes: duration
            });

            const allPlayers = [winnerPlayer, ...loserPlayers];
            await match.setPlayers(allPlayers); 

            const newElos = Array(29).fill(5); 

            let message = `🥇 \`${winnerPlayer.username}\`: ${4} → ${newElos[0]} (${newElos[0] - 4 > 0 ? '+' : ''}${newElos[0] - 4})\n`;
            for (let i = 0; i < loserPlayers.length; i++) {
                message += `☠️ \`${loserPlayers[i].username}\`: ${4} → ${newElos[i + 1]} (${newElos[i + 1] - 4 > 0 ? '+' : ''}${newElos[i + 1] - 4})\n`;
            }

            const embed = new EmbedBuilder().setColor('#1e8bff').setTitle('Match Recorded!')
                .addFields({ name: 'Player Ratings', value: message })
                // .setFooter({ text: 'ELO changes calculated.' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error recording match:', error);
            await interaction.editReply('There was an error while trying to record the match.');
        }
	},
};