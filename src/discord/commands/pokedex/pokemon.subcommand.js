const PokedexApplication = require('../../../applications/pokedex.application');
const { createPokemonInfoEmbed } = require('../../utils/pokemonDisplay');

module.exports = {
    name: 'pokemon',
    data: subcommand => subcommand
        .setName('pokemon')
        .setDescription('Afficher les informations d\'un Pokémon')
        .addStringOption(option =>
            option.setName('nom')
                .setDescription('Le nom ou ID du Pokémon')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: ['Ephemeral'] });
        
        const pokemonName = interaction.options.getString('nom');
        
        try {
            const pokemon = await PokedexApplication.getPokemon(pokemonName);
            const pokemonDisplay = await createPokemonInfoEmbed(pokemon.id);

            await interaction.editReply(pokemonDisplay);
        } catch (error) {
            if (error.message.includes('not found')) {
                await interaction.editReply({
                    content: `❌ Pokémon "${pokemonName}" introuvable.`
                });
            } else {
                console.error('Erreur lors de la récupération du Pokémon:', error);
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de la récupération des données.'
                });
            }
        }
    }
};
