const UserInventory = require('../../../../repository/user_inventory.entity');

module.exports = {
    name: 'add',
    data: subcommand => subcommand
        .setName('add')
        .setDescription('Ajouter un Pokémon de votre stockage à votre inventaire')
        .addIntegerOption(option =>
            option.setName('pokemon_id')
                .setDescription('ID interne du Pokémon à ajouter à l\'inventaire')
                .setRequired(true)
        ),
    async execute(interaction) {
        const pokemonId = interaction.options.getInteger('pokemon_id');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        try {
            const inventoryItem = await UserInventory.add(guildId, userId, pokemonId);

            await interaction.reply({
                content: `✅ **${inventoryItem.pokemon_data.pokemon_name}** (ID: ${inventoryItem.pokemon_data.id}) a été ajouté à votre inventaire dans le slot ${inventoryItem.slot_position}.`,
                flags: ['Ephemeral']
            });
        } catch (error) {
            console.error('Error adding pokemon to inventory:', error);
            
            let errorMessage = '❌ Une erreur est survenue lors de l\'ajout du Pokémon.';
            
            if (error.message === 'Pokemon not found in user storage') {
                errorMessage = '❌ Ce Pokémon n\'existe pas dans votre stockage.';
            } else if (error.message === 'Pokemon is already in inventory') {
                errorMessage = '❌ Ce Pokémon est déjà dans votre inventaire.';
            } else if (error.message === 'Inventory is full') {
                errorMessage = '❌ Votre inventaire est plein (3 Pokémon maximum). Retirez d\'abord un Pokémon avec `/pc inventory remove`.';
            }

            await interaction.reply({
                content: errorMessage,
                flags: ['Ephemeral']
            });
        }
    }
}; 