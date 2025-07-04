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
			
			return updatedUserPokemon;
		}
		
		return null;
	}
	
	static async delete(id) {
		const cacheKey = cacheService.generateKey(this.ENTITY_NAME, id);
		
		await cacheService.delete(cacheKey);
		
		return await remove(id);
	}
}

module.exports = UserPokemon;