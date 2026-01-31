# Supabase integration pour ce projet

Ce dossier contient des fichiers et instructions pour connecter votre compte Supabase à ce projet Vite/Vue.

Étapes rapides :

1. Créez un projet Supabase et récupérez :
   - `URL` (ex: https://xyzcompany.supabase.co)
   - `ANON KEY` (clé publique)

2. Ajoutez ces variables dans la racine du projet (fichier `.env`) :

```
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

3. Redémarrez le serveur de développement (`npm run dev` ou `pnpm dev`).

4. Utilisez le composant `src/components/SupabasePanel.vue` pour vous connecter et afficher des lignes d'une table : ouvrez-le depuis une vue ou incluez-le dans `App.vue`.

Sécurité : n'ajoutez jamais de clés privées dans le repo. N'utilisez que la `ANON KEY` côté client pour visualiser les données publiques.

Support : si vous voulez une interface plus complète (liste automatique des tables, édition live, webhooks), je peux l'ajouter.
