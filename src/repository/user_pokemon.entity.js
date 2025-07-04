const { get, add, update, getAllByMember, remove } = require('./user_pokemon.database');
const cacheService = require('../services/cache.service');

class UserPokemon {
	static CACHE_TTL = 15 * 60; //15 minutes
	static ENTITY_NAME = 'user_pokemon';
	
	constructor(id, guild_id, user_id, pokemon_api_id, pokemon_name, level, experience, sprite_url) {
		this.id = id;
		this.guild_id = guild_id;
		this.user_id = user_id;
		this.pokemon_api_id = pokemon_api_id;
		this.pokemon_name = pokemon_name;
		this.level = level;
		this.experience = experience;
		this.sprite_url = sprite_url;
	}
	
	static async get(id) {
		const cacheKey = cacheService.generateKey(this.ENTITY_NAME, id);
		const cachedUserPokemon = await cacheService.get(cacheKey);
		
		if (cachedUserPokemon) {
			return new UserPokemon(
				cachedUserPokemon.id,
				cachedUserPokemon.guild_id,
				cachedUserPokemon.user_id,
				cachedUserPokemon.pokemon_api_id,
				cachedUserPokemon.pokemon_name,
				cachedUserPokemon.level,
				cachedUserPokemon.experience,
				cachedUserPokemon.sprite_url
			);
		}
		
		const result = await get(id);
		
		if (result) {
			const userPokemon = new UserPokemon(
				result.id,
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
			result.id,
			result.guild_id,
			result.user_id,
			result.pokemon_api_id,
			result.pokemon_name,
			result.level,
			result.experience,
			result.sprite_url
		);
		const cacheKey = cacheService.generateKey(this.ENTITY_NAME, result.id);
		
		await cacheService.set(cacheKey, userPokemon, this.CACHE_TTL);
		await this._invalidateMemberCache(guild_id, user_id);
		
		return userPokemon;
	}
	
	static async update(id, level, experience) {
		const cacheKey = cacheService.generateKey(this.ENTITY_NAME, id);
		const userPokemon = await this.get(id);
		
		if (!userPokemon) {
			throw new Error(`UserPokemon with id ${id} not found`);
		}
		
		const result = await update(id, {
			'level': level,
			'experience': experience
		});
		
		if (result) {
			const updatedUserPokemon = new UserPokemon(
				result.id,
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
				pokemon.id,
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
				result.id,
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
				const individualCacheKey = cacheService.generateKey(this.ENTITY_NAME, userPokemon.id);
				const existingCache = await cacheService.get(individualCacheKey);
				
				if (!existingCache) {
					await cacheService.set(individualCacheKey, userPokemon, this.CACHE_TTL);
				}
			}
			
			return userPokemonList;
		}
		
		return [];
	}
	
	static async delete(id) {
		const userPokemon = await this.get(id);
		const cacheKey = cacheService.generateKey(this.ENTITY_NAME, id);
		
		await cacheService.delete(cacheKey);
		
		if (userPokemon) {
			await this._invalidateMemberCache(userPokemon.guild_id, userPokemon.user_id);
		}
		
		return await remove(id);
	}
}

module.exports = UserPokemon;