const {SlashCommandBuilder, InteractionContextType} = require("discord.js");
const path = require('path');
const { loadSubcommands, addSubcommandsToBuilder } = require("../utils/subcommandLoader");

const pcSubcommands = loadSubcommands(path.join(__dirname, 'pc'));

module.exports = {
	data: (() => {
		const command = new SlashCommandBuilder()
			.setName("pc")
			.setContexts([InteractionContextType.Guild])
			.setDescription("Commandes du PC Pokémon");
		
		addSubcommandsToBuilder(command, pcSubcommands);
		
		return command;
	})(),
	async execute(interaction) {
		const subcommandGroup = interaction.options.getSubcommandGroup();
		const subcommandName = interaction.options.getSubcommand();
		
		if (subcommandGroup) {
			const group = pcSubcommands.find(cmd => cmd.name === subcommandGroup && cmd.type === 'group');
			if (group && group.execute) {
				await group.execute(interaction);
			}
		} else {
			const subcommand = pcSubcommands.find(cmd => cmd.name === subcommandName);
			if (subcommand && subcommand.execute) {
				await subcommand.execute(interaction);
			}
		}
	}
} 