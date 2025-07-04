const { get, add, update, remove } = require('./user_pokemon_stats.database');
const cacheService = require('../services/cache.service');

class UserPokemonStats {
	static CACHE_TTL = 15 * 60;
	static ENTITY_NAME = 'user_pokemon_stats';
	
	constructor(guild_id, user_id, user_pokemon_id, hp, attack, defense, special_attack, special_defense, speed) {
		this.guild_id = guild_id;
		this.user_id = user_id;
		this.user_pokemon_id = user_pokemon_id;
		this.hp = hp;
		this.attack = attack;
		this.defense = defense;
		this.special_attack = special_attack;
		this.special_defense = special_defense;
		this.speed = speed;
	}
	
	static async get(guild_id, user_id, user_pokemon_id) {
		const cacheKey = cacheService.generateKey(this.ENTITY_NAME, `${guild_id}_${user_id}_${user_pokemon_id}`);
		const cachedStats = await cacheService.get(cacheKey);
		
		if (cachedStats) {
			return new UserPokemonStats(
				cachedStats.guild_id,
				cachedStats.user_id,
				cachedStats.user_pokemon_id,
				cachedStats.hp,
				cachedStats.attack,
				cachedStats.defense,
				cachedStats.special_attack,
				cachedStats.special_defense,
				cachedStats.speed
			);
		}
		
		const result = await get(guild_id, user_id, user_pokemon_id);
		
		if (result) {
			const userPokemonStats = new UserPokemonStats(
				result.guild_id,
				result.user_id,
				result.user_pokemon_id,
				result.hp,
				result.attack,
				result.defense,
				result.special_attack,
				result.special_defense,
				result.speed
			);
			
			await cacheService.set(cacheKey, userPokemonStats, this.CACHE_TTL);
			
			return userPokemonStats;
		}
		
		return null;
	}
	
	static async add(guild_id, user_id, user_pokemon_id, hp, attack, defense, special_attack, special_defense, speed) {
		const result = await add(guild_id, user_id, user_pokemon_id, hp, attack, defense, special_attack, special_defense, speed);
		const userPokemonStats = new UserPokemonStats(
			result.guild_id,
			result.user_id,
			result.user_pokemon_id,
			result.hp,
			result.attack,
			result.defense,
			result.special_attack,
			result.special_defense,
			result.speed
		);
		const cacheKey = cacheService.generateKey(this.ENTITY_NAME, `${result.guild_id}_${result.user_id}_${result.user_pokemon_id}`);
		
		await cacheService.set(cacheKey, userPokemonStats, this.CACHE_TTL);
		
		return userPokemonStats;
	}
	
	static async update(guild_id, user_id, user_pokemon_id, statsUpdates) {
		const cacheKey = cacheService.generateKey(this.ENTITY_NAME, `${guild_id}_${user_id}_${user_pokemon_id}`);
		const userPokemonStats = await this.get(guild_id, user_id, user_pokemon_id);
		
		if (!userPokemonStats) {
			throw new Error(`UserPokemonStats with id ${user_pokemon_id} not found for user ${user_id} in guild ${guild_id}`);
		}
		
		const result = await update(guild_id, user_id, user_pokemon_id, statsUpdates);
		
		if (result) {
			const updatedUserPokemonStats = new UserPokemonStats(
				result.guild_id,
				result.user_id,
				result.user_pokemon_id,
				result.hp,
				result.attack,
				result.defense,
				result.special_attack,
				result.special_defense,
				result.speed
			);
			
			await cacheService.set(cacheKey, updatedUserPokemonStats, this.CACHE_TTL);
			
			return updatedUserPokemonStats;
		}
		
		return null;
	}
	
	static async delete(guild_id, user_id, user_pokemon_id) {
		const cacheKey = cacheService.generateKey(this.ENTITY_NAME, `${guild_id}_${user_id}_${user_pokemon_id}`);
		
		await cacheService.delete(cacheKey);
		
		return await remove(guild_id, user_id, user_pokemon_id);
	}
}

module.exports = UserPokemonStats; 