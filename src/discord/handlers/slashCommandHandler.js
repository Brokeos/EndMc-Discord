const { REST, Routes } = require("discord.js");
require("dotenv").config();

class SlashCommandHandler {
  constructor(client) {
    this.client = client;
    this.rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  }

  async handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = this.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(
        `Error executing command ${interaction.commandName}:`,
        error,
      );
      const errorMessage = {
        content: "There was an error while executing this command!",
        flags: ["Ephemeral"],
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }

  async registerCommands() {
    try {
      const commands = Array.from(this.client.commands.values()).map(
        (command) => command.data.toJSON(),
      );

      console.log(
        `Started refreshing ${commands.length} application (/) commands.`,
      );

      const data = await this.rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
      );

      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`,
      );
    } catch (error) {
      console.error("Error registering slash commands:", error);
    }
  }

  async init() {
    await this.registerCommands();

    this.client.on("interactionCreate", this.handleInteraction.bind(this));
  }
}

async function registerCommands(client) {
  const handler = new SlashCommandHandler(client);
  await handler.init();
}

module.exports = { registerCommands };
