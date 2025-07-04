const { database } = require('./config');

/*
CREATE TABLE user_pokemon_stats (
	guild_id VARCHAR(20) NOT NULL,
	user_id VARCHAR(20) NOT NULL,
	user_pokemon_id INT NOT NULL,
	hp INT NOT NULL,
	attack INT NOT NULL,
	defense INT NOT NULL,
	special_attack INT NOT NULL,
	special_defense INT NOT NULL,
	speed INT NOT NULL,
	PRIMARY KEY (guild_id, user_id, user_pokemon_id),
	FOREIGN KEY (guild_id, user_id, user_pokemon_id) REFERENCES user_pokemon(guild_id, user_id, user_pokemon_id) ON DELETE CASCADE
);
 */

async function get(guild_id, user_id, user_pokemon_id) {
	const query = 'SELECT * FROM user_pokemon_stats WHERE guild_id = $1 AND user_id = $2 AND user_pokemon_id = $3';
	const result = await database.query(query, [guild_id, user_id, user_pokemon_id]);
	
	return result.rows[0] || null;
}

async function add(guild_id, user_id, user_pokemon_id, hp, attack, defense, special_attack, special_defense, speed) {
	const query = `
		INSERT INTO user_pokemon_stats (guild_id, user_id, user_pokemon_id, hp, attack, defense, special_attack, special_defense, speed)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING *`;
	const values = [guild_id, user_id, user_pokemon_id, hp, attack, defense, special_attack, special_defense, speed];
	const result = await database.query(query, values);
	
	return result.rows[0];
}

async function update(guild_id, user_id, user_pokemon_id, updates = {}) {
	const allowedFields = {
		hp: 'hp',
		attack: 'attack',
		defense: 'defense',
		special_attack: 'special_attack',
		special_defense: 'special_defense',
		speed: 'speed'
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
    UPDATE user_pokemon_stats
    SET ${setClause}
    WHERE guild_id = $1 AND user_id = $2 AND user_pokemon_id = $3
    RETURNING *`;
	const values = [guild_id, user_id, user_pokemon_id, ...fieldsToUpdate.map(field => updates[field])];
	const result = await database.query(query, values);
	
	return result.rows[0];
}

async function remove(guild_id, user_id, user_pokemon_id) {
	const query = 'DELETE FROM user_pokemon_stats WHERE guild_id = $1 AND user_id = $2 AND user_pokemon_id = $3';
	
	await database.query(query, [guild_id, user_id, user_pokemon_id]);
	
	return true;
}

module.exports = {
	get,
	add,
	update,
	remove
} 