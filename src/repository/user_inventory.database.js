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