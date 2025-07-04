const path = require('path');
const fs = require('fs');

function loadStorageSubcommands() {
    const subcommands = [];
    const storageFolder = path.join(__dirname, 'storage');
    
    if (!fs.existsSync(storageFolder)) {
        return subcommands;
    }
    
    const files = fs.readdirSync(storageFolder).filter(file => file.endsWith('.subcommand.js'));
    
    for (const file of files) {
        const filePath = path.join(storageFolder, file);
        try {
            const subcommand = require(filePath);
            if (subcommand && subcommand.data && subcommand.name) {
                subcommands.push(subcommand);
            }
        } catch (error) {
            console.error(`Error loading storage subcommand ${file}:`, error);
        }
    }
    
    return subcommands;
}

const storageSubcommands = loadStorageSubcommands();

module.exports = {
    name: 'storage',
    type: 'group',
    data: group => {
        const storageGroup = group
            .setName('storage')
            .setDescription('Gérer le stockage de Pokémon');
        
        storageSubcommands.forEach(subcommand => {
            if (subcommand.data) {
                storageGroup.addSubcommand(subcommand.data);
            }
        });
        
        return storageGroup;
    },
    async execute(interaction) {
        const subcommandName = interaction.options.getSubcommand();
        const subcommand = storageSubcommands.find(cmd => cmd.name === subcommandName);
        
        if (subcommand && subcommand.execute) {
            await subcommand.execute(interaction);
        }
    }
}; 