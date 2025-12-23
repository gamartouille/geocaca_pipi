# Coucou Garance !

Je t'explique rapidement ce qui correspond à quoi dans ce projet et les deux trois trucs à faire.

Initialiser le projet
---------------------

Déjà tu vas soit créer une branche `garance` et tu l'initialise à partir de cette branche `diego`, soit `pull` (écraser) cette branche sur le main. Je te recommande fortement la première option.
Ensuite tu vas ouvrir vscode avec ce projet et dans le terminal tu executes la commande suivante:
```
npm install
```
Normalement tu devrais avoir un nouveau dossier `node_modules` dans ton architecture de projet (si tu as des galères reviens vers moi).

Maintenant pour lancer le projet tu executes: 
```
npm run dev
```

Tu devrais obtenir un lien localhost que tu copies-colles dans ton navigateur et c'est bon tu devrais apercevoir ton travail !


L'architecture
--------------

Alors tout d'abord, cette architecture a été géneré par Vite avec le framework Vue via Node.js (et son outil de paquetage *npm*). Bien qu'elle semble complexe, en réalité c'est plutôt simple je te montre avec son worktree:
```
┣ geocaca_pipi 
 ┣ .vscode/             # on demande à vscode de ne pas regarder ce qu'il y a dans ce dossier (on touche pas)
 ┣ node_modules/        # c'est la que node va placer tous les modules (packages) nécessaires au fonctionnement de l'appli (qu'on ne met pas sur git !!! si tu veux savoir pourquoi n'hésite pas à me demander) (on touche pas)
 ┣ public/              # ici on va principale placer les images (logos, photos, svg, etc.)
 ┣ src/                 # C'EST LE COEUR DU PROJET, ici tu as tout ce que tu vas modifier, je te montre plus en profondeur juste après
 ┣ .gitignore           # ici tu retrouves les fichiers que tu n'envoies pas à git soit pcq privés soit pcq pas nécessaire
 ┣ index.html           # le index.html c'est le point d'entrée de ton appli pour le navigateur que l'initialisation du projet gère tout seul
 ┣ package-lock.json    # c'est un fichier en lien avec le node_modules qui contient les versions, les liens d'origines etc (on touche pas)
 ┣ package.json         # ici tu retrouves les dépendances (packages) que tu as installé toi pour ton projet, dans notre cas: Vite, Vue et ThreeJS (on touche pas)
 ┣ README.md            # Ca c'est ce que tu es entrain de like actuellement :)
 ┣ test_garance.html    # Ton projet de base (je le laisse pour le moment pcq 700 lignes de codes c'est collector)
 ┗ vite.config.js       # Le fichier de configuration de Vite (on touche pas)
```

Donc finalement comme tu peux le voir, on a pas besoin de grand chose nous. Le plus important c'est le dossier `src/`:

```
src
 ┣ components/            # Les composants en Vue c'est les blocs (réutilisables) que tu trouves sur tes pages
 ┃ ┣ BuildingModal.vue    # exemple: les modales que tu ouvres quand tu cliques sur un étage
 ┃ ┣ ControlsGuide.vue
 ┃ ┣ InfoPanel.vue        # Pour la scene, c'est comme si tu construisais un bloc totalement vide avec uniquement les dimensions de la  
 ┃ ┗ Scene.vue            # page de l'utilisateur. C'est une couche supplémentaire où tu vas mettres tes autres composants et autres dedans
 ┣ three/
 ┃ ┗ main.js              # C'est le code JavaScript qui utilise ThreeJS (dans notre cas), on pourrait lui changer de nom pour éviter les confusions
 ┣ App.vue                # App c'est le point d'entrée de Vue, c'est comme son index.html
 ┣ main.js                # C'est le fichier qui créé l'instance Vue mais en JavaScript
 ┗ style.css              # Pour rendre le travail jolie toujours un peu de CSS
```

Bonus
-----
Il doit y avoir des trucs très obscurs encore notamment comment fonctionne Vue et pourquoi on utilise ça alors qu'on peut tout faire dans un seul fichier HTML.

Et bien des raisons y'en a plusieurs, certaines plus évidentes que d'autres, voici une liste non exhaustive:

- Le premier point, c'est que c'est beaucoup plus propre et lisible ! Concrètement si un développeur qui connait rien au projet arrive et tu lui passes un fichier html ou js appelé "index.html" avec 2000 lignes de codes, il va rien comprendre et va être dégouté. Alors qu'avec une architecture claire, des dossiers et sous-dossiers, parfois c'est verbeux mais qu'en tu cherches quelque chose, tu le trouves direct.
- Alors oui tu peux créer un projet complet proprement en faisant du JS pur (dit Vanilla) donc pourquoi utiliser un framework comme Vue ? Et bien c'est pour compenser un tas de problèmes natifs que pose le JavaScript Vanilla (y'en a bcp mais par exemple l'utilisation répété de `getElementById`). Il faut se dire que Vue (ou autre framework) est basé sur le JS mais qu'il en garde que les meilleurs points, il permet de revoir la façon de coder selon une philosophie (Vue c'est le principe de Composants que je t'expliquais plus haut).
- Okay très bien, les frameworks c'est sympa mais comment on choisi et pourquoi Vue dans notre cas ? Les frameworks les plus populaires sont: React, Vue, Angular et Svelte. Chacun a été créer par des gens pour répondre à leur besoin et donc ont été pensé de façon différentes. React permet la liberté totale de création de code, Vue est plus structuré et se rapproche du JS vanilla, Angular c'est une galère (c'est le plus vieux donc populaire mais moins utilisé ces dernières années) et Svelte c'est le petit nouveau qui se veut être le plus proche du JS vanilla avec une simplicité de prise en main inégalable. Nous on a choisi Vue (fin je t'ai fortement conseillé). Ce choix s'explique par le fait que Vue est très populaire (2ème derrière React), structuré (moins de chance de faire n'importe quoi), simple (garde une structure HTML/JS/CSS) et surtout l'IA maîtrise plutôt bien ce framework. En 2025, c'est un point très important ! L'IA excelle en React et en Vue, mais comme Vue est plus structuré il part moins dans tous les sens, il est plus censé. 
