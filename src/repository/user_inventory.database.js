const { database } = require('./config');

/*
CREATE TABLE user_inventory (
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    pokemon_id BIGINT NOT NULL,
    slot_position SMALLINT NOT NULL CHECK (slot_position BETWEEN 1 AND 3),
    PRIMARY KEY (guild_id, user_id, slot_position),
    FOREIGN KEY (pokemon_id) REFERENCES user_pokemon(id) ON DELETE CASCADE,
    UNIQUE (pokemon_id)
);
*/

async function getInventoryByMember(guild_id, user_id) {
    const query = `
        SELECT ui.*, up.pokemon_api_id, up.pokemon_name, up.level, up.experience, up.sprite_url
        FROM user_inventory ui
        JOIN user_pokemon up ON ui.pokemon_id = up.id
        WHERE ui.guild_id = $1 AND ui.user_id = $2
        ORDER BY ui.slot_position`;
    const values = [guild_id, user_id];
    const result = await database.query(query, values);
    
    return result.rows;
}

async function addPokemonToInventory(guild_id, user_id, pokemon_id, slot_position) {
    const query = `
        INSERT INTO user_inventory (guild_id, user_id, pokemon_id, slot_position)
        VALUES ($1, $2, $3, $4)
        RETURNING *`;
    const values = [guild_id, user_id, pokemon_id, slot_position];
    const result = await database.query(query, values);
    
    return result.rows[0];
}

async function removePokemonFromInventory(guild_id, user_id, slot_position) {
    const query = `
        DELETE FROM user_inventory 
        WHERE guild_id = $1 AND user_id = $2 AND slot_position = $3
        RETURNING *`;
    const values = [guild_id, user_id, slot_position];
    const result = await database.query(query, values);
    
    return result.rows[0];
}

async function getAvailableSlot(guild_id, user_id) {
    const query = `
        SELECT slot_position 
        FROM user_inventory 
        WHERE guild_id = $1 AND user_id = $2
        ORDER BY slot_position`;
    const values = [guild_id, user_id];
    const result = await database.query(query, values);
    
    const usedSlots = result.rows.map(row => row.slot_position);
    
    for (let slot = 1; slot <= 3; slot++) {
        if (!usedSlots.includes(slot)) {
            return slot;
        }
    }
    
    return null;
}

async function isPokemonInInventory(pokemon_id) {
    const query = 'SELECT 1 FROM user_inventory WHERE pokemon_id = $1';
    const result = await database.query(query, [pokemon_id]);
    
    return result.rows.length > 0;
}

module.exports = {
    getInventoryByMember,
    addPokemonToInventory,
    removePokemonFromInventory,
    getAvailableSlot,
    isPokemonInInventory
};