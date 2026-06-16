const { SlashCommandBuilder, EmbedBuilder, escapeMarkdown } = require('discord.js');
const { Player, Match } = require('../../dbObjects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('match-history')
		.setDescription('Display your last 10 played matches.'),

	async execute(interaction) {
		await interaction.deferReply();

		try {
			const user = interaction.options.getUser('user') || interaction.user;
			
			const player = await Player.findOne({ where: { discordId: user.id, serverId: interaction.guildId } });

			if (!player) {
				return interaction.editReply(`${escapeMarkdown(user.username)} has never played any matches!`);
			}

			// Get the last 10 matches for this player
			const matches = await player.getMatches({
				order: [['date', 'DESC']],
				limit: 10,
				include: [
					{ model: Player, as: 'Winner' },
					{ model: Player } 
				]
			});

			if (!matches || matches.length === 0) {
				return interaction.editReply(`${escapeMarkdown(user.username)} has no recorded matches.`);
			}

			let historyText = '';
            let winCount = 0;
			matches.forEach((match, index) => {
				const isWinner = match.winnerId === player.id;
				const result = isWinner ? '🥇 **Won**' : '☠️ **Lost**';
                
                if(isWinner){
                    winCount++;
                }
				
				const opponents = match.Players.filter(p => p.discordId !== player.discordId).map(p => `**${escapeMarkdown(p.username)}**`);
				const opponentsText = opponents.length > 0 ? `vs ${opponents.join(', ')}` : 'vs Unknown';

				// Format date using Discord relative timestamp
				const dateString = `<t:${Math.floor(match.date.getTime() / 1000)}:d>`; 

				historyText += `**${index + 1}.** ${result} ${opponentsText} (${match.matchType}) - ${dateString}\n`;
			});

            const embed = new EmbedBuilder()
				.setTitle(`${escapeMarkdown(player.username)}'s Match History`)
				.setColor('#5965ee')
                .setDescription(historyText)
				.setThumbnail(user.displayAvatarURL())
                .setFooter({ text: `You won ${Math.round(winCount / 10 * 100)}% your last 10 matches` });

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error('Error fetching match history:', error);
			await interaction.editReply('There was an error while trying to fetch your match history.');
		}
	},
};
