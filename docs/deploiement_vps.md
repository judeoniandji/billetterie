# Guide de Déploiement VPS - Bonus (+2 points)

**Groupe 9 :** ONIANDJI Jude, BOUALA NUKAFO Kingsy Jones, MAKAYA Taliane  
**Module :** Bases de données NoSQL - Master I

---

## Prérequis

- Un accès SSH au serveur VPS (fourni par l'enseignant)
- Le code de l'API poussé sur un dépôt GitHub
- Un fichier `.env` prêt (MONGO_URI, PORT), jamais commité sur Git
- Une base MongoDB accessible (Atlas recommandé)

---

## Étape 1 - Connexion et mise à jour du serveur

```bash
ssh utilisateur@IP_DU_SERVEUR
sudo apt update && sudo apt upgrade -y
```

---

## Étape 2 - Installation de Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v && npm -v
```

---

## Étape 3 - Installation de Git

```bash
sudo apt install -y git
git --version
```

---

## Étape 4 - Récupération du projet

```bash
cd /var/www
sudo git clone https://github.com/votre-groupe/billetterie-nosql.git
cd billetterie-nosql/backend
```

---

## Étape 5 - Installation des dépendances

```bash
npm install --production
```

---

## Étape 6 - Configuration des variables d'environnement

```bash
sudo nano .env
```

Ajoutez le contenu suivant :

```env
PORT=5001
MONGO_URI=mongodb+srv://votre_user:votre_password@cluster.mongodb.net/billetterie?retryWrites=true&w=majority
NODE_ENV=production
```

Sauvegardez avec `Ctrl+O`, `Enter`, puis `Ctrl+X`.

---

## Étape 7 - Installation de PM2

PM2 maintient l'application en vie et la redémarre automatiquement après une panne ou un redémarrage du serveur.

```bash
sudo npm install -g pm2
```

---

## Étape 8 - Lancement de l'application avec PM2

```bash
pm2 start server.js --name billetterie-api
pm2 startup
pm2 save
pm2 logs billetterie-api
```

Vérifiez que l'application fonctionne :

```bash
pm2 status
pm2 info billetterie-api
```

---

## Étape 9 - Installation de Nginx

Nginx servira de reverse proxy pour recevoir le trafic public (ports 80 et 443) et le rediriger vers le port interne de l'API.

```bash
sudo apt install -y nginx
sudo nginx -v
```

---

## Étape 10 - Configuration du reverse proxy Nginx

```bash
sudo nano /etc/nginx/sites-available/billetterie
```

Ajoutez la configuration suivante (remplacez `votre-domaine.ga` par votre domaine ou IP) :

```nginx
server {
    listen 80;
    server_name votre-domaine.ga;  # Remplacez par votre domaine ou IP

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Servir les fichiers statiques du frontend
    location /static/ {
        alias /var/www/billetterie-nosql/frontend/;
        try_files $uri $uri/ =404;
    }
}
```

Sauvegardez avec `Ctrl+O`, `Enter`, puis `Ctrl+X`.

---

## Étape 11 - Activation du site Nginx

```bash
sudo ln -s /etc/nginx/sites-available/billetterie /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Étape 12 - Configuration du pare-feu (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Étape 13 - Sécurisation HTTPS avec Let's Encrypt (Optionnel mais recommandé)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.ga
```

Suivez les instructions pour configurer HTTPS. Certbot configurera automatiquement Nginx pour rediriger le trafic HTTP vers HTTPS.

---

## Étape 14 - Vérification du déploiement

Testez que l'API est accessible :

```bash
curl http://votre-domaine.ga/api/evenements
# ou
curl https://votre-domaine.ga/api/evenements
```

Vous devriez recevoir une réponse JSON avec la liste des événements.

---

## Étape 15 - Gestion avec PM2

Commandes utiles PM2 :

```bash
# Voir le statut des applications
pm2 status

# Voir les logs
pm2 logs billetterie-api

# Redémarrer l'application
pm2 restart billetterie-api

# Arrêter l'application
pm2 stop billetterie-api

# Supprimer l'application
pm2 delete billetterie-api

# Voir les informations détaillées
pm2 info billetterie-api

# Surveiller en temps réel
pm2 monit
```

---

## Étape 16 - Mises à jour du déploiement

Pour mettre à jour l'application après des modifications :

```bash
cd /var/www/billetterie-nosql
sudo git pull
cd backend
npm install --production
pm2 restart billetterie-api
```

---

## Structure finale du serveur

```
/var/www/billetterie-nosql/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── workers/
│   ├── .env
│   ├── package.json
│   ├── seed.js
│   └── server.js
├── frontend/
│   ├── admin.html
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── docs/
│   ├── conception.md
│   ├── explain_analysis.md
│   ├── rapport.md
│   └── presentation.md
├── postman_collection.json
└── README.md
```

---

## Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs PM2
pm2 logs billetterie-api

# Vérifier que Node.js est installé
node -v

# Vérifier que les dépendances sont installées
npm list

# Vérifier le fichier .env
cat .env
```

### Erreur de connexion MongoDB

- Vérifiez que MONGO_URI dans `.env` est correct
- Vérifiez que l'IP du serveur est whitelistée dans MongoDB Atlas
- Testez la connexion depuis le serveur :
```bash
mongosh "mongodb+srv://votre_user:votre_password@cluster.mongodb.net/billetterie"
```

### Erreur Nginx 502 Bad Gateway

- Vérifiez que PM2 fonctionne : `pm2 status`
- Vérifiez que le port dans `.env` correspond à celui dans la config Nginx
- Vérifiez les logs Nginx : `sudo tail -f /var/log/nginx/error.log`

### Permission denied

```bash
# Changer le propriétaire du dossier
sudo chown -R $USER:$USER /var/www/billetterie-nosql

# Ou utiliser sudo pour les commandes
sudo pm2 restart billetterie-api
```

---

## Sécurité supplémentaire (Recommandé)

### 1. Désactiver l'accès root SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Changez `PermitRootLogin yes` en `PermitRootLogin no`

```bash
sudo systemctl restart sshd
```

### 2. Changer le port SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Changez `Port 22` en un autre port (ex: `Port 2222`)

```bash
sudo systemctl restart sshd
sudo ufw allow 2222/tcp
```

### 3. Configurer fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Monitoring

### Surveillance avec PM2 Plus

```bash
pm2 plus
```

### Surveillance des ressources

```bash
# Utilisation CPU/RAM
htop

# Utilisation disque
df -h

# Utilisation réseau
iftop
```

---

## Backup

### Backup de la base de données MongoDB Atlas

MongoDB Atlas propose des backups automatiques. Activez-les dans le tableau de bord Atlas.

### Backup du code

```bash
# Créer un archive du projet
cd /var/www
sudo tar -czf billetterie-backup-$(date +%Y%m%d).tar.gz billetterie-nosql

# Télécharger localement
scp utilisateur@IP_DU_SERVEUR:/var/www/billetterie-backup-*.tar.gz ./
```

---

## Livrable du bonus

Pour obtenir les +2 points bonus, vous devez fournir :

1. **Une URL publique fonctionnelle** permettant de tester l'API en ligne
2. **Une courte section dans le rapport** décrivant les étapes réalisées et les difficultés rencontrées

Ajoutez cette section à votre rapport :

---

## Section Bonus - Déploiement VPS

### Étapes réalisées

1. Connexion au serveur VPS via SSH
2. Installation de Node.js v20, Git, et PM2
3. Clonage du dépôt GitHub
4. Installation des dépendances npm
5. Configuration des variables d'environnement (.env)
6. Lancement de l'application avec PM2
7. Installation et configuration de Nginx comme reverse proxy
8. Configuration du pare-feu UFW
9. Sécurisation HTTPS avec Let's Encrypt

### URL de déploiement

L'API est accessible à l'adresse : `http://votre-domaine.ga` ou `https://votre-domaine.ga`

### Difficultés rencontrées

- [Décrivez ici les difficultés rencontrées lors du déploiement et comment vous les avez résolues]

### Conclusion

Le déploiement sur VPS a permis de rendre l'application accessible publiquement. L'utilisation de PM2 garantit la disponibilité de l'application, tandis que Nginx assure le reverse proxy et la sécurisation HTTPS.

---

**Fin du guide de déploiement**
