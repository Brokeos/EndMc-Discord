const { SlashCommandSubcommandBuilder } = require('discord.js');
const UserInventory = require('../../../repository/user_inventory.entity');
const HealingService = require('../../../services/healing.service');
const duelDisplay = require('../../utils/duelDisplay');

module.exports = {
    name: 'status',
    type: 'subcommand',
    data: new SlashCommandSubcommandBuilder()
        .setName('status')
        .setDescription('Affiche le statut de guérison de vos Pokémon'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            const inventory = await UserInventory.getByMember(guildId, userId);

            if (inventory.length === 0) {
                const errorEmbed = duelDisplay.createValidationErrorEmbed('Vous n\'avez aucun Pokémon dans votre inventaire.');
                return await interaction.reply({ embeds: [errorEmbed], flags: ['Ephemeral'] });
            }

            const healingTimes = {};
            
            for (const pokemon of inventory) {
                const healingTime = await HealingService.getHealingTimeRemaining(guildId, userId, pokemon.user_pokemon_id);
                healingTimes[pokemon.user_pokemon_id] = healingTime;
            }

            const statusEmbed = duelDisplay.createHealingStatusEmbed(guildId, userId, inventory, healingTimes);
            
            await interaction.reply({ embeds: [statusEmbed], flags: ['Ephemeral'] });

        } catch (error) {
            console.error('Erreur lors de la vérification du statut:', error);
            const errorEmbed = duelDisplay.createErrorEmbed('Une erreur est survenue lors de la vérification du statut.');
            await interaction.reply({ embeds: [errorEmbed], flags: ['Ephemeral'] });
        }
    }
}; 