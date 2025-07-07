const { SlashCommandSubcommandBuilder } = require('discord.js');
const DuelService = require('../../../services/duel.service');
const duelDisplay = require('../../utils/duelDisplay');
const experienceConfig = require('../../../config/experience.config');

module.exports = {
    name: 'accept',
    type: 'subcommand',
    data: new SlashCommandSubcommandBuilder()
        .setName('accept')
        .setDescription('Accepte un défi de duel Pokémon')
        .addUserOption(option =>
            option.setName('challenger')
                .setDescription('L\'utilisateur qui vous a défié')
                .setRequired(true)
        ),
    async execute(interaction) {
        const challenger = interaction.options.getUser('challenger');
        const challenged = interaction.user;
        const guildId = interaction.guild.id;

        try {
            const acceptResult = await DuelService.acceptChallenge(guildId, challenger.id, challenged.id);

            if (!acceptResult.success) {
                const errorEmbed = duelDisplay.createValidationErrorEmbed(acceptResult.error);
                return await interaction.reply({ embeds: [errorEmbed], flags: ['Ephemeral'] });
            }

            const challengerMember = await interaction.guild.members.fetch(challenger.id);
            const challengedMember = await interaction.guild.members.fetch(challenged.id);

            const acceptedEmbed = duelDisplay.createChallengeAcceptedEmbed(challengerMember, challengedMember);
            await interaction.reply({ embeds: [acceptedEmbed] });

            await this.executeCombatWithDelay(interaction, acceptResult.duel.id, challengerMember, challengedMember);

        } catch (error) {
            console.error('Erreur lors de l\'acceptation du défi:', error);
            const errorEmbed = duelDisplay.createErrorEmbed('Une erreur est survenue lors de l\'acceptation du défi.');
            await interaction.followUp({ embeds: [errorEmbed], flags: ['Ephemeral'] });
        }
    },

    async executeCombatWithDelay(interaction, duelId, challengerMember, challengedMember) {
        try {
            const combatResult = await DuelService.startCombat(duelId);

            if (!combatResult.success) {
                const errorEmbed = duelDisplay.createErrorEmbed(combatResult.error);
                return await interaction.followUp({ embeds: [errorEmbed] });
            }

            const challengerTeam = combatResult.combatResult.challengerTeamData || [];
            const challengedTeam = combatResult.combatResult.challengedTeamData || [];

            const startEmbed = duelDisplay.createCombatStartEmbed(challengerMember, challengedMember, challengerTeam, challengedTeam);
            await interaction.followUp({ embeds: [startEmbed] });

            const combatLog = combatResult.combatResult.combatLog;
            
            for (let i = 0; i < combatLog.length; i++) {
                const action = combatLog[i];
                
                await new Promise(resolve => setTimeout(resolve, experienceConfig.duel.combatDelayMs));
                
                let actionEmbed;
                
                if (action.type === 'attack') {
                    const attackerPokemon = action.attackerOwner === 'challenger' 
                        ? challengerTeam.find(p => p.pokemon_data.pokemon_name === action.attacker)
                        : challengedTeam.find(p => p.pokemon_data.pokemon_name === action.attacker);
                        
                    actionEmbed = duelDisplay.createCombatActionEmbed(
                        action,
                        challengerMember.displayName,
                        challengedMember.displayName,
                        attackerPokemon
                    );
                } else if (action.type === 'pokemon_change') {
                    const newPokemon = action.owner === 'challenger'
                        ? challengerTeam.find(p => p.pokemon_data.pokemon_name === action.newPokemon)
                        : challengedTeam.find(p => p.pokemon_data.pokemon_name === action.newPokemon);
                        
                    actionEmbed = duelDisplay.createPokemonChangeEmbed(
                        action,
                        challengerMember.displayName,
                        challengedMember.displayName,
                        newPokemon
                    );
                }

                if (actionEmbed) {
                    await interaction.followUp({ embeds: [actionEmbed] });
                }
            }

            await new Promise(resolve => setTimeout(resolve, experienceConfig.duel.combatDelayMs));

            const resultEmbed = duelDisplay.createCombatResultEmbed(
                combatResult.combatResult.winnerId,
                combatResult.combatResult.loserId,
                challengerMember.id,
                challengedMember.id,
                challengerMember.displayName,
                challengedMember.displayName,
                combatResult.combatResult
            );

            await interaction.followUp({ embeds: [resultEmbed] });

        } catch (error) {
            console.error('Erreur lors du combat:', error);
            const errorEmbed = duelDisplay.createErrorEmbed('Une erreur est survenue pendant le combat.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
}; 