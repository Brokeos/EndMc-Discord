const fs = require("fs").promises;
const path = require("path");
const { Collection } = require("discord.js");

async function loadCommands(client) {
  client.commands = new Collection();
  const commands = [];

  try {
    const slashCommandsPath = path.join(__dirname, "../commands");
    if (
      await fs
        .access(slashCommandsPath)
        .then(() => true)
        .catch(() => false)
    ) {
      const slashCommandFiles = await fs.readdir(slashCommandsPath);

      for (const file of slashCommandFiles) {
        if (!file.endsWith(".js")) continue;

        const command = require(`../commands/${file}`);
        if ("data" in command && "execute" in command) {
          client.commands.set(command.data.name, command);
          commands.push(command.data.toJSON());
        } else {
          console.log(
            `[WARNING] Command at commands/${file} is missing required "data" or "execute" property.`,
          );
        }
      }
    }

    return commands;
  } catch (error) {
    console.error("Error loading commands:", error);
  }
}

module.exports = { loadCommands };
