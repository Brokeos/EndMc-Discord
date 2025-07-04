const UserInventory = require('../../../../repository/user_inventory.entity');
const { createPokemonInventoryEmbed } = require('../../../utils/pokemonDisplay');

module.exports = {
    name: 'view',
    data: subcommand => subcommand
        .setName('view')
        .setDescription('Afficher l\'inventaire d\'un membre')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre dont afficher l\'inventaire')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: ['Ephemeral'] });
        
        const member = interaction.options.getMember('membre');
        
        try {
            const inventory = await UserInventory.getByMember(interaction.guildId, member.id);
            
            if (inventory.length === 0) {
                await interaction.editReply({
                    content: `📦 L'inventaire de ${member.displayName} est vide.`
                });
                return;
            }
            
            const embed = createPokemonInventoryEmbed(inventory, member);
            
            await interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error('Erreur lors de l\'affichage de l\'inventaire:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'affichage de l\'inventaire.'
            });
        }
    }
}; 