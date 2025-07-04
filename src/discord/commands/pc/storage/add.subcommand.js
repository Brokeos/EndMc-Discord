const PokedexApplication = require('../../../../applications/pokedex.application');
const UserPokemon = require('../../../../repository/user_pokemon.entity');

module.exports = {
    name: 'add',
    data: subcommand => subcommand
        .setName('add')
        .setDescription('Ajouter un Pokémon au stockage')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à qui ajouter le Pokémon')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('nom')
                .setDescription('Le nom ou ID du Pokémon')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: ['Ephemeral'] });
        
        const member = interaction.options.getMember('membre');
        const pokemonName = interaction.options.getString('nom');
        
        try {
            const pokemon = await PokedexApplication.getPokemon(pokemonName);
            
            const userPokemon = await UserPokemon.add(
                interaction.guildId,
                member.id,
                pokemon.id,
                pokemon.name,
                pokemon.sprites.front_default
            );

            await interaction.editReply({
                content: `✅ ${pokemon.name} a été ajouté au stockage de ${member.displayName}.`
            });
        } catch (error) {
            if (error.message.includes('not found')) {
                await interaction.editReply({
                    content: `❌ Pokémon "${pokemonName}" introuvable.`
                });
            } else {
                console.error('Erreur lors de l\'ajout du Pokémon:', error);
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de l\'ajout du Pokémon.'
                });
            }
        }
    }
}; 