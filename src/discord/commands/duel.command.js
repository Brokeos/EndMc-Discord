const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const path = require('path');
const { loadSubcommands, addSubcommandsToBuilder } = require("../utils/subcommandLoader");

const duelSubcommands = loadSubcommands(path.join(__dirname, 'duel'));

module.exports = {
    data: (() => {
        const command = new SlashCommandBuilder()
            .setName("duel")
            .setContexts([InteractionContextType.Guild])
            .setDescription("Commandes de duel Pokémon");
        
        addSubcommandsToBuilder(command, duelSubcommands);
        
        return command;
    })(),
    async execute(interaction) {
        const subcommandName = interaction.options.getSubcommand();
        
        const subcommand = duelSubcommands.find(cmd => cmd.name === subcommandName);
        if (subcommand && subcommand.execute) {
            await subcommand.execute(interaction);
        }
    }
}; 