const cacheService = require('./cache.service');
const CombatService = require('./duel/combat.service');
const ValidationService = require('./duel/validation.service');
const experienceConfig = require('../config/experience.config');

class DuelService {
    static DUEL_STATES = {
        PENDING: 'pending',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed'
    };

    static DUEL_CACHE_PREFIX = 'duel';
    static CHALLENGE_CACHE_PREFIX = 'duel_challenge';

    static async createChallenge(guildId, challengerId, challengedId) {
        const validationResult = await ValidationService.validateDuelParticipants(guildId, challengerId, challengedId);
        if (!validationResult.isValid) {
            return { success: false, error: validationResult.error };
        }

        const challengeKey = cacheService.generateKey(this.CHALLENGE_CACHE_PREFIX, `${guildId}_${challengerId}_${challengedId}`);
        const existingChallenge = await cacheService.get(challengeKey);
        
        if (existingChallenge) {
            return { success: false, error: 'Un défi est déjà en cours entre ces joueurs.' };
        }

        const challenge = {
            guildId,
            challengerId,
            challengedId,
            createdAt: Date.now(),
            state: this.DUEL_STATES.PENDING
        };

        const timeoutSeconds = experienceConfig.duel.challengeTimeoutMinutes * 60;
        await cacheService.set(challengeKey, challenge, timeoutSeconds);

        return { success: true, challenge };
    }

    static async acceptChallenge(guildId, challengerId, challengedId) {
        const challengeKey = cacheService.generateKey(this.CHALLENGE_CACHE_PREFIX, `${guildId}_${challengerId}_${challengedId}`);
        const challenge = await cacheService.get(challengeKey);

        if (!challenge) {
            return { success: false, error: 'Aucun défi trouvé ou le défi a expiré.' };
        }

        const validationResult = await ValidationService.validateDuelParticipants(guildId, challengerId, challengedId);
        if (!validationResult.isValid) {
            await cacheService.delete(challengeKey);
            return { success: false, error: validationResult.error };
        }

        const duelId = `${guildId}_${challengerId}_${challengedId}_${Date.now()}`;
        const duel = {
            id: duelId,
            guildId,
            challengerId,
            challengedId,
            createdAt: Date.now(),
            state: this.DUEL_STATES.IN_PROGRESS
        };

        const duelKey = cacheService.generateKey(this.DUEL_CACHE_PREFIX, duelId);
        await cacheService.set(duelKey, duel, 3600);
        await cacheService.delete(challengeKey);

        return { success: true, duel };
    }

    static async startCombat(duelId) {
        const duelKey = cacheService.generateKey(this.DUEL_CACHE_PREFIX, duelId);
        const duel = await cacheService.get(duelKey);

        if (!duel || duel.state !== this.DUEL_STATES.IN_PROGRESS) {
            return { success: false, error: 'Duel non trouvé ou déjà terminé.' };
        }

        const combatResult = await CombatService.executeCombat(duel.guildId, duel.challengerId, duel.challengedId);
        
        duel.state = this.DUEL_STATES.COMPLETED;
        duel.result = combatResult;
        duel.completedAt = Date.now();

        await cacheService.set(duelKey, duel, 600);

        setTimeout(async () => {
            await cacheService.delete(duelKey);
        }, 300000);

        return { success: true, combatResult };
    }

    static async getDuel(duelId) {
        const duelKey = cacheService.generateKey(this.DUEL_CACHE_PREFIX, duelId);
        return await cacheService.get(duelKey);
    }

    static async getChallenge(guildId, challengerId, challengedId) {
        const challengeKey = cacheService.generateKey(this.CHALLENGE_CACHE_PREFIX, `${guildId}_${challengerId}_${challengedId}`);
        return await cacheService.get(challengeKey);
    }

    static async cancelChallenge(guildId, challengerId, challengedId) {
        const challengeKey = cacheService.generateKey(this.CHALLENGE_CACHE_PREFIX, `${guildId}_${challengerId}_${challengedId}`);
        return await cacheService.delete(challengeKey);
    }
}

module.exports = DuelService; 