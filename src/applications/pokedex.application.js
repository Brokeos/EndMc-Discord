const axios = require('axios');
const Pokemon = require('../models/Pokemon');

class PokedexApplication {
    constructor() {
        this.baseUrl = 'https://pokeapi.co/api/v2/pokemon/';
    }

    async getPokemon(pokemonName) {
        const normalizedName = pokemonName.toLowerCase().trim();

        try {
            const response = await axios.get(`${this.baseUrl}${normalizedName}`);
            
            return new Pokemon(response.data);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new Error(`Pokemon "${pokemonName}" not found`);
            }
            throw new Error(`Error fetching Pokemon: ${error.message}`);
        }
    }
}

module.exports = new PokedexApplication();
