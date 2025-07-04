# EndMc Bot Discord

Bot Discord d'exercice pour la validation du Discord EndMc

## 🐳 Mise en place (via Docker)

### Configuration

1. **Clonez le projet :**
   ```bash
   git clone https://github.com/Brokeos/EndMc-Discord
   cd EndMc-Discord
   ```

2. **Créez un fichier `.env` :**
   ```env
   # Discord
   CLIENT_ID=votre_id_bot_discord
   TOKEN=votre_token_bot_discord

   # Database
   PG_HOSTNAME=postgres
   PG_PORT=5432
   PG_PASSWORD=postgres
   PG_USERNAME=postgres
   PG_DATABASE=endmc_pokedex

   # Redis
   REDIS_HOSTNAME=redis
   REDIS_PORT=6379
   ```

3. **Lancez avec Docker Compose :**
   ```bash
   docker-compose up -d
   ```

4. **Vérifiez que le bot fonctionne :**
   ```bash
   docker-compose logs -f app
   ```

## 🎮 Commandes disponibles

### `/pokedex pokemon <nom>`
Le Pokédex vous permet de consulter les informations détaillées d'un Pokémon grâce à la PokéAPI.

| Commande | Description | Paramètres |
|----------|-------------|------------|
| `/pokedex pokemon <nom>` | Affiche les informations détaillées d'un Pokémon (embed interactif) | `nom` (requis) : Nom ou ID Pokédex du Pokémon |

**Fonctionnalités :**
- Affichage des statistiques (bouton « 📊 Voir les stats »)
- Types, capacités, couleur, habitat
- Image et numéro Pokédex
- Navigation retour infos/statistiques via boutons

### `/pc`
Le PC (Personal Computer) de Pokémon permet de gérer votre collection : inventaire actif (3 Pokémon maximum) et stockage illimité.

#### Sous-commandes `pokemon`

| Commande | Description | Paramètres |
|----------|-------------|------------|
| `/pc pokemon view <id>` | Affiche les détails et statistiques d'un de vos Pokémon | `id` (requis) : ID interne du Pokémon dans votre collection |

#### Sous-commandes `inventory` (inventaire actif, max 3)

| Commande | Description | Paramètres |
|----------|-------------|------------|
| `/pc inventory add <membre> <id>` | Ajoute un Pokémon depuis le stockage au slot libre de l'inventaire d'un membre | `membre` (requis) : membre Discord concerné<br>`id` (requis) : ID du Pokémon dans son stockage |
| `/pc inventory view <membre>` | Affiche l'inventaire actuel d'un membre | `membre` (requis) |
| `/pc inventory remove <pokemon_id>` | Retire un Pokémon de votre inventaire (retourne dans le stockage) | `pokemon_id` (requis) : ID interne du Pokémon dans votre inventaire |

#### Sous-commandes `storage` (stockage illimité)

| Commande | Description | Paramètres |
|----------|-------------|------------|
| `/pc storage add <membre> <nom>` | Ajoute un Pokémon (par nom ou ID Pokédex) au stockage d'un membre | `membre` (requis)<br>`nom` (requis) : nom ou ID Pokédex du Pokémon |
| `/pc storage view <membre>` | Affiche tous les Pokémon présents dans le stockage d'un membre | `membre` (requis) |
| `/pc storage remove <membre> <id>` | Supprime définitivement un Pokémon du stockage d'un membre | `membre` (requis)<br>`id` (requis) : ID du Pokémon dans son stockage |

**Fonctionnalités supplémentaires :**
- Pagination dans les listes (storage) avec boutons « ◀ / ▶ »
- Embeds interactifs et boutons pour naviguer entre les vues
- Validation d'erreurs et messages explicites (inventaire plein, Pokémon introuvable, etc.)

## 📋 Technologies utilisées

- **Node.js 22** - Runtime JavaScript
- **Discord.js v14** - Bibliothèque Discord
- **Axios** - Client HTTP pour les API
- **Docker** - Conteneurisation
- **PostgreSQL** - Base de données relationnelle
- **Redis** - Cache en mémoire key-value
- **PokéAPI** - Source des données Pokémon

## ⚙️ Système d'expérience

Le fichier `src/config/experience.config.json` centralise tous les réglages liés au gain d'expérience et à la progression des Pokémon.

```json
{
  "pokemon": {
    "minXpGain": 15,
    "maxXpGain": 25,
    "cooldownMs": 2000,
    "xpFormula": "Math.floor(x*0.8) + Math.floor(x/2) + 10"
  },
  "levelUp": {
    "statsGain": { "min": 1, "max": 10 },
    "maxStatValue": 255
  },
  "levelThresholds": [ /* ... tableau cumulatif d'XP ... */ ]
}
```

### Paramètres clés
- **pokemon.minXpGain / maxXpGain** : plage d'XP brute attribuée à chaque gain.
- **pokemon.cooldownMs** : délai minimum (ms) entre deux gains pour éviter les abus.
- **pokemon.xpFormula** : _expression JavaScript_ appliquée sur `x` (XP brute) pour obtenir l'XP finale.
- **levelUp.statsGain** : plage aléatoire d'augmentation des stats à chaque niveau.
- **levelUp.maxStatValue** : valeur maximale qu'une stat peut atteindre.
- **levelThresholds** : seuils d'XP cumulés pour chaque niveau (index = niveau).

### Personnaliser la formule d'XP
La propriété `xpFormula` accepte n'importe quelle expression JavaScript valide utilisant la variable `x` et les fonctions de `Math`.

| Exemple de formule | Effet attendu |
|--------------------|--------------|
| `x + 5` | Ajoute un bonus fixe de 5 XP. |
| `Math.pow(x, 1.2)` | Courbe de progression exponentielle douce. |
| `Math.min(x * 2, 100)` | Double l'XP mais limite le résultat à 100. |

### Évaluation sécurisée des formules (`FormulaService`)
Le service `src/services/formula.service.js` gère l'évaluation **sécurisée** des formules :

- **Sanitisation** : seuls les caractères alphanumériques, opérateurs arithmétiques et parenthèses sont autorisés ; toute formule contenant des caractères interdits déclenche une erreur.
- **Contexte dynamique** : la fonction générée accepte un objet `values` (ex. `{ level: 5, bonus: 10 }`) fusionné avec la variable implicite `x`.
- **Fonctions mathématiques disponibles** : `min`, `max`, `floor`, `ceil`, `round`, `abs`, `pow`, `sqrt`.
- **Fallback** : en cas d'erreur d'évaluation, la formule retourne `0` et l'erreur est loggée.

```js
// Exemple : bonus d'XP selon le niveau
const FormulaService = require('src/services/formula.service');
const formulaFn = FormulaService.evaluateFormula('x + level * 2');
const xpFinal = formulaFn({ x: 20, level: 3 }); // 26
```

Ainsi, vous pouvez créer des formules avancées tout en garantissant la sécurité de l'exécution.

> ⚠️ Après modification de ce fichier, **redémarrez le bot** pour appliquer les nouveaux réglages.