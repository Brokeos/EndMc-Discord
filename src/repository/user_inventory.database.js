const { database } = require('./config');

/*
CREATE TABLE user_inventory (
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    user_pokemon_id INT NOT NULL,
    slot_position SMALLINT NOT NULL CHECK (slot_position BETWEEN 1 AND 3),
    PRIMARY KEY (guild_id, user_id, slot_position),
    FOREIGN KEY (guild_id, user_id, user_pokemon_id) REFERENCES user_pokemon(guild_id, user_id, user_pokemon_id) ON DELETE CASCADE,
    UNIQUE (guild_id, user_id, user_pokemon_id)
);
*/

async function getInventoryByMember(guild_id, user_id) {
    const query = `
        SELECT ui.*, up.pokemon_api_id, up.pokemon_name, up.level, up.experience, up.sprite_url
        FROM user_inventory ui
        JOIN user_pokemon up ON ui.guild_id = up.guild_id AND ui.user_id = up.user_id AND ui.user_pokemon_id = up.user_pokemon_id
        WHERE ui.guild_id = $1 AND ui.user_id = $2
        ORDER BY ui.slot_position`;
    const values = [guild_id, user_id];
    const result = await database.query(query, values);
    
    return result.rows;
}

async function addPokemonToInventory(guild_id, user_id, user_pokemon_id, slot_position) {
    const query = `
        INSERT INTO user_inventory (guild_id, user_id, user_pokemon_id, slot_position)
        VALUES ($1, $2, $3, $4)
        RETURNING *`;
    const values = [guild_id, user_id, user_pokemon_id, slot_position];
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
        FROM generate_series(1, 3) AS slot_position
        WHERE slot_position NOT IN (
            SELECT slot_position 
            FROM user_inventory 
            WHERE guild_id = $1 AND user_id = $2
        )
        ORDER BY slot_position
        LIMIT 1`;
    const values = [guild_id, user_id];
    const result = await database.query(query, values);
    
    return result.rows.length > 0 ? result.rows[0].slot_position : null;
}

async function isPokemonInInventory(guild_id, user_id, user_pokemon_id) {
    const query = 'SELECT 1 FROM user_inventory WHERE guild_id = $1 AND user_id = $2 AND user_pokemon_id = $3';
    const result = await database.query(query, [guild_id, user_id, user_pokemon_id]);
    
    return result.rows.length > 0;
}

module.exports = {
    getInventoryByMember,
    addPokemonToInventory,
    removePokemonFromInventory,
    getAvailableSlot,
    isPokemonInInventory
};