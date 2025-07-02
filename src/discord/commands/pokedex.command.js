const {SlashCommandBuilder, InteractionContextType} = require("discord.js");
const path = require('path');
const { loadSubcommands, addSubcommandsToBuilder } = require("../utils/subcommandLoader");

const pokedexSubcommands = loadSubcommands(path.join(__dirname, 'pokedex'));

module.exports = {
	data: (() => {
		const command = new SlashCommandBuilder()
			.setName("pokedex")
			.setContexts([InteractionContextType.Guild])
			.setDescription("Commandes du Pokédex");
		
		addSubcommandsToBuilder(command, pokedexSubcommands);
		
		return command;
	})(),
	async execute(interaction) {
		const subcommandName = interaction.options.getSubcommand();
		const subcommand = pokedexSubcommands.find(cmd => cmd.name === subcommandName);
		
		if (subcommand && subcommand.execute) {
			await subcommand.execute(interaction);
		}
	}
}