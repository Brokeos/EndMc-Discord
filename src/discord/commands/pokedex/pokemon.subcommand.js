const PokedexApplication = require('../../../applications/pokedex.application')

module.exports = {
    name: 'pokemon',
    data: subcommand => subcommand
        .setName('pokemon')
        .setDescription('Afficher les informations d\'un Pokémon')
        .addStringOption(option =>
            option.setName('nom')
                .setDescription('Le nom du Pokémon')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        
        const pokemonName = interaction.options.getString('nom');
        
        try {
            const pokemon = await PokedexApplication.getPokemon(pokemonName);
            const embed = {
                title: `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} | #${pokemon.id}`,
                image: {
                    url: pokemon.sprites.front_default
                },
                color: 0x0099FF,
                footer: {
                    text: `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} - #${pokemon.id}`
                }
            };

            await interaction.editReply({ embeds: [embed] });
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
