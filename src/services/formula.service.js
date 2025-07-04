class FormulaService {
    static evaluateFormula(formula, variables = {}) {
        if (typeof formula === 'function') {
            return formula;
        }
        
        if (typeof formula !== 'string') {
            return () => 0;
        }
        
        const sanitizedFormula = this.sanitizeFormula(formula);
        
        return (values = {}) => {
            const context = { ...variables, ...values };
            return this.safeEval(sanitizedFormula, context);
        };
    }
    
    static sanitizeFormula(formula) {
        const allowedChars = /^[0-9a-zA-Z+\-*/.() \[\]<>=?:&|!_]+$/;
        
        if (!allowedChars.test(formula)) {
            throw new Error(`Formule non sécurisée: ${formula}`);
        }
        
        return formula.replace(/\s+/g, '');
    }
    
    static safeEval(expression, context) {
        try {
            let result = expression;
            
            Object.keys(context).forEach(key => {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                result = result.replace(regex, context[key]);
            });
            
            const evalFunction = new Function(
                'Math', 
                `"use strict"; return (${result});`
            );
            
            return evalFunction({
                min: Math.min,
                max: Math.max,
                floor: Math.floor,
                ceil: Math.ceil,
                round: Math.round,
                abs: Math.abs,
                pow: Math.pow,
                sqrt: Math.sqrt
            });
        } catch (error) {
            console.error('Erreur lors de l\'évaluation de la formule:', error);
            return 0;
        }
    }
}

module.exports = FormulaService;