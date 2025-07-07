const experienceConfig = require('../config/experience.config');

class NotificationService {
    static async sendLevelUpNotification(client, guildId, userId, levelUpResults, source = 'message') {
        if (!levelUpResults || levelUpResults.length === 0) return;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        const user = await guild.members.fetch(userId).catch(() => null);
        if (!user) return;

        const levelUpMessages = levelUpResults.map(levelUp => {
            const pokemon = levelUp.pokemon;
            const statsText = Object.entries(levelUp.statsGained)
                .filter(([_, value]) => value > 0)
                .map(([stat, value]) => `${stat.replace('_', ' ').toUpperCase()}: +${value}`)
                .join(', ');
            
            return `🎉 **${pokemon.pokemon_name}** de ${user.displayName} est passé niveau **${levelUp.newLevel}** ! ${statsText ? `\n📈 Stats gagnées: ${statsText}` : ''}`;
        }).join('\n\n');

        let targetChannel = null;
        
        if (experienceConfig.levelUp.notificationChannelId) {
            targetChannel = guild.channels.cache.get(experienceConfig.levelUp.notificationChannelId);
        }

        if (targetChannel && targetChannel.isTextBased()) {
            await targetChannel.send({
                content: levelUpMessages,
                allowedMentions: { users: [userId] }
            }).catch(error => {
                console.error('Erreur envoi notification canal configuré:', error);
            });
        } else if (source === 'message') {
            return levelUpMessages;
        }
    }

    static async sendVoiceLevelUpNotification(client, guildId, userId, levelUpResults) {
        return await this.sendLevelUpNotification(client, guildId, userId, levelUpResults, 'voice');
    }

    static async sendMessageLevelUpNotification(client, guildId, userId, levelUpResults) {
        return await this.sendLevelUpNotification(client, guildId, userId, levelUpResults, 'message');
    }
}

module.exports = NotificationService; 