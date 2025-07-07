const experienceConfig = require('../../config/experience.config');

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const createChallengeEmbed = (challenger, challenged) => {
    return {
        title: '🥊 Défi de Duel!',
        description: `${challenger.displayName} défie ${challenged.displayName} en duel Pokémon!`,
        fields: [
            {
                name: '⏰ Expiration',
                value: `${experienceConfig.duel.challengeTimeoutMinutes} minutes`,
                inline: true
            },
            {
                name: '📋 Instructions',
                value: `${challenged.displayName} peut utiliser \`/duel accept @${challenger.displayName}\` pour accepter le défi.`,
                inline: false
            }
        ],
        color: 0xFFD700,
        timestamp: new Date()
    };
};

const createChallengeAcceptedEmbed = (challenger, challenged) => {
    return {
        title: '⚔️ Duel Accepté!',
        description: `${challenged.displayName} a accepté le défi de ${challenger.displayName}!\nLe combat va commencer...`,
        color: 0x00FF00,
        timestamp: new Date()
    };
};

const createCombatStartEmbed = (challenger, challenged, challengerTeam, challengedTeam) => {
    const challengerPokemonList = challengerTeam
        .map((pokemon, index) => `${index + 1}. ${capitalize(pokemon.pokemon_data.pokemon_name)} (Niv. ${pokemon.pokemon_data.level})`)
        .join('\n');
    
    const challengedPokemonList = challengedTeam
        .map((pokemon, index) => `${index + 1}. ${capitalize(pokemon.pokemon_data.pokemon_name)} (Niv. ${pokemon.pokemon_data.level})`)
        .join('\n');

    return {
        title: '🎯 Combat en Cours',
        description: `Combat entre ${challenger.displayName} et ${challenged.displayName}`,
        fields: [
            {
                name: `⚔️ Équipe ${challenger.displayName}`,
                value: challengerPokemonList || 'Aucun Pokémon',
                inline: true
            },
            {
                name: `⚔️ Équipe ${challenged.displayName}`,
                value: challengedPokemonList || 'Aucun Pokémon',
                inline: true
            }
        ],
        color: 0xFF4500,
        timestamp: new Date()
    };
};

const createCombatActionEmbed = (actionData, challengerName, challengedName, attackerPokemon) => {
    const attackerOwnerName = actionData.attackerOwner === 'challenger' ? challengerName : challengedName;
    const defenderOwnerName = actionData.defenderOwner === 'challenger' ? challengerName : challengedName;
    
    if (actionData.isCriticalFailure) {
        return {
            description: `💥 **${capitalize(actionData.attacker)}** (${attackerOwnerName}) rate complètement son attaque contre **${capitalize(actionData.defender)}** (${defenderOwnerName})!`,
            fields: [
                {
                    name: '❌ Échec Critique',
                    value: 'L\'attaque a échoué et n\'inflige aucun dégât!',
                    inline: false
                },
                {
                    name: '❤️ Points de vie',
                    value: `${capitalize(actionData.defender)}: ${actionData.remainingHp}/${actionData.maxHp} HP`,
                    inline: true
                }
            ],
            color: 0x808080,
            timestamp: new Date(),
            thumbnail: attackerPokemon && attackerPokemon.pokemon_data.sprite_url ? {
                url: attackerPokemon.pokemon_data.sprite_url
            } : undefined
        };
    }
    
    const attackTypeIcon = actionData.attackType === 'special' ? '✨' : '⚔️';
    const attackTypeName = actionData.attackType === 'special' ? 'spéciale' : 'physique';
    
    const embed = {
        description: `${attackTypeIcon} **${capitalize(actionData.attacker)}** (${attackerOwnerName}) utilise une attaque ${attackTypeName} contre **${capitalize(actionData.defender)}** (${defenderOwnerName}) et inflige **${actionData.damage}** dégâts!`,
        color: actionData.isDead ? 0xFF0000 : 0xFFA500,
        timestamp: new Date(),
        thumbnail: attackerPokemon && attackerPokemon.pokemon_data.sprite_url ? {
            url: attackerPokemon.pokemon_data.sprite_url
        } : undefined
    };

    if (actionData.isDead) {
        embed.fields = [
            {
                name: '💀 K.O.',
                value: `${capitalize(actionData.defender)} est hors combat!`,
                inline: false
            }
        ];
    } else {
        embed.fields = [
            {
                name: '❤️ Points de vie',
                value: `${capitalize(actionData.defender)}: ${actionData.remainingHp}/${actionData.maxHp} HP`,
                inline: true
            }
        ];
    }

    return embed;
};

const createPokemonChangeEmbed = (changeData, challengerName, challengedName, newPokemon) => {
    const ownerName = changeData.owner === 'challenger' ? challengerName : challengedName;
    
    return {
        title: '🔄 Changement de Pokémon',
        description: `**${ownerName}** envoie **${capitalize(changeData.newPokemon)}** au combat!`,
        color: 0x4169E1,
        timestamp: new Date(),
        thumbnail: newPokemon && newPokemon.pokemon_data.sprite_url ? {
            url: newPokemon.pokemon_data.sprite_url
        } : undefined
    };
};

const createCombatResultEmbed = (winnerId, loserId, challengerId, challengedId, challengerName, challengedName, combatResult) => {
    const winnerName = winnerId === challengerId ? challengerName : challengedName;
    const loserName = winnerId === challengerId ? challengedName : challengerName;

    const challengerTeamStatus = combatResult.challengerTeam
        .map(p => `${capitalize(p.name)}: ${p.finalHp}/${p.maxHp} HP${p.finalHp === 0 ? ' 💀' : ''}`)
        .join('\n');

    const challengedTeamStatus = combatResult.challengedTeam
        .map(p => `${capitalize(p.name)}: ${p.finalHp}/${p.maxHp} HP${p.finalHp === 0 ? ' 💀' : ''}`)
        .join('\n');

    const winnerTeamData = winnerId === challengerId ? combatResult.challengerTeamData : combatResult.challengedTeamData;
    const winnerPokemon = winnerTeamData ? winnerTeamData.find(pokemon => pokemon.currentHp > 0) : null;

    const embed = {
        title: '🏆 Résultat du Duel',
        description: `**${winnerName}** remporte le duel contre **${loserName}** 💀!`,
        fields: [
            {
                name: '📈 Récompenses',
                value: `**Gagnant:** +${experienceConfig.duel.experience.winXpGain} XP\n**Perdant:** -${experienceConfig.duel.experience.loseXpLoss} XP`,
                inline: false
            },
            {
                name: `📊 Équipe ${challengerName}`,
                value: challengerTeamStatus || 'Aucun Pokémon',
                inline: true
            },
            {
                name: `📊 Équipe ${challengedName}`,
                value: challengedTeamStatus || 'Aucun Pokémon',
                inline: true
            }
        ],
        color: 0x00FF00,
        timestamp: new Date()
    };

    if (winnerPokemon && winnerPokemon.pokemon_data.sprite_url) {
        embed.thumbnail = {
            url: winnerPokemon.pokemon_data.sprite_url
        };
        
        embed.description = `**${winnerName}** remporte le duel contre **${loserName}**!\n🏆 **${capitalize(winnerPokemon.pokemon_data.pokemon_name)}** est le vainqueur avec ${winnerPokemon.currentHp}/${winnerPokemon.maxHp} HP restants!`;
    }

    return embed;
};

const createErrorEmbed = (error) => {
    return {
        title: '❌ Erreur',
        description: error,
        color: 0xFF0000,
        timestamp: new Date()
    };
};

const createHealingStatusEmbed = (guildId, userId, inventory, healingTimes) => {
    const healingStatus = inventory.map((pokemon, index) => {
        const healingTime = healingTimes[pokemon.user_pokemon_id];
        if (healingTime > 0) {
            return `${capitalize(pokemon.pokemon_data.pokemon_name)}: 🕐 ${healingTime} min restantes`;
        } else {
            return `${capitalize(pokemon.pokemon_data.pokemon_name)}: ✅ Soigné`;
        }
    }).join('\n');

    return {
        title: '🏥 Statut de Guérison',
        description: healingStatus || 'Aucun Pokémon dans l\'inventaire',
        color: 0x87CEEB,
        timestamp: new Date()
    };
};

const createValidationErrorEmbed = (error) => {
    return {
        title: '⚠️ Impossible de défier',
        description: error,
        color: 0xFFA500,
        timestamp: new Date()
    };
};

module.exports = {
    createChallengeEmbed,
    createChallengeAcceptedEmbed,
    createCombatStartEmbed,
    createCombatActionEmbed,
    createPokemonChangeEmbed,
    createCombatResultEmbed,
    createErrorEmbed,
    createHealingStatusEmbed,
    createValidationErrorEmbed
}; 