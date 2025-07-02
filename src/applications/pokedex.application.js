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
}

module.exports = new PokedexApplication();
