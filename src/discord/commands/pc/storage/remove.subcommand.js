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
                .setDescription('L\'ID du Pokémon dans le stockage du joueur')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: ['Ephemeral'] });
        
        const member = interaction.options.getMember('membre');
        const userPokemonId = interaction.options.getInteger('id');
        
        try {
            const pokemon = await UserPokemon.get(interaction.guildId, member.id, userPokemonId);
            
            if (!pokemon) {
                await interaction.editReply({
                    content: `❌ Aucun Pokémon trouvé avec l'ID ${userPokemonId} dans le stockage de ${member.displayName}.`
                });
                return;
            }
            
            await UserPokemon.delete(interaction.guildId, member.id, userPokemonId);
            
            await interaction.editReply({
                content: `✅ ${pokemon.pokemon_name} (ID: ${userPokemonId}) a été supprimé du stockage de ${member.displayName}.`
            });
        } catch (error) {
            console.error('Erreur lors de la suppression du Pokémon:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la suppression du Pokémon.'
            });
        }
    }
}; 