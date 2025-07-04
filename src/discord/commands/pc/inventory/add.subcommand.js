const UserInventory = require('../../../../repository/user_inventory.entity');
const { createPokemonInventoryAddEmbed } = require('../../../utils/pokemonDisplay');

module.exports = {
    name: 'add',
    data: subcommand => subcommand
        .setName('add')
        .setDescription('Ajouter un Pokémon du stockage à l\'inventaire')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre dont ajouter le Pokémon à l\'inventaire')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('L\'ID du Pokémon dans le stockage du joueur')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: ['Ephemeral'] });
        
        const member = interaction.options.getMember('membre');
        const userPokemonId = interaction.options.getInteger('id');
        
        try {
            const inventoryItem = await UserInventory.add(interaction.guildId, member.id, userPokemonId);
            
            const embed = createPokemonInventoryAddEmbed(inventoryItem);
            
            await interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            if (error.message.includes('not found in user storage')) {
                await interaction.editReply({
                    content: `❌ Aucun Pokémon trouvé avec l'ID ${userPokemonId} dans le stockage de ${member.displayName}.`
                });
            } else if (error.message.includes('already in inventory')) {
                await interaction.editReply({
                    content: `❌ Ce Pokémon est déjà dans l'inventaire de ${member.displayName}.`
                });
            } else if (error.message.includes('Inventory is full')) {
                await interaction.editReply({
                    content: `❌ L'inventaire de ${member.displayName} est plein (3/3 slots utilisés).`
                });
            } else {
                console.error('Erreur lors de l\'ajout du Pokémon à l\'inventaire:', error);
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de l\'ajout du Pokémon à l\'inventaire.'
                });
            }
        }
    }
}; 