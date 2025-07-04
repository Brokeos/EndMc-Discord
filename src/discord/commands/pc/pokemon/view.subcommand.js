const UserPokemon = require('../../../../repository/user_pokemon.entity');
const UserPokemonStats = require('../../../../repository/user_pokemon_stats.entity');
const { createUserPokemonStatsEmbed } = require('../../../utils/pokemonDisplay');

module.exports = {
    name: 'view',
    data: subcommand => subcommand
        .setName('view')
        .setDescription('Afficher les détails et stats d\'un de vos Pokémon')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('L\'ID de votre Pokémon à consulter')
                .setRequired(true)
                .setMinValue(1)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: ['Ephemeral'] });
        
        const pokemonId = interaction.options.getInteger('id');
        const guildId = interaction.guildId;
        const userId = interaction.user.id;
        
        try {
            const userPokemon = await UserPokemon.get(guildId, userId, pokemonId);
            
            if (!userPokemon) {
                await interaction.editReply({
                    content: `❌ Aucun Pokémon trouvé avec l'ID ${pokemonId} dans votre collection.`
                });
                return;
            }
            
            const pokemonStats = await UserPokemonStats.get(guildId, userId, pokemonId);
            
            if (!pokemonStats) {
                await interaction.editReply({
                    content: `❌ Impossible de récupérer les stats de ce Pokémon.`
                });
                return;
            }
            
            const embed = createUserPokemonStatsEmbed(userPokemon, pokemonStats);
            
            await interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error('Erreur lors de l\'affichage du Pokémon:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'affichage du Pokémon.'
            });
        }
    }
}; 