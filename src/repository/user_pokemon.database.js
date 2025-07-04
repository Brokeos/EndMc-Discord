const { database } = require('./config');

/*
CREATE TABLE user_pokemon (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    pokemon_api_id INT NOT NULL,
    pokemon_name VARCHAR(100) NOT NULL,
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    sprite_url VARCHAR(255)
);
*/

async function get(id){
	const query = 'SELECT * FROM user_pokemon WHERE id = $1';
	const result = await database.query(query, [id]);
	
	return result.rows[0] || null;
}

async function add(guild_id, user_id, pokemon_api_id, pokemon_name, sprite_url){
	const query = `
		INSERT INTO user_pokemon (guild_id, user_id, pokemon_api_id, pokemon_name, sprite_url)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING *`;
	const values = [guild_id, user_id, pokemon_api_id, pokemon_name, sprite_url];
	const result = await database.query(query, values);
	
	return result.rows[0];
}

async function update(id, updates = {}) {
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
		.map((field, index) => `${allowedFields[field]} = $${index + 2}`)
		.join(', ');
	const query = `
    UPDATE user_pokemon
    SET ${setClause}
    WHERE id = $1
    RETURNING *`;
	const values = [id, ...fieldsToUpdate.map(field => updates[field])];
	const result = await database.query(query, values);
	
	return result.rows[0];
}

async function getAllByMember(guild_id, user_id){
	const query = `
		SELECT up.* FROM user_pokemon up
		LEFT JOIN user_inventory ui ON up.id = ui.pokemon_id
		WHERE up.guild_id = $1 AND up.user_id = $2 AND ui.pokemon_id IS NULL`;
	const values = [guild_id, user_id];
	const result = await database.query(query, values);
	
	return result.rows;
}

async function remove(id)
{
	const query = 'DELETE FROM user_pokemon WHERE id = $1';
	
	await database.query(query, [id]);
	
	return true;
}

module.exports = {
	get,
	add,
	update,
	getAllByMember,
	remove
}