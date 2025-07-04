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