const UserInventory = require('../../repository/user_inventory.entity');
const UserPokemonStats = require('../../repository/user_pokemon_stats.entity');
const UserPokemon = require('../../repository/user_pokemon.entity');
const HealingService = require('../healing.service');
const ExperienceService = require('../experience.service');
const experienceConfig = require('../../config/experience.config');

class CombatService {
    static async executeCombat(guildId, challengerId, challengedId) {
        const challengerInventory = await UserInventory.getByMember(guildId, challengerId);
        const challengedInventory = await UserInventory.getByMember(guildId, challengedId);

        const combatLog = [];
        let challengerActiveIndex = 0;
        let challengedActiveIndex = 0;
        
        const challengerTeam = await Promise.all(challengerInventory.map(async (pokemon) => {
            const stats = await UserPokemonStats.get(guildId, challengerId, pokemon.user_pokemon_id);
            const hpData = await HealingService.getCurrentHp(guildId, challengerId, pokemon.user_pokemon_id);
            return {
                ...pokemon,
                stats,
                currentHp: hpData.currentHp,
                maxHp: hpData.maxHp
            };
        }));

        const challengedTeam = await Promise.all(challengedInventory.map(async (pokemon) => {
            const stats = await UserPokemonStats.get(guildId, challengedId, pokemon.user_pokemon_id);
            const hpData = await HealingService.getCurrentHp(guildId, challengedId, pokemon.user_pokemon_id);
            return {
                ...pokemon,
                stats,
                currentHp: hpData.currentHp,
                maxHp: hpData.maxHp
            };
        }));

        while (challengerActiveIndex < challengerTeam.length && challengedActiveIndex < challengedTeam.length) {
            const challengerPokemon = challengerTeam[challengerActiveIndex];
            const challengedPokemon = challengedTeam[challengedActiveIndex];

            const challengerSpeed = challengerPokemon.stats.speed;
            const challengedSpeed = challengedPokemon.stats.speed;

            let firstAttacker, secondAttacker, firstDefender, secondDefender;
            let firstIsChallenger;

            if (challengerSpeed > challengedSpeed) {
                firstAttacker = challengerPokemon;
                firstDefender = challengedPokemon;
                secondAttacker = challengedPokemon;
                secondDefender = challengerPokemon;
                firstIsChallenger = true;
            } else if (challengedSpeed > challengerSpeed) {
                firstAttacker = challengedPokemon;
                firstDefender = challengerPokemon;
                secondAttacker = challengerPokemon;
                secondDefender = challengedPokemon;
                firstIsChallenger = false;
            } else {
                firstIsChallenger = Math.random() < 0.5;
                if (firstIsChallenger) {
                    firstAttacker = challengerPokemon;
                    firstDefender = challengedPokemon;
                    secondAttacker = challengedPokemon;
                    secondDefender = challengerPokemon;
                } else {
                    firstAttacker = challengedPokemon;
                    firstDefender = challengerPokemon;
                    secondAttacker = challengerPokemon;
                    secondDefender = challengedPokemon;
                }
            }

            const firstAttackResult = await this.performAttack(firstAttacker, firstDefender, guildId);
            combatLog.push({
                type: 'attack',
                attacker: firstAttacker.pokemon_data.pokemon_name,
                attackerOwner: firstIsChallenger ? 'challenger' : 'challenged',
                defender: firstDefender.pokemon_data.pokemon_name,
                defenderOwner: firstIsChallenger ? 'challenged' : 'challenger',
                damage: firstAttackResult.damage,
                attackType: firstAttackResult.attackType,
                remainingHp: firstAttackResult.remainingHp,
                maxHp: firstAttackResult.maxHp,
                isDead: firstAttackResult.isDead,
                isCriticalFailure: firstAttackResult.isCriticalFailure,
                timestamp: Date.now()
            });

            if (firstAttackResult.isDead) {
                if (firstIsChallenger) {
                    challengedActiveIndex++;
                    if (challengedActiveIndex < challengedTeam.length) {
                        combatLog.push({
                            type: 'pokemon_change',
                            newPokemon: challengedTeam[challengedActiveIndex].pokemon_data.pokemon_name,
                            owner: 'challenged',
                            timestamp: Date.now()
                        });
                    }
                } else {
                    challengerActiveIndex++;
                    if (challengerActiveIndex < challengerTeam.length) {
                        combatLog.push({
                            type: 'pokemon_change',
                            newPokemon: challengerTeam[challengerActiveIndex].pokemon_data.pokemon_name,
                            owner: 'challenger',
                            timestamp: Date.now()
                        });
                    }
                }
                continue;
            }

            const secondAttackResult = await this.performAttack(secondAttacker, secondDefender, guildId);
            combatLog.push({
                type: 'attack',
                attacker: secondAttacker.pokemon_data.pokemon_name,
                attackerOwner: firstIsChallenger ? 'challenged' : 'challenger',
                defender: secondDefender.pokemon_data.pokemon_name,
                defenderOwner: firstIsChallenger ? 'challenger' : 'challenged',
                damage: secondAttackResult.damage,
                attackType: secondAttackResult.attackType,
                remainingHp: secondAttackResult.remainingHp,
                maxHp: secondAttackResult.maxHp,
                isDead: secondAttackResult.isDead,
                isCriticalFailure: secondAttackResult.isCriticalFailure,
                timestamp: Date.now()
            });

            if (secondAttackResult.isDead) {
                if (firstIsChallenger) {
                    challengerActiveIndex++;
                    if (challengerActiveIndex < challengerTeam.length) {
                        combatLog.push({
                            type: 'pokemon_change',
                            newPokemon: challengerTeam[challengerActiveIndex].pokemon_data.pokemon_name,
                            owner: 'challenger',
                            timestamp: Date.now()
                        });
                    }
                } else {
                    challengedActiveIndex++;
                    if (challengedActiveIndex < challengedTeam.length) {
                        combatLog.push({
                            type: 'pokemon_change',
                            newPokemon: challengedTeam[challengedActiveIndex].pokemon_data.pokemon_name,
                            owner: 'challenged',
                            timestamp: Date.now()
                        });
                    }
                }
            }
        }

        const winnerId = challengerActiveIndex < challengerTeam.length ? challengerId : challengedId;
        const loserId = winnerId === challengerId ? challengedId : challengerId;
        const winnerTeam = winnerId === challengerId ? challengerTeam : challengedTeam;
        const loserTeam = winnerId === challengerId ? challengedTeam : challengerTeam;

        await this.processPostCombatExperience(guildId, winnerId, loserId, winnerTeam, loserTeam);

        await this.cleanupCombatData(guildId, challengerId, challengedId, challengerTeam, challengedTeam);

        return {
            winnerId,
            loserId,
            combatLog,
            challengerTeam: challengerTeam.map(p => ({
                name: p.pokemon_data.pokemon_name,
                finalHp: p.currentHp,
                maxHp: p.maxHp
            })),
            challengedTeam: challengedTeam.map(p => ({
                name: p.pokemon_data.pokemon_name,
                finalHp: p.currentHp,
                maxHp: p.maxHp
            })),
            challengerTeamData: challengerTeam,
            challengedTeamData: challengedTeam
        };
    }

    static async performAttack(attacker, defender, guildId) {
        const combatConfig = experienceConfig.duel.combat;
        
        const isCriticalFailure = Math.random() < combatConfig.criticalFailureProbability;
        if (isCriticalFailure) {
            return {
                damage: 0,
                attackType: 'failure',
                remainingHp: defender.currentHp,
                maxHp: defender.maxHp,
                isDead: false,
                isCriticalFailure: true
            };
        }
        
        const isSpecialAttack = Math.random() < combatConfig.specialAttackProbability;
        
        let baseDamage, defense;
        let attackType;
        
        if (isSpecialAttack) {
            baseDamage = attacker.stats.special_attack;
            defense = defender.stats.special_defense;
            attackType = 'special';
        } else {
            baseDamage = attacker.stats.attack;
            defense = defender.stats.defense;
            attackType = 'physical';
        }
        
        const damageMultiplierRange = combatConfig.damageMultiplier.max - combatConfig.damageMultiplier.min;
        const damageMultiplier = Math.random() * damageMultiplierRange + combatConfig.damageMultiplier.min;
        const damage = Math.max(1, Math.floor((baseDamage - defense * 0.5) * damageMultiplier));
        
        const newHp = Math.max(0, defender.currentHp - damage);
        defender.currentHp = newHp;
        
        const defenderUserId = defender.user_id;
        
        await HealingService.damagePokemon(guildId, defenderUserId, defender.user_pokemon_id, damage);

        return {
            damage,
            attackType,
            remainingHp: newHp,
            maxHp: defender.maxHp,
            isDead: newHp === 0,
            isCriticalFailure: false
        };
    }

    static async processPostCombatExperience(guildId, winnerId, loserId, winnerTeam, loserTeam) {
        for (const pokemon of winnerTeam) {
            const winXp = experienceConfig.duel.experience.winXpGain;
            const newExperience = pokemon.pokemon_data.experience + winXp;
            const newLevel = experienceConfig.calculateLevel(newExperience);
            
            await UserPokemon.update(
                guildId,
                winnerId,
                pokemon.user_pokemon_id,
                newLevel,
                newExperience
            );

            if (newLevel > pokemon.pokemon_data.level) {
                const levelUpsCount = newLevel - pokemon.pokemon_data.level;
                await ExperienceService.processLevelUp(
                    guildId,
                    winnerId,
                    pokemon.user_pokemon_id,
                    levelUpsCount
                );
            }
        }

        for (const pokemon of loserTeam) {
            const loseXp = experienceConfig.duel.experience.loseXpLoss;
            const newExperience = Math.max(0, pokemon.pokemon_data.experience - loseXp);
            const newLevel = experienceConfig.calculateLevel(newExperience);
            
            await UserPokemon.update(
                guildId,
                loserId,
                pokemon.user_pokemon_id,
                newLevel,
                newExperience
            );
        }

        await ExperienceService.invalidateUserCaches(guildId, winnerId);
        await ExperienceService.invalidateUserCaches(guildId, loserId);
    }

    static async cleanupCombatData(guildId, challengerId, challengedId, challengerTeam, challengedTeam) {
        const cacheService = require('../cache.service');
        
        const allPokemon = [...challengerTeam, ...challengedTeam];
        
        for (const pokemon of allPokemon) {
            const currentHpKey = cacheService.generateKey(
                HealingService.CURRENT_HP_CACHE_PREFIX, 
                `${guildId}_${pokemon.user_id}_${pokemon.user_pokemon_id}`
            );
            await cacheService.delete(currentHpKey);
            
            await HealingService.resetPokemonHp(guildId, pokemon.user_id, pokemon.user_pokemon_id);
        }
    }
}

module.exports = CombatService; 