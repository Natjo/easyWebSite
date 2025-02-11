# Installation  

****

## Docker Wordpress@5.5-php7.4-fpm / node@12.18 / mysql@5.7 / composer / nginx

Solution dockerisée avec 5 containers. Tourne avec le https.

Si vous souhaitez utiliser la base partagée, vous pouvez commenter les lignes du container **db** et la dépendance **db** du service **nginx** ligne 76 du **fichier .docker/docker-compose.yml.**

Dans le répertoire .docker se situent tous les fichiers nécessaires à la config et au build des différents containers ainsi que différents scripts pour lancer et arrêter les services.

### Configuration

#### 1 - Editer le fichier .env

Dupliquer et renommer .docker/.env-sample => **.docker/.env** **/!\ ne pas renommer autrement**

Renseigner les différentes variables.

```
COMPOSE_PROJECT_NAME # le nom de 'la stack docker-compose'
APP_NAME # le nom du projet sans caractères accentués ni espaces
DOMAIN # le domaine
WP_THEME_NAME # le nom du theme
```

Attention les variables commencant par WP_ sont utilisées en tant que variables d'environnement par le container worpress : ne pas supprimer ni renommer.

Si la base de données tourne sous docker, utiliser ce jeu de variables : 

```
DB_HOST=db:3306
DB_NAME=wordpress
DB_USER=wordpress
DB_TABLE_PREFIX=wp_
DB_ROOT_PASSWORD=wordpress
DB_PASSWORD=wordpress
```

#### 2 - Editer le fichier .docker-compose

Dupliquer et renommer .docker/.docker-compose-sample.yml => **.docker/.docker-compose.yml** **/!\ ne pas renommer autrement**

Affiner la stack docker : bdd / composer / platform amd 64 ....

#### 3 - Ajouter le ServerName dans son propre hosts

```
127.0.0.1   ServerName.code
```

ou utiliser le script :
```
.docker/scripts/hosts-file-setup.sh
```

#### 4 - Générer les certificats

utiliser le script :
```
.docker/scripts/cert-create.sh
```.do  

et truster les certificats pour Chrome et Safari
```
.docker/scripts/cert-trust.sh
```

### Lancement

```
.docker/run.sh
```

le script coupe et supprime les containers actifs et lance docker-compose up -d

5 containers vont être créés et vont communiquer entre eux :

wordpress@5.5-php7.4-fpm / node@12.18 / mysql@5.7 / composer / nginx

**sur wordpress@5.5-php7.4-fpm :** wp-cli est installé, entrer dans le container : (${APP_NAME} est renseigné dans .docker/.env)
```
docker exec -it ${APP_NAME}-wp bash
```
puis se référer aux commands https://developer.wordpress.org/cli/commands/
```
wp-cli --info
```

Le dossier du theme sera renommé conformément à la config dans .docker/.env
**Attention à modifier le .gitignore en conséquence pour versionner le dossier du theme**

**sur node@12.18 :** yarn est installé, le container lance l'install et le run dev au lancement

**sur composer :** ce container permettra l'utilisation de bedrock par la suite https://roots.io/bedrock/

**sur nginx :** gestion du https : ports 80 et 443

Pour les services wordpress et nginx, les config se trouvent respectivement dans les rep .docker/nginx et .docker/wordpress

Editer la feuille CSS **web/wp-content/themes/[default ou ${WP_THEME_NAME}]/style.css** : changer l'entête

```
/*
Theme Name: Mon Theme
Author: Lonsdale Dev Team
Author URI: https://www.lonsdale.fr/
Version: 1.0
Text Domain: default
*/
```

pour couper les containers
```
.docker/stop.sh
```

### Autres scripts utiles

**.docker/scripts/bdd-import.sh**
le script invite à saisir le path vers le fichier.sql (drag'n'dropper le fichier dans le terminal)

**.docker/scripts/bdd-export.sh**
le script invite à saisir le path vers le dossier où télécharger le dump (drag'n'dropper le dossier dans le terminal)

**.docker/scripts/node-assets-prod.sh**
génération des assets en mode prod : optimisation images et concaténation des scripts
le container node doit tourner pour cela.

**.docker/scripts/node-docker-enter.sh**
permet d'entrer dans le container node de docker pour y installer de nouveaux node_modules par exemple
utiliser les commandes :
```
yarn add [package@version]
```
ou
```
yarn remove [package@version]
```
le container node doit tourner pour cela.

vous pouvez aussi utiliser directement en ligne de commande :
```
docker exec -it [APP_NAME présent dans le fichier .docker/.env]-node bash
```

### Commandes docker
#### Voir tous les conteneurs
```
docker ps -a
```

#### Arrêter tous les docker conteneurs
```
docker container stop $(docker container ls -aq)
```

#### Supprimer tous docker conteneurs
```
docker container rm $(docker container ls -aq)
```

#### Supprimer tous les conteneurs ET toutes les images
```
docker rm -v $(docker ps -a -q)
docker rmi -f $(docker images -q)
```

#### Voir tous les conteneurs docker-compose
```
docker-compose ps
```

#### Arrêter tous les docker-compose conteneurs
```
docker-compose stop
```

#### Arrêter et supprimer tous les docker-compose conteneurs
```
docker-compose down
```

#### Clean up docker compose
```
docker-compose rm -v
```

#### Builder un container à nouveau si changements
```
docker-compose up -d --force-recreate --build
```

#### Rentrer dans un shell à l'intérieur du conteneur
```
docker exec -it [container] /bin/bash
```

#### Imprimer les logs du conteneur docker
```
docker logs [container_name || container_id] -f
```


## Wordpress Administration
```
Dans apparence séléctionner le nouveau theme
```

## Process deploiement automatique

### 1 - Pour activer la CI/CD
Renommez le fichier .gitlab-ci-sample.yml en .gitlab-ci.yml

### 2 - ticket bearsteck
```
Bonjour

Pouvez-vous :
- Créer un environnement de préprod "[projet].preprod.lonsdale.io" sur "lonsdale-preprod.ovh.bearstech.com".
- Créer un environnement de prod "nom de domaine" sur "lonsdale.ovh.bearstech.com".
- Mettre en place une protection htaccess sur la preprod
- Activer HTTPS via lets encrypt.
- Ajouter ces Variables d'environnement pour que nous puissions y accéder depuis le code php (pouvez-vous remplacer les "XXXX" par la valeur correspondante que vous connaitrez lors de la création de l'environnement)

° MYSQL_DATABASE=XXXXX
° MYSQL_USER=XXXXX
° MYSQL_PASSWORD=XXXXX
° MYSQL_HOST=127.0.0.1

- Ajouter cette clé pour l'accès au serveur "lonsdale-preprod.ovh.bearstech.com" ?
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC06uGrpswAZrIpRQfiAxOrGiuLZguefwzyljyL4VPlBo+YPNl7vcJB3NeQ2DllWH7khHCkYHk0+RoXL2mRembUlfMwT5+CZyDRuD26QAPwVFBRVqOuZW+WAP0XK9+prMJobQqtV7B0JcrzRLTiLZ3lcCtPqnuJEWEJ3mTTMCmD53Htnkh7w1t0arEaXedBDkQ4LXqbNCjz8PU1lxDf5V/bzoDGGTNBHW3bEqNEUF8KqRqDbh8vDE4JwVWalR5ypZdH0dfcAjG6YLD+fi+MnqMOjMjZSWmj6PNVe537zPXwGiqPCwHl7eVrHA0+dUVQ1cRAJfM7HIOzIqR6j/JxLkc7 deploy@lonsdale.fr

Merci
```
### 3 - gitlab

Télécharger https://projects.lonsdale.fr/#/files/7047136, copier contenu clé privé et la mettre dans la var SSH_KEY

Dans Settings > CI / CD > Variables, ajouter: (key / value)
PP_DOCROOT = root
PP_SSH_SERVER = lonsdale-preprod.ovh.bearstech.com
PP_SSH_USER = [le user du projet]
SSH_KEY = CLE_PRIVEE_DU_FICHIER_TELECHARGE

Dans le repo à la racine: .gitlab-ci.ym:
décommenté de la ligne 7 à 22

Créer une branche preprod et la protéger
settings > repository > Protected Branches (mettre maintainers dans selects) 

### 4 - installation de la preprod

Se connecter en ssh au serveur bearstech:
```
ssh user@lonsdale-preprod.ovh.bearstech.com
```

**génerer cle ssh:**
ssh-keygen
cat ~/.ssh/id_rsa.pub 
copier la cle dans:
Settings > Repository > Deploy Keys

**Vider le dossier root:**
```
cd root
rm -rf web
git clone [le repo du projet] .
```

**Attention** checkout preprod

### 5 - base bearstech
Si besoin d'importer la base sur la préprod, voici comment obtenir les infos de connexions

Lire le fichier .my.cnf pour récupérer le password
```
cd [le repo du projet]/
ls -la
cat .my.cnf
```

host: 127.0.0.1  
user: [le user du projet]  
password: my.cnf password  
  
shh host: lonsdale-preprod.ovh.bearstech.com  
ssh user: [le user du projet]  
ssh key: user key id_rsa  
