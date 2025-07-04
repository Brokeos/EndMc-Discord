const { database } = require('./config');

/*
CREATE TABLE user_pokemon (
    user_pokemon_id INT NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    pokemon_api_id INT NOT NULL,
    pokemon_name VARCHAR(100) NOT NULL,
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    sprite_url VARCHAR(255),
    PRIMARY KEY (guild_id, user_id, user_pokemon_id)
);
*/

async function get(guild_id, user_id, user_pokemon_id){
	const query = 'SELECT * FROM user_pokemon WHERE guild_id = $1 AND user_id = $2 AND user_pokemon_id = $3';
	const result = await database.query(query, [guild_id, user_id, user_pokemon_id]);
	
	return result.rows[0] || null;
}

async function getNextUserPokemonId(guild_id, user_id) {
	const query = 'SELECT COALESCE(MAX(user_pokemon_id), 0) + 1 as next_id FROM user_pokemon WHERE guild_id = $1 AND user_id = $2';
	const result = await database.query(query, [guild_id, user_id]);
	
	return result.rows[0].next_id;
}

async function add(guild_id, user_id, pokemon_api_id, pokemon_name, sprite_url){
	const user_pokemon_id = await getNextUserPokemonId(guild_id, user_id);
	
	const query = `
		INSERT INTO user_pokemon (user_pokemon_id, guild_id, user_id, pokemon_api_id, pokemon_name, sprite_url)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING *`;
	const values = [user_pokemon_id, guild_id, user_id, pokemon_api_id, pokemon_name, sprite_url];
	const result = await database.query(query, values);
	
	return result.rows[0];
}

async function update(guild_id, user_id, user_pokemon_id, updates = {}) {
	const allowedFields = {
		level: 'level',
		experience: 'experience'
	};
	const fieldsToUpdate = Object.keys(updates).filter(key =>
		allowedFields[key] && updates[key] !== undefined
	);
	
	if (fieldsToUpdate.length === 0) {
		throw new Error('No valid fields to update');
	}
	
	const setClause = fieldsToUpdate
		.map((field, index) => `${allowedFields[field]} = $${index + 4}`)
		.join(', ');
	const query = `
    UPDATE user_pokemon
    SET ${setClause}
    WHERE guild_id = $1 AND user_id = $2 AND user_pokemon_id = $3
    RETURNING *`;
	const values = [guild_id, user_id, user_pokemon_id, ...fieldsToUpdate.map(field => updates[field])];
	const result = await database.query(query, values);
	
	return result.rows[0];
}

async function getAllByMember(guild_id, user_id){
	const query = `
		SELECT up.* FROM user_pokemon up
		LEFT JOIN user_inventory ui ON up.guild_id = ui.guild_id AND up.user_id = ui.user_id AND up.user_pokemon_id = ui.user_pokemon_id
		WHERE up.guild_id = $1 AND up.user_id = $2 AND ui.user_pokemon_id IS NULL`;
	const values = [guild_id, user_id];
	const result = await database.query(query, values);
	
	return result.rows;
}

async function remove(guild_id, user_id, user_pokemon_id)
{
	const query = 'DELETE FROM user_pokemon WHERE guild_id = $1 AND user_id = $2 AND user_pokemon_id = $3';
	
	await database.query(query, [guild_id, user_id, user_pokemon_id]);
	
	return true;
}

module.exports = {
	get,
	add,
	update,
	getAllByMember,
	remove
}