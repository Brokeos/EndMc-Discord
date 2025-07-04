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

CREATE TABLE user_inventory (
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    user_pokemon_id INT NOT NULL,
    slot_position SMALLINT NOT NULL CHECK (slot_position BETWEEN 1 AND 3),
    PRIMARY KEY (guild_id, user_id, slot_position),
    FOREIGN KEY (guild_id, user_id, user_pokemon_id) REFERENCES user_pokemon(guild_id, user_id, user_pokemon_id) ON DELETE CASCADE,
    UNIQUE (guild_id, user_id, user_pokemon_id)
);