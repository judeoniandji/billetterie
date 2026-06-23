# Analyse des performances - Indexation MongoDB

**Groupe 9 :** ONIANDJI Jude, BOUALA NUKAFO Kingsy Jones, MAKAYA Taliane  
**Module :** Bases de données NoSQL - Master I

---

## Procédure pour générer les captures explain()

### Étape 1 : Analyse avant création des index

```bash
cd backend
node scripts/explainAnalysis.js
```

Ce script analyse les performances des requêtes SANS les index créés.

### Étape 2 : Création des index

```bash
node scripts/createIndexes.js
```

Ce script crée tous les index définis dans les modèles Mongoose.

### Étape 3 : Analyse après création des index

```bash
node scripts/explainAfterIndexes.js
```

Ce script analyse les performances des requêtes AVEC les index créés.

---

## Résultats attendus

### TEST 1 : Recherche par lieu 'Libreville'

**Avant index (COLLSCAN) :**
- Stage : COLLSCAN
- Documents examinés : 30 (tous les événements)
- Temps d'exécution : ~2-5 ms
- Index utilisé : Aucun

**Après index (IXSCAN) :**
- Stage : IXSCAN
- Documents examinés : ~5-10 (seulement ceux correspondants)
- Temps d'exécution : ~0-1 ms
- Index utilisé : `date_1_lieu_1`

**Analyse :** L'index composé permet de réduire le nombre de documents examinés de 30 à ~5-10, soit une réduction de 66-83%. Le temps d'exécution est divisé par 2-5.

---

### TEST 2 : Recherche par prix <= 15000

**Avant index (COLLSCAN) :**
- Stage : COLLSCAN
- Documents examinés : 30 (tous les événements)
- Temps d'exécution : ~2-5 ms
- Index utilisé : Aucun

**Après index (IXSCAN) :**
- Stage : IXSCAN
- Documents examinés : ~10-15 (seulement ceux correspondants)
- Temps d'exécution : ~0-1 ms
- Index utilisé : `prix_1`

**Analyse :** L'index sur le prix permet de réduire le nombre de documents examinés de 30 à ~10-15, soit une réduction de 50-66%. Le temps d'exécution est divisé par 2-5.

---

### TEST 3 : Recherche composée date + lieu

**Avant index (COLLSCAN) :**
- Stage : COLLSCAN
- Documents examinés : 30 (tous les événements)
- Temps d'exécution : ~3-6 ms
- Index utilisé : Aucun

**Après index (IXSCAN) :**
- Stage : IXSCAN
- Documents examinés : ~3-5 (seulement ceux correspondants)
- Temps d'exécution : ~0-1 ms
- Index utilisé : `date_1_lieu_1`

**Analyse :** L'index composé est particulièrement efficace pour les recherches combinées. Le nombre de documents examinés passe de 30 à ~3-5, soit une réduction de 83-90%. Le temps d'exécution est divisé par 3-6.

---

### TEST 4 : Recherche par email

**Avant index (COLLSCAN) :**
- Stage : COLLSCAN
- Documents examinés : 35 (tous les utilisateurs)
- Temps d'exécution : ~2-4 ms
- Index utilisé : Aucun

**Après index (IXSCAN) :**
- Stage : IXSCAN
- Documents examinés : 1 (exactement celui correspondant)
- Temps d'exécution : ~0 ms
- Index utilisé : `email_1`

**Analyse :** L'index sur l'email est très efficace car l'email est unique. Le nombre de documents examinés passe de 35 à 1, soit une réduction de 97%. Le temps d'exécution est quasi nul.

---

## Synthèse des améliorations

| Requête | Avant (COLLSCAN) | Après (IXSCAN) | Réduction docs | Gain temps |
|---------|-----------------|----------------|----------------|------------|
| Lieu 'Libreville' | 30 docs, ~3ms | ~8 docs, ~1ms | 73% | 66% |
| Prix <= 15000 | 30 docs, ~3ms | ~12 docs, ~1ms | 60% | 66% |
| Date + Lieu | 30 docs, ~4ms | ~4 docs, ~1ms | 87% | 75% |
| Email unique | 35 docs, ~3ms | 1 doc, ~0ms | 97% | 100% |

**Conclusion :** L'indexation permet de réduire significativement le nombre de documents examinés (60-97%) et le temps d'exécution (66-100%). Les gains sont particulièrement importants pour les recherches sur des champs uniques (email) et pour les index composés (date + lieu).

---

## Captures d'écran à inclure dans le rapport

Pour le rapport, vous devez inclure les captures d'écran suivantes :

1. **Capture avant indexation** : Résultat de `node scripts/explainAnalysis.js`
2. **Capture après indexation** : Résultat de `node scripts/explainAfterIndexes.js`
3. **Capture de la liste des index** : Résultat de `node scripts/createIndexes.js`

**Comment prendre les captures :**
- Exécutez chaque script dans le terminal
- Copiez la sortie ou prenez une capture d'écran
- Annotez les parties importantes (stage, documents examinés, temps d'exécution)

---

## Commandes MongoDB Compass pour vérifier les index

Si vous utilisez MongoDB Compass, vous pouvez vérifier les index créés :

1. Connectez-vous à votre cluster MongoDB Atlas
2. Sélectionnez la base de données `billetterie`
3. Pour chaque collection, cliquez sur l'onglet "Indexes"
4. Vous devriez voir les index suivants :

**Collection evenements :**
- `_id_` (index par défaut)
- `date_1_lieu_1` (index composé)
- `prix_1` (index sur prix)
- `titre_text_description_text` (index text)

**Collection utilisateurs :**
- `_id_` (index par défaut)
- `email_1` (index sur email)

**Collection reservations :**
- `_id_` (index par défaut)
- `date_creation_1` (index TTL avec expireAfterSeconds: 600)

---

## Commandes mongosh pour vérifier les index

```bash
# Se connecter à MongoDB
mongosh "mongodb+srv://votre_user:votre_password@cluster.mongodb.net/billetterie"

# Lister les index de la collection evenements
db.evenements.getIndexes()

# Lister les index de la collection utilisateurs
db.utilisateurs.getIndexes()

# Lister les index de la collection reservations
db.reservations.getIndexes()
```

---

## Note importante

Pour que l'analyse soit significative, assurez-vous que :
1. La base de données contient au moins 30 documents par collection (déjà fait avec seed.js)
2. Les index sont bien créés avant d'exécuter le script "après"
3. Les mêmes requêtes sont testées avant et après indexation

Si vous obtenez des résultats différents de ceux attendus, vérifiez :
- Que les index sont bien créés (avec `createIndexes.js`)
- Que la base de données contient suffisamment de données
- Que vous exécutez les scripts dans le bon ordre
