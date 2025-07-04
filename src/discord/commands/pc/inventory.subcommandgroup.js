const path = require('path');
const fs = require('fs');

function loadInventorySubcommands() {
    const subcommands = [];
    const inventoryFolder = path.join(__dirname, 'inventory');
    
    if (!fs.existsSync(inventoryFolder)) {
        return subcommands;
    }
    
    const files = fs.readdirSync(inventoryFolder).filter(file => file.endsWith('.subcommand.js'));
    
    for (const file of files) {
        const filePath = path.join(inventoryFolder, file);
        try {
            const subcommand = require(filePath);
            if (subcommand && subcommand.data && subcommand.name) {
                subcommands.push(subcommand);
            }
        } catch (error) {
            console.error(`Error loading inventory subcommand ${file}:`, error);
        }
    }
    
    return subcommands;
}

const inventorySubcommands = loadInventorySubcommands();

module.exports = {
    name: 'inventory',
    type: 'group',
    data: group => {
        const inventoryGroup = group
            .setName('inventory')
            .setDescription('Gérer votre inventaire de Pokémon (3 maximum)');
        
        inventorySubcommands.forEach(subcommand => {
            if (subcommand.data) {
                inventoryGroup.addSubcommand(subcommand.data);
            }
        });
        
        return inventoryGroup;
    },
    async execute(interaction) {
        const subcommandName = interaction.options.getSubcommand();
        const subcommand = inventorySubcommands.find(cmd => cmd.name === subcommandName);
        
        if (subcommand && subcommand.execute) {
            await subcommand.execute(interaction);
        }
    }
}; 