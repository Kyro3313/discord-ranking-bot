const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Users, Matches } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder().setName('leaderboard').setDescription('Who is the best Arcana Showdown player?'),
	async execute(interaction) {

        // Defer the reply 
        await interaction.deferReply();

        try {
            // Fetch the top 10 users from the database
            const topPlayers = await Users.findAll({
                order: [['currentElo', 'DESC']], 
                limit: 10                
            });

            if (topPlayers.length === 0) {
                return interaction.editReply('The leaderboard is currently empty. Go play some matches!');
            }


            const leaderboardEmbed = new EmbedBuilder()
                .setTitle('🏆 Current ELO rankings')
                .setColor('#ffeb0c')
                .setFooter({ text: 'Brought to you by John Arcana' })

            // Format the player data into a readable list
            let leaderboardText = '';
            for (let i = 0; i < topPlayers.length; i++) {
                const player = topPlayers[i];

                leaderboardText += `**${i + 1}.** \`${player.username}\`: ${player.currentElo} Elo\n`;
            }

            leaderboardEmbed.setDescription(leaderboardText);

            await interaction.editReply({ embeds: [leaderboardEmbed] });

        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            await interaction.editReply('There was an error trying to fetch the leaderboard data from the database.');
        }
	},
};