const UserInventory = require('../../../../repository/user_inventory.entity');
const { createPokemonInventoryEmbed } = require('../../../utils/pokemonDisplay');

module.exports = {
    name: 'view',
    data: subcommand => subcommand
        .setName('view')
        .setDescription('Voir votre inventaire de Pokémon'),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        try {
            const inventory = await UserInventory.view(guildId, userId);

            if (inventory.length === 0) {
                return await interaction.reply({
                    content: '📦 Votre inventaire est vide. Utilisez `/pc storage view` pour voir vos Pokémon en stockage.',
                    flags: ['Ephemeral']
                });
            }

            const embed = createPokemonInventoryEmbed(inventory, interaction.member);

            await interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
        } catch (error) {
            console.error('Error viewing inventory:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'affichage de l\'inventaire.',
                flags: ['Ephemeral']
            });
        }
    }
}; 