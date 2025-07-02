class PokemonSpecies {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.order = data.order;
        this.gender_rate = data.gender_rate;
        this.capture_rate = data.capture_rate;
        this.base_happiness = data.base_happiness;
        this.is_baby = data.is_baby;
        this.is_legendary = data.is_legendary;
        this.is_mythical = data.is_mythical;
        this.hatch_counter = data.hatch_counter;
        this.has_gender_differences = data.has_gender_differences;
        this.forms_switchable = data.forms_switchable;
        this.growth_rate = data.growth_rate;
        this.pokedex_numbers = data.pokedex_numbers;
        this.egg_groups = data.egg_groups;
        this.color = data.color;
        this.shape = data.shape;
        this.evolves_from_species = data.evolves_from_species;
        this.evolution_chain = data.evolution_chain;
        this.habitat = data.habitat;
        this.generation = data.generation;
        this.names = data.names;
        this.pal_park_encounters = data.pal_park_encounters;
        this.flavor_text_entries = data.flavor_text_entries;
        this.form_descriptions = data.form_descriptions;
        this.genera = data.genera;
        this.varieties = data.varieties;
    }

    getBasicInfo() {
        return {
            id: this.id,
            name: this.name,
            order: this.order,
            capture_rate: this.capture_rate,
            base_happiness: this.base_happiness,
            is_baby: this.is_baby,
            is_legendary: this.is_legendary,
            is_mythical: this.is_mythical
        };
    }

    getBreedingInfo() {
        return {
            gender_rate: this.gender_rate,
            hatch_counter: this.hatch_counter,
            has_gender_differences: this.has_gender_differences,
            egg_groups: this.egg_groups
        };
    }

    getEvolutionInfo() {
        return {
            evolves_from_species: this.evolves_from_species,
            evolution_chain: this.evolution_chain,
            forms_switchable: this.forms_switchable
        };
    }

    getPokedexEntries() {
        return this.pokedex_numbers.map(entry => ({
            entry_number: entry.entry_number,
            pokedex: entry.pokedex
        }));
    }

    getFlavorTexts() {
        return this.flavor_text_entries.map(entry => ({
            flavor_text: entry.flavor_text,
            language: entry.language,
            version: entry.version
        }));
    }

    getGenera() {
        return this.genera.map(genus => ({
            genus: genus.genus,
            language: genus.language
        }));
    }

    getVarieties() {
        return this.varieties.map(variety => ({
            is_default: variety.is_default,
            pokemon: variety.pokemon
        }));
    }
}

module.exports = PokemonSpecies; 