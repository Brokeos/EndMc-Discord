const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { loadEvents } = require("./discord/handlers/eventHandler");
const { loadCommands } = require("./discord/handlers/commandHandler");
require("dotenv").config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
	],
});

client.commands = new Collection();

(async () => {
	try {
		await loadEvents(client);
		await loadCommands(client);
		await client.login(process.env.TOKEN);
	} catch (error) {
		console.error(error);
	}
})();
