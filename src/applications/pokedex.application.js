const axios = require('axios');
const Pokemon = require('../models/Pokemon');
const PokemonSpecies = require("../models/PokemonSpecies");

class PokedexApplication {
    constructor() {
        this.baseUrl = 'https://pokeapi.co/api/v2';
    }

    async getPokemon(pokemonName) {
        try {
            const response = await axios.get(`${this.baseUrl}/pokemon/${pokemonName}`);
            
            return new Pokemon(response.data);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new Error(`Pokemon "${pokemonName}" not found`);
            }
            throw new Error(`Error fetching Pokemon: ${error.message}`);
        }
    }
    
    async getPokemonSpecies(pokemonName){
        try {
            const response = await axios.get(`${this.baseUrl}/pokemon-species/${pokemonName}`);
            
            return new PokemonSpecies(response.data);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new Error(`Pokemon "${pokemonName}" not found`);
            }
            throw new Error(`Error fetching Pokemon: ${error.message}`);
        }
    }

    async getPokemonBaseStats(pokemonName) {
        try {
            const pokemon = await this.getPokemon(pokemonName);
            const stats = {};
            
            pokemon.stats.forEach(stat => {
                const statName = stat.stat.name.replace('-', '_');
                stats[statName] = stat.base_stat;
            });
            
            return {
                hp: stats.hp,
                attack: stats.attack,
                defense: stats.defense,
                special_attack: stats.special_attack,
                special_defense: stats.special_defense,
                speed: stats.speed
            };
        } catch (error) {
            throw new Error(`Error fetching Pokemon stats: ${error.message}`);
        }
    }
}

module.exports = new PokedexApplication();
