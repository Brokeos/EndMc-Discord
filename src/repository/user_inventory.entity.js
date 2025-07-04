const { getInventoryByMember, addPokemonToInventory, removePokemonFromInventory, getAvailableSlot, isPokemonInInventory } = require('./user_inventory.database');
const UserPokemon = require('./user_pokemon.entity');
const cacheService = require('../services/cache.service');

class UserInventory {
    static CACHE_TTL = 15 * 60;
    static ENTITY_NAME = 'user_inventory';
    
    constructor(guild_id, user_id, user_pokemon_id, slot_position, pokemon_data) {
        this.guild_id = guild_id;
        this.user_id = user_id;
        this.user_pokemon_id = user_pokemon_id;
        this.slot_position = slot_position;
        this.pokemon_data = pokemon_data;
    }
    
    static async getByMember(guild_id, user_id) {
        const inventoryCacheKey = cacheService.generateKey(this.ENTITY_NAME, `${guild_id}_${user_id}`);
        const cachedInventory = await cacheService.get(inventoryCacheKey);
        
        if (cachedInventory) {
            return cachedInventory.map(item => new UserInventory(
                item.guild_id,
                item.user_id,
                item.user_pokemon_id,
                item.slot_position,
                item.pokemon_data
            ));
        }
        
        const results = await getInventoryByMember(guild_id, user_id);
        
        if (results && results.length > 0) {
            const inventoryList = results.map(result => {
                const pokemon_data = {
                    user_pokemon_id: result.user_pokemon_id,
                    pokemon_api_id: result.pokemon_api_id,
                    pokemon_name: result.pokemon_name,
                    level: result.level,
                    experience: result.experience,
                    sprite_url: result.sprite_url
                };
                
                return new UserInventory(
                    result.guild_id,
                    result.user_id,
                    result.user_pokemon_id,
                    result.slot_position,
                    pokemon_data
                );
            });
            
            await cacheService.set(inventoryCacheKey, inventoryList, this.CACHE_TTL);
            
            return inventoryList;
        }
        
        return [];
    }
    
    static async add(guild_id, user_id, user_pokemon_id) {
        const isPokemonInStorage = await UserPokemon.get(guild_id, user_id, user_pokemon_id);
        if (!isPokemonInStorage || isPokemonInStorage.guild_id !== guild_id || isPokemonInStorage.user_id !== user_id) {
            throw new Error('Pokemon not found in user storage');
        }
        
        const isAlreadyInInventory = await isPokemonInInventory(guild_id, user_id, user_pokemon_id);
        if (isAlreadyInInventory) {
            throw new Error('Pokemon is already in inventory');
        }
        
        const availableSlot = await getAvailableSlot(guild_id, user_id);
        if (!availableSlot) {
            throw new Error('Inventory is full');
        }
        
        const result = await addPokemonToInventory(guild_id, user_id, user_pokemon_id, availableSlot);
        
        await this._invalidateInventoryCache(guild_id, user_id);
        
        const pokemon_data = {
            user_pokemon_id: isPokemonInStorage.user_pokemon_id,
            pokemon_api_id: isPokemonInStorage.pokemon_api_id,
            pokemon_name: isPokemonInStorage.pokemon_name,
            level: isPokemonInStorage.level,
            experience: isPokemonInStorage.experience,
            sprite_url: isPokemonInStorage.sprite_url
        };
        
        return new UserInventory(
            result.guild_id,
            result.user_id,
            result.user_pokemon_id,
            result.slot_position,
            pokemon_data
        );
    }
    
    static async remove(guild_id, user_id, slot_position) {
        const result = await removePokemonFromInventory(guild_id, user_id, slot_position);
        
        if (result) {
            await this._invalidateInventoryCache(guild_id, user_id);
            return result;
        }
        
        return null;
    }
    
    static async _invalidateInventoryCache(guild_id, user_id) {
        const inventoryCacheKey = cacheService.generateKey(this.ENTITY_NAME, `${guild_id}_${user_id}`);
        await cacheService.delete(inventoryCacheKey);
    }
}

module.exports = UserInventory; 