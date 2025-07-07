const { SlashCommandSubcommandBuilder } = require('discord.js');
const DuelService = require('../../../services/duel.service');
const duelDisplay = require('../../utils/duelDisplay');

module.exports = {
    name: 'challenge',
    type: 'subcommand',
    data: new SlashCommandSubcommandBuilder()
        .setName('challenge')
        .setDescription('Défie un utilisateur en duel Pokémon')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('L\'utilisateur à défier')
                .setRequired(true)
        ),
    async execute(interaction) {
        const challenged = interaction.options.getUser('utilisateur');
        const challenger = interaction.user;
        const guildId = interaction.guild.id;

        if (challenged.bot) {
            const errorEmbed = duelDisplay.createValidationErrorEmbed('Vous ne pouvez pas défier un bot.');
            return await interaction.reply({ embeds: [errorEmbed], flags: ['Ephemeral'] });
        }

        if (challenged.id === challenger.id) {
            const errorEmbed = duelDisplay.createValidationErrorEmbed('Vous ne pouvez pas vous défier vous-même.');
            return await interaction.reply({ embeds: [errorEmbed], flags: ['Ephemeral'] });
        }

        try {
            const challengeResult = await DuelService.createChallenge(guildId, challenger.id, challenged.id);

            if (!challengeResult.success) {
                const errorEmbed = duelDisplay.createValidationErrorEmbed(challengeResult.error);
                return await interaction.reply({ embeds: [errorEmbed], flags: ['Ephemeral'] });
            }

            const challengerMember = await interaction.guild.members.fetch(challenger.id);
            const challengedMember = await interaction.guild.members.fetch(challenged.id);

            const challengeEmbed = duelDisplay.createChallengeEmbed(challengerMember, challengedMember);

            await interaction.reply({ embeds: [challengeEmbed] });

        } catch (error) {
            console.error('Erreur lors de la création du défi:', error);
            const errorEmbed = duelDisplay.createErrorEmbed('Une erreur est survenue lors de la création du défi.');
            await interaction.reply({ embeds: [errorEmbed], flags: ['Ephemeral'] });
        }
    }
}; 