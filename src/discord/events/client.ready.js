const { Events } = require("discord.js");
const { registerCommands } = require("../handlers/slashCommandHandler");

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Bot ready! Logged in as ${client.user.tag}`);
		await registerCommands(client);
	},
};
