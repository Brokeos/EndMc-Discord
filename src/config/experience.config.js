const config = require('./experience.config.json');
const FormulaService = require('../services/formula.service');

module.exports = {
    ...config,
    
    xpFormula: FormulaService.evaluateFormula(config.pokemon.xpFormula),
    voiceXpFormula: FormulaService.evaluateFormula(config.voice.xpFormula),
    
    getRequiredXpForLevel(level) {
        if (level <= 1) return 0;
        if (level > 100) return config.levelThresholds[config.levelThresholds.length - 1];
        return config.levelThresholds[level - 1];
    },
    
    calculateLevel(experience) {
        for (let level = 1; level <= 100; level++) {
            if (experience < this.getRequiredXpForLevel(level + 1)) {
                return level;
            }
        }
        return 100;
    },
    
    getXpForCurrentLevel(experience) {
        const currentLevel = this.calculateLevel(experience);
        const currentLevelXp = this.getRequiredXpForLevel(currentLevel);
        return experience - currentLevelXp;
    },
    
    getXpNeededForNextLevel(experience) {
        const currentLevel = this.calculateLevel(experience);
        if (currentLevel >= 100) return 0;
        const nextLevelXp = this.getRequiredXpForLevel(currentLevel + 1);
        return nextLevelXp - experience;
    }
}; 