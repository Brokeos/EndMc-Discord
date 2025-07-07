const cacheService = require('./cache.service');
const UserPokemonStats = require('../repository/user_pokemon_stats.entity');
const experienceConfig = require('../config/experience.config');

class HealingService {
    static HEALING_CACHE_PREFIX = 'pokemon_healing';
    static CURRENT_HP_CACHE_PREFIX = 'pokemon_current_hp';

    static async damagePokemon(guildId, userId, userPokemonId, damage) {
        const currentHpKey = cacheService.generateKey(this.CURRENT_HP_CACHE_PREFIX, `${guildId}_${userId}_${userPokemonId}`);
        const pokemonStats = await UserPokemonStats.get(guildId, userId, userPokemonId);
        
        if (!pokemonStats) {
            throw new Error('Pokémon stats not found');
        }

        let currentHp = await cacheService.get(currentHpKey);
        if (currentHp === null || currentHp === undefined) {
            currentHp = pokemonStats.hp;
        }

        const newHp = Math.max(0, currentHp - damage);
        await cacheService.set(currentHpKey, newHp, 3600);

        if (newHp === 0) {
            await this.startHealing(guildId, userId, userPokemonId, pokemonStats.hp);
        } else if (newHp < pokemonStats.hp) {
            const missingHp = pokemonStats.hp - newHp;
            await this.startHealing(guildId, userId, userPokemonId, missingHp);
        }

        return { currentHp: newHp, maxHp: pokemonStats.hp, isDead: newHp === 0 };
    }

    static async startHealing(guildId, userId, userPokemonId, hpToRestore) {
        const healingKey = cacheService.generateKey(this.HEALING_CACHE_PREFIX, `${guildId}_${userId}_${userPokemonId}`);
        
        const healingTimeMinutes = Math.min(
            Math.ceil(hpToRestore / experienceConfig.duel.healing.healingRatePerMinute),
            experienceConfig.duel.healing.maxHealingTimeMinutes
        );

        const healingData = {
            startTime: Date.now(),
            endTime: Date.now() + (healingTimeMinutes * 60 * 1000),
            hpToRestore,
            healingTimeMinutes
        };

        await cacheService.set(healingKey, healingData, healingTimeMinutes * 60);
    }

    static async getCurrentHp(guildId, userId, userPokemonId) {
        const currentHpKey = cacheService.generateKey(this.CURRENT_HP_CACHE_PREFIX, `${guildId}_${userId}_${userPokemonId}`);
        const pokemonStats = await UserPokemonStats.get(guildId, userId, userPokemonId);
        
        if (!pokemonStats) {
            return null;
        }

        let currentHp = await cacheService.get(currentHpKey);
        if (currentHp === null || currentHp === undefined) {
            currentHp = pokemonStats.hp;
            await cacheService.set(currentHpKey, currentHp, 3600);
        }

        return { currentHp, maxHp: pokemonStats.hp };
    }

    static async isPokemonHealed(guildId, userId, userPokemonId) {
        const healingKey = cacheService.generateKey(this.HEALING_CACHE_PREFIX, `${guildId}_${userId}_${userPokemonId}`);
        const healingData = await cacheService.get(healingKey);

        if (!healingData) {
            return true;
        }

        const now = Date.now();
        if (now >= healingData.endTime) {
            await cacheService.delete(healingKey);
            
            const currentHpKey = cacheService.generateKey(this.CURRENT_HP_CACHE_PREFIX, `${guildId}_${userId}_${userPokemonId}`);
            const pokemonStats = await UserPokemonStats.get(guildId, userId, userPokemonId);
            if (pokemonStats) {
                await cacheService.set(currentHpKey, pokemonStats.hp, 3600);
            }
            
            return true;
        }

        return false;
    }

    static async getHealingTimeRemaining(guildId, userId, userPokemonId) {
        const healingKey = cacheService.generateKey(this.HEALING_CACHE_PREFIX, `${guildId}_${userId}_${userPokemonId}`);
        const healingData = await cacheService.get(healingKey);

        if (!healingData) {
            return 0;
        }

        const now = Date.now();
        const timeRemaining = Math.max(0, healingData.endTime - now);
        
        return Math.ceil(timeRemaining / (60 * 1000));
    }

    static async areAllPokemonHealed(guildId, userId, inventory) {
        for (const pokemon of inventory) {
            const isHealed = await this.isPokemonHealed(guildId, userId, pokemon.user_pokemon_id);
            if (!isHealed) {
                return false;
            }
        }
        return true;
    }

    static async resetPokemonHp(guildId, userId, userPokemonId) {
        const currentHpKey = cacheService.generateKey(this.CURRENT_HP_CACHE_PREFIX, `${guildId}_${userId}_${userPokemonId}`);
        const pokemonStats = await UserPokemonStats.get(guildId, userId, userPokemonId);
        
        if (pokemonStats) {
            await cacheService.set(currentHpKey, pokemonStats.hp, 3600);
        }
    }
}

module.exports = HealingService; 