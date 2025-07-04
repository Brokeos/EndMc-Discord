const { get, add, update, getAllByMember, remove } = require('./user_pokemon.database');
const cacheService = require('../services/cache.service');
const PokedexApplication = require('../applications/pokedex.application');
const UserPokemonStats = require('./user_pokemon_stats.entity');

class UserPokemon {
	static CACHE_TTL = 15 * 60; //15 minutes
	static ENTITY_NAME = 'user_pokemon';
	
	constructor(user_pokemon_id, guild_id, user_id, pokemon_api_id, pokemon_name, level, experience, sprite_url) {
		this.user_pokemon_id = user_pokemon_id;
		this.guild_id = guild_id;
		this.user_id = user_id;
		this.pokemon_api_id = pokemon_api_id;
		this.pokemon_name = pokemon_name;
		this.level = level;
		this.experience = experience;
		this.sprite_url = sprite_url;
	}
	
	static async get(guild_id, user_id, user_pokemon_id) {
		const cacheKey = cacheService.generateKey(this.ENTITY_NAME, `${guild_id}_${user_id}_${user_pokemon_id}`);
		const cachedUserPokemon = await cacheService.get(cacheKey);
		
		if (cachedUserPokemon) {
			return new UserPokemon(
				cachedUserPokemon.user_pokemon_id,
				cachedUserPokemon.guild_id,
				cachedUserPokemon.user_id,
				cachedUserPokemon.pokemon_api_id,
				cachedUserPokemon.pokemon_name,
				cachedUserPokemon.level,
				cachedUserPokemon.experience,
				cachedUserPokemon.sprite_url
			);
		}
		
		const result = await get(guild_id, user_id, user_pokemon_id);
		
		if (result) {
			const userPokemon = new UserPokemon(
				result.user_pokemon_id,
				result.guild_id,
				result.user_id,
				result.pokemon_api_id,
				result.pokemon_name,
				result.level,
				result.experience,
				result.sprite_url
			);
			
			await cacheService.set(cacheKey, userPokemon, this.CACHE_TTL);
			
			return userPokemon;
		}
		
		return null;
	}
	
	static async _invalidateMemberCache(guild_id, user_id) {
		const memberCacheKey = cacheService.generateKey(`${this.ENTITY_NAME}_member`, `${guild_id}_${user_id}`);
		
		await cacheService.delete(memberCacheKey);
	}
	
	static async add(guild_id, user_id, pokemon_api_id, pokemon_name, sprite_url) {
		const result = await add(guild_id, user_id, pokemon_api_id, pokemon_name, sprite_url);
		const userPokemon = new UserPokemon(
			result.user_pokemon_id,
			result.guild_id,
			result.user_id,
			result.pokemon_api_id,
			result.pokemon_name,
			result.level,
			result.experience,
			result.sprite_url
		);
		const cacheKey = cacheService.generateKey(this.ENTITY_NAME, `${result.guild_id}_${result.user_id}_${result.user_pokemon_id}`);
		
		await cacheService.set(cacheKey, userPokemon, this.CACHE_TTL);
		await this._invalidateMemberCache(guild_id, user_id);
		
		try {
			const baseStats = await PokedexApplication.getPokemonBaseStats(pokemon_api_id);
			await UserPokemonStats.add(
				guild_id,
				user_id,
				result.user_pokemon_id,
				baseStats.hp,
				baseStats.attack,
				baseStats.defense,
				baseStats.special_attack,
				baseStats.special_defense,
				baseStats.speed
			);
		} catch (error) {
			console.error('Error adding Pokemon stats:', error);
		}
		
		return userPokemon;
	}
	
	static async update(guild_id, user_id, user_pokemon_id, level, experience) {
		const cacheKey = cacheService.generateKey(this.ENTITY_NAME, `${guild_id}_${user_id}_${user_pokemon_id}`);
		const userPokemon = await this.get(guild_id, user_id, user_pokemon_id);
		
		if (!userPokemon) {
			throw new Error(`UserPokemon with id ${user_pokemon_id} not found for user ${user_id} in guild ${guild_id}`);
		}
		
		const result = await update(guild_id, user_id, user_pokemon_id, {
			'level': level,
			'experience': experience
		});
		
		if (result) {
			const updatedUserPokemon = new UserPokemon(
				result.user_pokemon_id,
				result.guild_id,
				result.user_id,
				result.pokemon_api_id,
				result.pokemon_name,
				result.level,
				result.experience,
				result.sprite_url
			);
			
			await cacheService.set(cacheKey, updatedUserPokemon, this.CACHE_TTL);
			await this._invalidateMemberCache(result.guild_id, result.user_id);
			
			return updatedUserPokemon;
		}
		
		return null;
	}

	static async getAllByMember(guild_id, user_id) {
		const memberCacheKey = cacheService.generateKey(`${this.ENTITY_NAME}_member`, `${guild_id}_${user_id}`);
		const cachedMemberPokemon = await cacheService.get(memberCacheKey);
		
		if (cachedMemberPokemon) {
			return cachedMemberPokemon.map(pokemon => new UserPokemon(
				pokemon.user_pokemon_id,
				pokemon.guild_id,
				pokemon.user_id,
				pokemon.pokemon_api_id,
				pokemon.pokemon_name,
				pokemon.level,
				pokemon.experience,
				pokemon.sprite_url
			));
		}
		
		const results = await getAllByMember(guild_id, user_id);
		
		if (results && results.length > 0) {
			const userPokemonList = results.map(result => new UserPokemon(
				result.user_pokemon_id,
				result.guild_id,
				result.user_id,
				result.pokemon_api_id,
				result.pokemon_name,
				result.level,
				result.experience,
				result.sprite_url
			));
			
			await cacheService.set(memberCacheKey, userPokemonList, this.CACHE_TTL);
			
			for (const userPokemon of userPokemonList) {
				const individualCacheKey = cacheService.generateKey(this.ENTITY_NAME, `${userPokemon.guild_id}_${userPokemon.user_id}_${userPokemon.user_pokemon_id}`);
				const existingCache = await cacheService.get(individualCacheKey);
				
				if (!existingCache) {
					await cacheService.set(individualCacheKey, userPokemon, this.CACHE_TTL);
				}
			}
			
			return userPokemonList;
		}
		
		return [];
	}
	
	static async delete(guild_id, user_id, user_pokemon_id) {
		const userPokemon = await this.get(guild_id, user_id, user_pokemon_id);
		const cacheKey = cacheService.generateKey(this.ENTITY_NAME, `${guild_id}_${user_id}_${user_pokemon_id}`);
		
		await cacheService.delete(cacheKey);
		
		if (userPokemon) {
			await this._invalidateMemberCache(userPokemon.guild_id, userPokemon.user_id);
		}
		
		try {
			await UserPokemonStats.delete(guild_id, user_id, user_pokemon_id);
		} catch (error) {
			console.error('Error deleting Pokemon stats:', error);
		}
		
		return await remove(guild_id, user_id, user_pokemon_id);
	}
}

module.exports = UserPokemon;