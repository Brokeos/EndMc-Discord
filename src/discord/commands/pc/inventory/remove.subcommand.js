const UserInventory = require('../../../../repository/user_inventory.entity');

module.exports = {
    name: 'remove',
    data: subcommand => subcommand
        .setName('remove')
        .setDescription('Retirer un Pokémon de votre inventaire vers le stockage')
        .addIntegerOption(option =>
            option.setName('pokemon_id')
                .setDescription('ID interne du Pokémon à retirer de l\'inventaire')
                .setRequired(true)
        ),
    async execute(interaction) {
        const pokemonId = interaction.options.getInteger('pokemon_id');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        try {
            const inventory = await UserInventory.view(guildId, userId);
            const pokemonInInventory = inventory.find(item => parseInt(item.pokemon_data.id) === pokemonId);

            if (!pokemonInInventory) {
                return await interaction.reply({
                    content: `❌ Ce Pokémon (ID: ${pokemonId}) n'est pas dans votre inventaire.`,
                    flags: ['Ephemeral']
                });
            }

            await UserInventory.remove(guildId, userId, pokemonInInventory.slot_position);
            await interaction.reply({
                content: `✅ **${pokemonInInventory.pokemon_data.pokemon_name}** (ID: ${pokemonInInventory.pokemon_data.id}) a été retiré de votre inventaire et remis dans le stockage.`,
                flags: ['Ephemeral']
            });
        } catch (error) {
            console.error('Error removing pokemon from inventory:', error);
            
            let errorMessage = '❌ Une erreur est survenue lors du retrait du Pokémon.';
            
            if (error.message === 'Invalid slot position') {
                errorMessage = '❌ Position de slot invalide.';
            } else if (error.message === 'No pokemon found in this slot') {
                errorMessage = `❌ Aucun Pokémon trouvé avec l'ID ${pokemonId} dans votre inventaire.`;
            }

            await interaction.reply({
                content: errorMessage,
                flags: ['Ephemeral']
            });
        }
    }
}; 