const { Events } = require("discord.js");
const VoiceService = require("../../services/voice.service");

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const member = newState.member || oldState.member;
        if (!member || member.user.bot) return;

        const guildId = member.guild.id;
        const userId = member.id;
        const oldChannelId = oldState.channelId;
        const newChannelId = newState.channelId;

        try {
            if (!oldChannelId && newChannelId) {
                await VoiceService.startVoiceTracking(guildId, userId, newChannelId);
            }
            else if (oldChannelId && !newChannelId) {
                await VoiceService.stopVoiceTracking(guildId, userId);
            }
            else if (oldChannelId && newChannelId && oldChannelId !== newChannelId) {
                await VoiceService.switchVoiceChannel(guildId, userId, newChannelId);
            }
        } catch (error) {
            console.error('Erreur lors du traitement de voiceStateUpdate:', error);
        }
    }
}; 