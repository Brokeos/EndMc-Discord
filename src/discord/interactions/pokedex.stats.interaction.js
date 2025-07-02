const PokedexApplication = require("../../applications/pokedex.application");

const createUnicodeBar = (value, max, length) => {
	const filledLength = Math.round((value / max) * length);
	const emptyLength = length - filledLength;
	return '🟩'.repeat(filledLength) + '⬛'.repeat(emptyLength);
};

module.exports = {
	name: 'interactionCreate',
	once: false,
	
	async execute(interaction) {
		if (!interaction.isButton()) return;
		if (!interaction.customId.startsWith("pokemon_stats_")) return;
		
		await interaction.deferReply({ flags: ['Ephemeral'] });
		
		const pokemonId = interaction.customId.split("_")[2];
		
		try {
			const pokemon = await PokedexApplication.getPokemon(pokemonId);
			const statsDisplay = pokemon.stats.map(stat => {
				const statName = stat.stat.name.replace('-', ' ').toUpperCase();
				const statValue = stat.base_stat;
				const progressBar = createUnicodeBar(statValue, 255, 10);
				
				return `**${statName}**: ${statValue}\n${progressBar}`;
			}).join('\n\n');
			
			const embed = {
				title: `📊 Base stats ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}`,
				description: statsDisplay,
				color: 0x3498db,
				thumbnail: {
					url: pokemon.sprites.front_default
				}
			};
			
			await interaction.editReply({
				embeds: [embed]
			});
			
		} catch (error) {
			if (error.message.includes('not found')) {
				await interaction.editReply({
					content: `❌ Pokémon "${pokemonId}" introuvable.`
				});
			} else {
				console.error('Erreur lors de la récupération du Pokémon:', error);
				await interaction.editReply({
					content: '❌ Une erreur est survenue lors de la récupération des données.'
				});
			}
		}
	}
}