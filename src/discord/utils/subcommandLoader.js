const fs = require('fs');
const path = require('path');

function loadSubcommands(folderPath) {
    const subcommands = [];
    
    if (!fs.existsSync(folderPath)) {
        return subcommands;
    }
    
    const files = fs.readdirSync(folderPath).filter(file => 
        file.endsWith('.subcommand.js') || file.endsWith('.subcommandgroup.js')
    );
    
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        try {
            const subcommand = require(filePath);
            if (subcommand && subcommand.data && subcommand.name) {
                subcommands.push(subcommand);
            }
        } catch (error) {
            console.error(`Error loading subcommand ${file}:`, error);
        }
    }
    
    return subcommands;
}

function addSubcommandsToBuilder(commandBuilder, subcommands) {
    subcommands.forEach(subcommand => {
        if (subcommand.data) {
            if (subcommand.type === 'group') {
                commandBuilder.addSubcommandGroup(subcommand.data);
            } else {
                commandBuilder.addSubcommand(subcommand.data);
            }
        }
    });
    return commandBuilder;
}

module.exports = {
    loadSubcommands,
    addSubcommandsToBuilder
}; 