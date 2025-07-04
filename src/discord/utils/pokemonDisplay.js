const PokedexApplication = require('../../applications/pokedex.application');

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const createUnicodeBar = (value, max, length) => {
    const filledLength = Math.round((value / max) * length);
    const emptyLength = length - filledLength;
    return '🟩'.repeat(filledLength) + '⬛'.repeat(emptyLength);
};

const createPokemonInfoEmbed = async (pokemonId) => {
    const pokemon = await PokedexApplication.getPokemon(pokemonId);
    const pokemonSpecies = await PokedexApplication.getPokemonSpecies(pokemonId);
    
    const abilities = pokemon.abilities.map(ability => capitalize(ability.ability.name)).join(', ');
    const types = pokemon.types.map(type => capitalize(type.type.name)).join(', ');
    const color = capitalize(pokemonSpecies.color.name);
    const habitat = capitalize(pokemonSpecies.habitat.name);
    const formattedName = capitalize(pokemon.name);
    
    const statsButton = {
        type: 1,
        components: [
            {
                type: 2,
                style: 1,
                label: "📊 Voir les stats",
                custom_id: `pokemon_stats_${pokemon.id}`
            }
        ]
    };
    
    const embed = {
        title: `${formattedName} | #${pokemon.id}`,
        fields: [
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

    return {
        embeds: [embed],
        components: [statsButton]
    };
};

const createPokemonStatsEmbed = async (pokemonId) => {
    const pokemon = await PokedexApplication.getPokemon(pokemonId);
    
    const statsDisplay = pokemon.stats.map(stat => {
        const statName = stat.stat.name.replace('-', ' ').toUpperCase();
        const statValue = stat.base_stat;
        const progressBar = createUnicodeBar(statValue, 255, 10);
        
        return `**${statName}**: ${statValue}\n${progressBar}`;
    }).join('\n\n');
    
    const backButton = {
        type: 1,
        components: [
            {
                type: 2,
                style: 2,
                label: "⬅️ Retour au Pokémon",
                custom_id: `pokemon_info_${pokemon.id}`
            }
        ]
    };
    
    const embed = {
        title: `📊 Base stats ${capitalize(pokemon.name)}`,
        description: statsDisplay,
        color: 0x3498db,
        thumbnail: {
            url: pokemon.sprites.front_default
        }
    };
    
    return {
        embeds: [embed],
        components: [backButton]
    };
};

const createPokemonStorageEmbed = (userPokemonList, member, page, totalPages) => {
    const startIndex = page * 5;
    const endIndex = Math.min(startIndex + 5, userPokemonList.length);
    const pokemonOnPage = userPokemonList.slice(startIndex, endIndex);
    
    const fields = pokemonOnPage.map(pokemon => ({
        name: `${capitalize(pokemon.pokemon_name)} | ID: ${pokemon.id}`,
        value: `Niveau: ${pokemon.level} | XP: ${pokemon.experience}`,
        inline: false
    }));

    return {
        title: `📦 Stockage Pokémon de ${member.displayName}`,
        fields: fields,
        color: 0x3498db,
        footer: {text: `Page ${page + 1}/${totalPages} • Total: ${userPokemonList.length}`}
    };
};

module.exports = {
    createPokemonInfoEmbed,
    createPokemonStatsEmbed,
    createPokemonStorageEmbed
}; 