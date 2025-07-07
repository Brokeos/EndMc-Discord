const cacheService = require('./cache.service');
const UserInventory = require('../repository/user_inventory.entity');
const UserPokemon = require('../repository/user_pokemon.entity');
const UserPokemonStats = require('../repository/user_pokemon_stats.entity');
const experienceConfig = require('../config/experience.config');

class ExperienceService {
    static COOLDOWN_CACHE_PREFIX = 'experience_cooldown';
    
    static async canGainExperience(guildId, userId) {
        const cooldownKey = cacheService.generateKey(this.COOLDOWN_CACHE_PREFIX, `${guildId}_${userId}`);
        const lastMessage = await cacheService.get(cooldownKey);
        
        if (lastMessage) {
            const timeSinceLastMessage = Date.now() - lastMessage;
            return timeSinceLastMessage >= experienceConfig.pokemon.cooldownMs;
        }
        
        return true;
    }
    
    static async setCooldown(guildId, userId) {
        const cooldownKey = cacheService.generateKey(this.COOLDOWN_CACHE_PREFIX, `${guildId}_${userId}`);
        await cacheService.set(cooldownKey, Date.now(), Math.ceil(experienceConfig.pokemon.cooldownMs / 1000));
    }
    
    static generateRandomXp(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static async invalidateUserCaches(guildId, userId) {
        await UserInventory._invalidateInventoryCache(guildId, userId);
        await UserPokemon._invalidateMemberCache(guildId, userId);
    }
    
    static async processExperience(guildId, userId, source = 'message') {
        const inventory = await UserInventory.getByMember(guildId, userId);
        if (inventory.length === 0) {
            return null;
        }

        const isVoice = source === 'voice';
        const config = isVoice ? experienceConfig.voice : experienceConfig.pokemon;
        const xpFormula = isVoice ? experienceConfig.voiceXpFormula : experienceConfig.xpFormula;

        const baseXp = this.generateRandomXp(config.minXpGain, config.maxXpGain);
        const levelUpResults = [];

        for (const inventoryItem of inventory) {
            const pokemon = inventoryItem.pokemon_data;
            const oldLevel = experienceConfig.calculateLevel(pokemon.experience);

            const calculatedXp = xpFormula({ 
                x: baseXp, 
                level: oldLevel,
                exp: pokemon.experience
            });

            const finalXp = Math.max(1, Math.floor(calculatedXp));
            const newExperience = pokemon.experience + finalXp;
            const newLevel = experienceConfig.calculateLevel(newExperience);

            await UserPokemon.update(
                guildId,
                userId,
                pokemon.user_pokemon_id,
                newLevel,
                newExperience
            );

            if (newLevel > oldLevel) {
                const levelUpsCount = newLevel - oldLevel;
                const statsGained = await this.processLevelUp(
                    guildId,
                    userId,
                    pokemon.user_pokemon_id,
                    levelUpsCount
                );

                levelUpResults.push({
                    pokemon: pokemon,
                    oldLevel: oldLevel,
                    newLevel: newLevel,
                    statsGained: statsGained,
                    xpGained: finalXp
                });
            }
        }

        await this.invalidateUserCaches(guildId, userId);

        return {
            baseXp: baseXp,
            pokemonCount: inventory.length,
            levelUps: levelUpResults,
            source: source
        };
    }
    
    static async processVoiceExperience(guildId, userId) {
        return await this.processExperience(guildId, userId, 'voice');
    }
    
    static async processMessageExperience(guildId, userId) {
        if (!(await this.canGainExperience(guildId, userId))) {
            return null;
        }
        
        const result = await this.processExperience(guildId, userId, 'message');
        
        if (result) {
            await this.setCooldown(guildId, userId);
        }
        
        return result;
    }
    
    static async processLevelUp(guildId, userId, userPokemonId, levelUpsCount) {
        const currentStats = await UserPokemonStats.get(guildId, userId, userPokemonId);
        if (!currentStats) {
            return null;
        }
        
        const statsGained = {
            hp: 0,
            attack: 0,
            defense: 0,
            special_attack: 0,
            special_defense: 0,
            speed: 0
        };
        
        const statNames = Object.keys(statsGained);
        
        for (let i = 0; i < levelUpsCount; i++) {
            for (const statName of statNames) {
                const currentValue = currentStats[statName] + statsGained[statName];
                
                if (currentValue < experienceConfig.levelUp.maxStatValue) {
                    const gain = this.generateRandomXp(
                        experienceConfig.levelUp.statsGain.min,
                        experienceConfig.levelUp.statsGain.max
                    );
                    
                    const maxGain = experienceConfig.levelUp.maxStatValue - currentValue;
                    const finalGain = Math.min(gain, maxGain);
                    
                    statsGained[statName] += finalGain;
                }
            }
        }
        
        const newStats = {
            hp: currentStats.hp + statsGained.hp,
            attack: currentStats.attack + statsGained.attack,
            defense: currentStats.defense + statsGained.defense,
            special_attack: currentStats.special_attack + statsGained.special_attack,
            special_defense: currentStats.special_defense + statsGained.special_defense,
            speed: currentStats.speed + statsGained.speed
        };
        
        await UserPokemonStats.update(guildId, userId, userPokemonId, newStats);
        
        return statsGained;
    }
}

module.exports = ExperienceService; 