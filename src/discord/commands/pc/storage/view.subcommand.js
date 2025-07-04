const UserPokemon = require('../../../../repository/user_pokemon.entity');
const { createPokemonStorageEmbed } = require('../../../utils/pokemonDisplay');
const { ComponentType } = require('discord.js');

function createNavigationButtons(page, totalPages) {
    return {
        type: 1,
        components: [
            {
                type: 2,
                style: 2,
                label: '⏮️',
                custom_id: 'first',
                disabled: page === 0
            },
            {
                type: 2,
                style: 1,
                label: '◀️',
                custom_id: 'previous',
                disabled: page === 0
            },
            {
                type: 2,
                style: 1,
                label: '▶️',
                custom_id: 'next',
                disabled: page === totalPages - 1
            },
            {
                type: 2,
                style: 2,
                label: '⏭️',
                custom_id: 'last',
                disabled: page === totalPages - 1
            }
        ]
    };
}

module.exports = {
    name: 'view',
    data: subcommand => subcommand
        .setName('view')
        .setDescription('Voir les Pokémon d\'un membre')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre dont voir les Pokémon')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: ['Ephemeral'] });
        
        const member = interaction.options.getMember('membre');
        
        try {
            const userPokemonList = await UserPokemon.getAllByMember(interaction.guildId, member.id);
            
            if (!userPokemonList || userPokemonList.length === 0) {
                await interaction.editReply({
                    content: `❌ ${member.displayName} n'a aucun Pokémon dans son stockage.`
                });
                return;
            }
            
            const totalPages = Math.ceil(userPokemonList.length / 5);
            let currentPage = 0;
            
            const embed = createPokemonStorageEmbed(userPokemonList, member, currentPage, totalPages);
            const components = totalPages > 1 ? [createNavigationButtons(currentPage, totalPages)] : [];
            
            const response = await interaction.editReply({ 
                embeds: [embed], 
                components: components 
            });
            
            if (totalPages > 1) {
                const collector = response.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 300000 // 5 minutes
                });
                
                collector.on('collect', async (buttonInteraction) => {
                    if (buttonInteraction.user.id !== interaction.user.id) {
                        await buttonInteraction.reply({
                            content: '❌ Seul l\'utilisateur qui a lancé la commande peut naviguer.',
                            flags: ['Ephemeral']
                        });
                        return;
                    }
                    
                    switch (buttonInteraction.customId) {
                        case 'first':
                            currentPage = 0;
                            break;
                        case 'previous':
                            currentPage = Math.max(0, currentPage - 1);
                            break;
                        case 'next':
                            currentPage = Math.min(totalPages - 1, currentPage + 1);
                            break;
                        case 'last':
                            currentPage = totalPages - 1;
                            break;
                    }
                    
                    const newEmbed = createPokemonStorageEmbed(userPokemonList, member, currentPage, totalPages);
                    const newComponents = [createNavigationButtons(currentPage, totalPages)];
                    
                    await buttonInteraction.update({
                        embeds: [newEmbed],
                        components: newComponents
                    });
                });
                
                collector.on('end', async () => {
                    try {
                        await interaction.editReply({ components: [] });
                    } catch (error) {
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des Pokémon:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la récupération des Pokémon.'
            });
        }
    }
}; 