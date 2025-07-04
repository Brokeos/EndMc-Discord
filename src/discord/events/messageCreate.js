const { Events } = require("discord.js");
const ExperienceService = require("../../services/experience.service");

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;
        if (!message.guild) return;
        if (message.content.startsWith('/')) return;
        
        try {
            const result = await ExperienceService.processMessageExperience(
                message.guild.id,
                message.author.id
            );
            
            if (result && result.levelUps.length > 0) {
                const levelUpMessages = result.levelUps.map(levelUp => {
                    const pokemon = levelUp.pokemon;
                    const statsText = Object.entries(levelUp.statsGained)
                        .filter(([_, value]) => value > 0)
                        .map(([stat, value]) => `${stat.replace('_', ' ').toUpperCase()}: +${value}`)
                        .join(', ');
                    
                    return `🎉 **${pokemon.pokemon_name}** est passé niveau **${levelUp.newLevel}** ! ${statsText ? `\n📈 Stats gagnées: ${statsText}` : ''}`;
                }).join('\n\n');
                
                await message.reply({
                    content: levelUpMessages,
                    allowedMentions: { repliedUser: false }
                });
            }
        } catch (error) {
            console.error('Erreur lors du traitement de l\'expérience:', error);
        }
    }
}; 