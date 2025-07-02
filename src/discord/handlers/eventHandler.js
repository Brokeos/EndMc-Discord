const fs = require("fs").promises;
const path = require("path");

async function loadEvents(client) {
  const loadFilesAndBindEvents = async (directory) => {
    const files = await fs.readdir(path.join(__dirname, `../${directory}`));

    files.forEach((file) => {
      const handler = require(`../${directory}/${file}`);
      const eventFunction = (...args) => handler.execute(...args, client);
      console.log(`Loaded ${handler.name} event`);
      client[handler.once ? "once" : "on"](handler.name, eventFunction);
    });
  };

  await Promise.all([
    loadFilesAndBindEvents("events"),
    loadFilesAndBindEvents("interactions"),
  ]);
}

module.exports = { loadEvents };
