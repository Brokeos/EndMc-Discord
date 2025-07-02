const { createPokemonInfoEmbed, createPokemonStatsEmbed } = require('../utils/pokemonDisplay');

module.exports = {
	name: 'interactionCreate',
	once: false,
	
	async execute(interaction) {
		if (!interaction.isButton()) return;
		
		if (interaction.customId.startsWith("pokemon_stats_")) {
			await interaction.deferUpdate();
			
			const pokemonId = interaction.customId.split("_")[2];
			
			try {
				const pokemonDisplay = await createPokemonStatsEmbed(pokemonId);
				await interaction.editReply(pokemonDisplay);
			} catch (error) {
				if (error.message.includes('not found')) {
					await interaction.editReply({
						content: `❌ Pokémon "${pokemonId}" introuvable.`,
						embeds: [],
						components: []
					});
				} else {
					console.error('Erreur lors de la récupération du Pokémon:', error);
					await interaction.editReply({
						content: '❌ Une erreur est survenue lors de la récupération des données.',
						embeds: [],
						components: []
					});
				}
			}
		}
		
		if (interaction.customId.startsWith("pokemon_info_")) {
			await interaction.deferUpdate();
			
			const pokemonId = interaction.customId.split("_")[2];
			
			try {
				const pokemonDisplay = await createPokemonInfoEmbed(pokemonId);
				await interaction.editReply(pokemonDisplay);
			} catch (error) {
				if (error.message.includes('not found')) {
					await interaction.editReply({
						content: `❌ Pokémon "${pokemonId}" introuvable.`,
						embeds: [],
						components: []
					});
				} else {
					console.error('Erreur lors de la récupération du Pokémon:', error);
					await interaction.editReply({
						content: '❌ Une erreur est survenue lors de la récupération des données.',
						embeds: [],
						components: []
					});
				}
			}
		}
	}
}