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
   TOKEN=votre_token_bot_discord
   CLIENT_ID=votre_id_bot_discord
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
Affiche les informations détaillées d'un Pokémon.

**Usage :**
```
/pokedex pokemon nom:mewtwo
```

**Paramètres :**
- `nom` (requis) : Le nom du Pokémon à rechercher

**Fonctionnalités :**
- Affichage des statistiques du Pokémon
- Informations sur le type
- Image du Pokémon
- Données provenant de PokéAPI

## 📋 Technologies utilisées

- **Node.js 22** - Runtime JavaScript
- **Discord.js v14** - Bibliothèque Discord
- **Axios** - Client HTTP pour les API
- **Docker** - Conteneurisation
- **PokéAPI** - Source des données Pokémon