const ExperienceService = require('./experience.service');
const NotificationService = require('./notification.service');
const experienceConfig = require('../config/experience.config');

class VoiceService {
    static VOICE_TRACKING_PREFIX = 'voice_tracking';
    static activeVoiceUsers = new Map();
    static voiceTimers = new Map();
    static client = null;

    static setClient(discordClient) {
        this.client = discordClient;
    }

    static async startVoiceTracking(guildId, userId, channelId) {
        const trackingKey = `${guildId}_${userId}`;
        
        if (this.voiceTimers.has(trackingKey)) {
            clearInterval(this.voiceTimers.get(trackingKey));
        }

        this.activeVoiceUsers.set(trackingKey, {
            guildId,
            userId,
            channelId,
            joinTime: Date.now()
        });

        const intervalMs = experienceConfig.voice.intervalMinutes * 60 * 1000;
        
        const timer = setInterval(async () => {
            try {
                await this.processVoiceExperience(guildId, userId);
            } catch (error) {
                console.error(`Erreur lors du traitement XP vocal pour ${userId}:`, error);
            }
        }, intervalMs);

        this.voiceTimers.set(trackingKey, timer);
    }

    static async stopVoiceTracking(guildId, userId) {
        const trackingKey = `${guildId}_${userId}`;
        
        if (this.voiceTimers.has(trackingKey)) {
            clearInterval(this.voiceTimers.get(trackingKey));
            this.voiceTimers.delete(trackingKey);
        }

        this.activeVoiceUsers.delete(trackingKey);
    }

    static async processVoiceExperience(guildId, userId) {
        const trackingKey = `${guildId}_${userId}`;
        const userVoiceData = this.activeVoiceUsers.get(trackingKey);
        
        if (!userVoiceData) {
            return null;
        }

        const result = await ExperienceService.processVoiceExperience(guildId, userId);
        
        if (result && result.levelUps.length > 0 && this.client) {
            await NotificationService.sendVoiceLevelUpNotification(
                this.client,
                guildId,
                userId,
                result.levelUps
            );
        }

        return result;
    }

    static isUserInVoice(guildId, userId) {
        const trackingKey = `${guildId}_${userId}`;
        return this.activeVoiceUsers.has(trackingKey);
    }

    static getActiveVoiceUsers() {
        return Array.from(this.activeVoiceUsers.values());
    }

    static async switchVoiceChannel(guildId, userId, newChannelId) {
        const trackingKey = `${guildId}_${userId}`;
        const userData = this.activeVoiceUsers.get(trackingKey);
        
        if (userData) {
            userData.channelId = newChannelId;
            this.activeVoiceUsers.set(trackingKey, userData);
        }
    }
}

module.exports = VoiceService; 