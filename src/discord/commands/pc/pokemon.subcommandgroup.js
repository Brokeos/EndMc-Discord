const path = require('path');
const fs = require('fs');

function loadPokemonSubcommands() {
    const subcommands = [];
    const pokemonFolder = path.join(__dirname, 'pokemon');
    
    if (!fs.existsSync(pokemonFolder)) {
        return subcommands;
    }
    
    const files = fs.readdirSync(pokemonFolder).filter(file => file.endsWith('.subcommand.js'));
    
    for (const file of files) {
        const filePath = path.join(pokemonFolder, file);
        try {
            const subcommand = require(filePath);
            if (subcommand && subcommand.data && subcommand.name) {
                subcommands.push(subcommand);
            }
        } catch (error) {
            console.error(`Error loading pokemon subcommand ${file}:`, error);
        }
    }
    
    return subcommands;
}

const pokemonSubcommands = loadPokemonSubcommands();

module.exports = {
    name: 'pokemon',
    type: 'group',
    data: group => {
        const pokemonGroup = group
            .setName('pokemon')
            .setDescription('Gérer et consulter vos Pokémon');
        
        pokemonSubcommands.forEach(subcommand => {
            if (subcommand.data) {
                pokemonGroup.addSubcommand(subcommand.data);
            }
        });
        
        return pokemonGroup;
    },
    async execute(interaction) {
        const subcommandName = interaction.options.getSubcommand();
        const subcommand = pokemonSubcommands.find(cmd => cmd.name === subcommandName);
        
        if (subcommand && subcommand.execute) {
            await subcommand.execute(interaction);
        }
    }
}; 