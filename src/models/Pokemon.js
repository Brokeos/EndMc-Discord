class Pokemon {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.base_experience = data.base_experience;
        this.height = data.height;
        this.is_default = data.is_default;
        this.order = data.order;
        this.weight = data.weight;
        this.abilities = data.abilities;
        this.forms = data.forms;
        this.game_indices = data.game_indices;
        this.held_items = data.held_items;
        this.location_area_encounters = data.location_area_encounters;
        this.moves = data.moves;
        this.past_types = data.past_types;
        this.past_abilities = data.past_abilities;
        this.sprites = data.sprites;
        this.cries = data.cries;
        this.species = data.species;
        this.stats = data.stats;
        this.types = data.types;
    }

    getBasicInfo() {
        return {
            id: this.id,
            name: this.name,
            height: this.height,
            weight: this.weight,
            base_experience: this.base_experience
        };
    }

    getAbilities() {
        return this.abilities.map(ability => ({
            name: ability.ability.name,
            is_hidden: ability.is_hidden,
            slot: ability.slot
        }));
    }

    getTypes() {
        return this.types.map(type => ({
            name: type.type.name,
            slot: type.slot
        }));
    }

    getStats() {
        return this.stats.map(stat => ({
            name: stat.stat.name,
            base_stat: stat.base_stat,
            effort: stat.effort
        }));
    }

    getSprites() {
        return {
            front_default: this.sprites.front_default,
            front_shiny: this.sprites.front_shiny,
            back_default: this.sprites.back_default,
            back_shiny: this.sprites.back_shiny
        };
    }
}

module.exports = Pokemon; 