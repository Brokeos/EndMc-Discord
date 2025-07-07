const { Events } = require("discord.js");
const ExperienceService = require("../../services/experience.service");
const NotificationService = require("../../services/notification.service");

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
                const levelUpMessage = await NotificationService.sendMessageLevelUpNotification(
                    message.client,
                    message.guild.id,
                    message.author.id,
                    result.levelUps
                );

                if (levelUpMessage) {
                    await message.reply({
                        content: levelUpMessage,
                        allowedMentions: { repliedUser: false },
                        flags: ['Ephemeral']
                    });
                }
            }
        } catch (error) {
            console.error('Erreur lors du traitement de l\'expérience:', error);
        }
    }
}; 