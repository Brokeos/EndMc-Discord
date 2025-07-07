const UserInventory = require('../../repository/user_inventory.entity');
const HealingService = require('../healing.service');

class ValidationService {
    static async validateDuelParticipants(guildId, challengerId, challengedId) {
        if (challengerId === challengedId) {
            return { isValid: false, error: 'Vous ne pouvez pas vous défier vous-même.' };
        }

        const challengerInventory = await UserInventory.getByMember(guildId, challengerId);
        const challengedInventory = await UserInventory.getByMember(guildId, challengedId);

        if (challengerInventory.length === 0) {
            return { isValid: false, error: 'Le défiant n\'a aucun Pokémon dans son inventaire.' };
        }

        if (challengedInventory.length === 0) {
            return { isValid: false, error: 'Le défié n\'a aucun Pokémon dans son inventaire.' };
        }

        if (challengerInventory.length !== challengedInventory.length) {
            return { 
                isValid: false, 
                error: `Les deux joueurs doivent avoir le même nombre de Pokémon dans leur inventaire. (${challengerInventory.length} vs ${challengedInventory.length})` 
            };
        }

        const challengerHealed = await HealingService.areAllPokemonHealed(guildId, challengerId, challengerInventory);
        if (!challengerHealed) {
            return { isValid: false, error: 'Tous vos Pokémon doivent être soignés pour commencer un duel.' };
        }

        const challengedHealed = await HealingService.areAllPokemonHealed(guildId, challengedId, challengedInventory);
        if (!challengedHealed) {
            return { isValid: false, error: 'Tous les Pokémon de votre adversaire doivent être soignés pour commencer un duel.' };
        }

        return { isValid: true };
    }

    static async canParticipateInDuel(guildId, userId) {
        const inventory = await UserInventory.getByMember(guildId, userId);
        
        if (inventory.length === 0) {
            return { canParticipate: false, error: 'Aucun Pokémon dans l\'inventaire.' };
        }

        const allHealed = await HealingService.areAllPokemonHealed(guildId, userId, inventory);
        if (!allHealed) {
            return { canParticipate: false, error: 'Tous vos Pokémon doivent être soignés pour participer à un duel.' };
        }

        return { canParticipate: true };
    }
}

module.exports = ValidationService; 