const PokedexApplication = require('../../applications/pokedex.application');
const experienceConfig = require('../../config/experience.config');

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const createUnicodeBar = (value, max, length) => {
    const filledLength = Math.round((value / max) * length);
    const emptyLength = length - filledLength;
    return '🟩'.repeat(filledLength) + '⬛'.repeat(emptyLength);
};

const createStatsDisplay = (stats) => {
    return stats.map(stat => {
        const statName = stat.name.replace('-', ' ').toUpperCase();
        const statValue = stat.value;
        const progressBar = createUnicodeBar(statValue, experienceConfig.levelUp.maxStatValue, 10);
        
        return `**${statName}**: ${statValue}\n${progressBar}`;
    }).join('\n\n');
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
    
    const formattedStats = pokemon.stats.map(stat => ({
        name: stat.stat.name,
        value: stat.base_stat
    }));
    
    const statsDisplay = createStatsDisplay(formattedStats);
    
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
        name: `${capitalize(pokemon.pokemon_name)} | ID: ${pokemon.user_pokemon_id}`,
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

const createPokemonInventoryEmbed = (inventory, member) => {
    const fields = [];
    
    for (let slot = 1; slot <= 3; slot++) {
        const pokemon = inventory.find(item => item.slot_position === slot);
        
        if (pokemon) {
            fields.push({
                name: `🎒 Slot ${slot}`,
                value: `**${pokemon.pokemon_data.pokemon_name}** (ID: ${pokemon.pokemon_data.user_pokemon_id})\nNiveau ${pokemon.pokemon_data.level} • ${pokemon.pokemon_data.experience} XP`,
                inline: true
            });
        } else {
            fields.push({
                name: `🎒 Slot ${slot}`,
                value: '*Vide*',
                inline: true
            });
        }
    }

    return {
        title: `📋 Inventaire de ${member.displayName}`,
        description: 'Vos Pokémon équipés (maximum 3)',
        fields: fields,
        color: 0x2ecc71
    };
};

const createPokemonInventoryAddEmbed = (inventoryItem) => {
    const embed = {
        title: '✅ Pokémon ajouté à l\'inventaire',
        fields: [
            {
                name: '🎯 Pokémon',
                value: inventoryItem.pokemon_data.pokemon_name,
                inline: true
            },
            {
                name: '🎒 Slot',
                value: inventoryItem.slot_position.toString(),
                inline: true
            },
            {
                name: '🆔 ID',
                value: inventoryItem.pokemon_data.user_pokemon_id.toString(),
                inline: true
            },
            {
                name: '📈 Niveau',
                value: inventoryItem.pokemon_data.level.toString(),
                inline: true
            },
            {
                name: '⭐ Expérience',
                value: inventoryItem.pokemon_data.experience.toString(),
                inline: true
            }
        ],
        color: 0x3498db
    };

    if (inventoryItem.pokemon_data.sprite_url) {
        embed.thumbnail = {
            url: inventoryItem.pokemon_data.sprite_url
        };
    }

    return embed;
};

const createPokemonInventoryRemoveEmbed = (pokemonData, slotPosition) => {
    const embed = {
        title: '✅ Pokémon retiré de l\'inventaire',
        description: 'Le Pokémon a été remis dans votre stockage.',
        fields: [
            {
                name: '🎯 Pokémon',
                value: pokemonData.pokemon_name,
                inline: true
            },
            {
                name: '🎒 Slot libéré',
                value: slotPosition.toString(),
                inline: true
            },
            {
                name: '🆔 ID',
                value: pokemonData.user_pokemon_id.toString(),
                inline: true
            }
        ],
        color: 0x3498db
    };

    if (pokemonData.sprite_url) {
        embed.thumbnail = {
            url: pokemonData.sprite_url
        };
    }

    return embed;
};

const createUserPokemonStatsEmbed = (userPokemon, pokemonStats) => {
    const formattedName = capitalize(userPokemon.pokemon_name);
    
    const formattedStats = [
        { name: 'hp', value: pokemonStats.hp },
        { name: 'attack', value: pokemonStats.attack },
        { name: 'defense', value: pokemonStats.defense },
        { name: 'special-attack', value: pokemonStats.special_attack },
        { name: 'special-defense', value: pokemonStats.special_defense },
        { name: 'speed', value: pokemonStats.speed }
    ];
    
    const statsDisplay = createStatsDisplay(formattedStats);
    
    const currentLevel = experienceConfig.calculateLevel(userPokemon.experience);
    const xpForCurrentLevel = experienceConfig.getXpForCurrentLevel(userPokemon.experience);
    const xpNeededForNext = experienceConfig.getXpNeededForNextLevel(userPokemon.experience);
    const totalXpForNextLevel = xpForCurrentLevel + xpNeededForNext;
    
    let experienceText = `${userPokemon.experience} XP total`;
    if (currentLevel < 100) {
        const progressBar = createUnicodeBar(xpForCurrentLevel, totalXpForNextLevel, 10);
        experienceText += `\n${progressBar}\n${xpForCurrentLevel}/${totalXpForNextLevel} XP (${xpNeededForNext} restant)`;
    } else {
        experienceText += `\n🏆 **NIVEAU MAX ATTEINT !**`;
    }
    
    const embed = {
        title: `📊 ${formattedName} | ID: ${userPokemon.user_pokemon_id}`,
        description: statsDisplay,
        fields: [
            {
                name: '📈 Niveau',
                value: currentLevel.toString(),
                inline: true
            },
            {
                name: '⭐ Expérience',
                value: experienceText,
                inline: false
            },
            {
                name: '🆔 Pokédex',
                value: `#${userPokemon.pokemon_api_id}`,
                inline: true
            }
        ],
        color: 0xe74c3c,
        thumbnail: {
            url: userPokemon.sprite_url
        },
        footer: {
            text: `${formattedName} - Votre Pokémon personnel`
        }
    };
    
    return embed;
};

const createPaginationButtons = (currentPage, totalPages, type, userId) => {
    if (totalPages <= 1) return [];
    
    return [{
        type: 1,
        components: [
            {
                type: 2,
                style: 2,
                label: '⏮️',
                custom_id: `${type}_first_${userId}`,
                disabled: currentPage === 0
            },
            {
                type: 2,
                style: 1,
                label: '◀️',
                custom_id: `${type}_previous_${userId}`,
                disabled: currentPage === 0
            },
            {
                type: 2,
                style: 1,
                label: '▶️',
                custom_id: `${type}_next_${userId}`,
                disabled: currentPage === totalPages - 1
            },
            {
                type: 2,
                style: 2,
                label: '⏭️',
                custom_id: `${type}_last_${userId}`,
                disabled: currentPage === totalPages - 1
            }
        ]
    }];
};

module.exports = {
    createPokemonInfoEmbed,
    createPokemonStatsEmbed,
    createPokemonStorageEmbed,
    createPokemonInventoryEmbed,
    createPokemonInventoryAddEmbed,
    createPokemonInventoryRemoveEmbed,
    createUserPokemonStatsEmbed,
    createPaginationButtons
}; 