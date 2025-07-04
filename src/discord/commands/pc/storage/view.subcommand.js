const UserPokemon = require('../../../../repository/user_pokemon.entity');
const { createPokemonStorageEmbed, createPaginationButtons } = require('../../../utils/pokemonDisplay');

module.exports = {
    name: 'view',
    data: subcommand => subcommand
        .setName('view')
        .setDescription('Afficher le stockage d\'un membre')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre dont afficher le stockage')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: ['Ephemeral'] });
        
        const member = interaction.options.getMember('membre');
        
        try {
            const userPokemonList = await UserPokemon.getAllByMember(interaction.guildId, member.id);
            
            if (userPokemonList.length === 0) {
                await interaction.editReply({
                    content: `📦 Le stockage de ${member.displayName} est vide.`
                });
                return;
            }
            
            const totalPages = Math.ceil(userPokemonList.length / 5);
            const currentPage = 0;
            
            const embed = createPokemonStorageEmbed(userPokemonList, member, currentPage, totalPages);
            const buttons = createPaginationButtons(currentPage, totalPages, 'storage', member.id);
            
            await interaction.editReply({
                embeds: [embed],
                components: buttons
            });
        } catch (error) {
            console.error('Erreur lors de l\'affichage du stockage:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'affichage du stockage.'
            });
        }
    }
}; 