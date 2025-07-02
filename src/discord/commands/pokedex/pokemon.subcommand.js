const PokedexApplication = require('../../../applications/pokedex.application')

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

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
        await interaction.deferReply({ flags: ['Ephemeral'] });
        
        const pokemonName = interaction.options.getString('nom');
        
        try {
            const pokemon = await PokedexApplication.getPokemon(pokemonName);
            const pokemonSpecies = await PokedexApplication.getPokemonSpecies(pokemonName);
            
            const abilities = pokemon.abilities.map(ability => capitalize(ability.ability.name)).join(', ');
            const types =  pokemon.types.map(type => capitalize(type.type.name)).join(', ');
            const color = capitalize(pokemonSpecies.color.name);
            const habitat = capitalize(pokemonSpecies.habitat.name);
            const formattedName = capitalize(pokemon.name);
            
            const embed = {
                title: `${formattedName} | #${pokemon.id}`,
                fields: [
                    {
                        name: '📖  About',
                        value: '\u200B',
                        inline: false
                    },
                    {
                        name: 'Abilities',
                        value: abilities,
                        inline: false
                    },
                    {
                        name: 'Types',
                        value: types,
                        inline: false
                    },
                    {
                        name: 'Color',
                        value: color,
                        inline: false
                    },
                    {
                        name: 'Capture Rate',
                        value: pokemonSpecies.capture_rate,
                        inline: false
                    },
                    {
                        name: 'Habitat',
                        value: habitat,
                        inline: false
                    },
                ],
                thumbnail: {
                    url: pokemon.sprites.front_default
                },
                color: 0x0099FF,
                footer: {
                    text: `${formattedName} - #${pokemon.id}`
                }
            };

            await interaction.editReply({
                embeds: [embed]
            });
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
