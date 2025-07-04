const UserPokemon = require('../../../../repository/user_pokemon.entity');

module.exports = {
    name: 'remove',
    data: subcommand => subcommand
        .setName('remove')
        .setDescription('Supprimer un Pokémon du stockage')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre dont supprimer le Pokémon')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('L\'ID du Pokémon dans la base de données')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: ['Ephemeral'] });
        
        const member = interaction.options.getMember('membre');
        const pokemonId = interaction.options.getInteger('id');
        
        try {
            const userPokemon = await UserPokemon.get(pokemonId);
            
            if (!userPokemon) {
                await interaction.editReply({
                    content: `❌ Aucun Pokémon trouvé avec l'ID ${pokemonId}.`
                });
                return;
            }
            
            if (userPokemon.user_id !== member.id) {
                await interaction.editReply({
                    content: `❌ Ce Pokémon (ID: ${pokemonId}) n'appartient pas à ${member.displayName}.`
                });
                return;
            }
            
            const success = await UserPokemon.delete(pokemonId);
            
            if (success) {
                await interaction.editReply({
                    content: `✅ ${userPokemon.pokemon_name} (ID: ${pokemonId}) a été supprimé du stockage de ${member.displayName}.`
                });
            } else {
                await interaction.editReply({
                    content: `❌ Erreur lors de la suppression du Pokémon avec l'ID ${pokemonId}.`
                });
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du Pokémon:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la suppression du Pokémon.'
            });
        }
    }
}; 