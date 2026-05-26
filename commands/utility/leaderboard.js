const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Player, Match } = require('../../dbObjects.js');
const { Op } = require('sequelize');


module.exports = {
	data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Display a the leaderboard of the specified type of match. defaults to \"all\"')
        .addStringOption((option) =>
            option
                .setName('category')
                .setDescription('The gif category')
                .setRequired(false)
                .addChoices(
                    { name: 'all', value: 'Total' },
                    { name: '2p', value: '2p' },
                    { name: '3p', value: '3p' },
                    { name: '4p', value: '4p' },
                )),

	async execute(interaction) {

        // Defer the reply 
        await interaction.deferReply();

        try {

            const matchType = interaction.options.getString('category') || 'Total';

            // Fetch all players
            const allPlayers = await Player.findAll({
                where:{
                    matchesPlayedTotal: { [Op.gte]: 10 }
                }
            });

            allPlayers.sort((a, b) => {
                const winRateA = a.getWinRate(matchType);
                const winRateB = b.getWinRate(matchType);
                if (winRateA === winRateB) {
                    //Tiebreaker
                    return b[`matchesPlayedTotal`] - a[`matchesPlayedTotal`];
                }
                return winRateB - winRateA;
            });

            const topPlayers = allPlayers.slice(0, 10);

            if (topPlayers.length === 0) {
                return interaction.editReply('The leaderboard is currently empty. Go play some matches!');
            }

            const title = `Leaderboard (${matchType !== 'Total' ? matchType : 'All'})`

            const leaderboardEmbed = new EmbedBuilder()
                .setTitle(title)
                .setColor('#ffeb0c')
                .setFooter({ text: 'Brought to you by John Arcana' })

            // Format the player data into a readable list
            let leaderboardText = '';
            for (let i = 0; i < topPlayers.length; i++) {
                const player = topPlayers[i];

                leaderboardText += `**${i + 1}.** \`${player.username}\`: ${player.getWinRate(matchType)}% Winrate\n`;
            }

            leaderboardEmbed.setDescription(leaderboardText);

            await interaction.editReply({ embeds: [leaderboardEmbed] });

        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            await interaction.editReply('There was an error trying to fetch the leaderboard data from the database.');
        }
	},
};