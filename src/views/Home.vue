<template>
  <main class="home">
    <h1>Bienvenue dans les toilettes de GéocacaPipi</h1>

    <form @submit.prevent="enterSite" class="form">
      <label for="nick">Ton pseudo de pooper</label>
      <input id="nick" v-model="nick" required maxlength="30" placeholder="ex : Mathéo Rendsmoitoncaca, Louise Goupet, Bastien DoucheDoré, Clara Crotte, Nell Caca..." />

      <!-- Champ code session (optionnel) pour se reconnecter -->
      <label for="code" style="margin-top: 12px;">Code session (optionnel pour se reconnecter)</label>
      <input id="code" v-model="code" maxlength="20" placeholder="Rentre ton code si tu as déjà joué" />

      <!-- Champ mot de passe (visible si nouvelle session ou reconnexion) -->
      <label for="password" style="margin-top: 12px;">
        {{ code ? 'Mot de passe' : 'Crée un mot de passe (obligatoire)' }}
      </label>
      <input
        id="password"
        v-model="password"
        type="password"
        required
        maxlength="50"
        placeholder="Choisis un mot de passe sécurisé"
        style="margin-top: 4px"
      />

      <div v-if="error" style="color: #a00; font-size: 12px; margin: 8px 0;">{{ error }}</div>

      <button class="button-30" role="button">Let's GO</button>

    </form>

    
    <img src="D:\ENSG\geocaca-pipi\geocaca_pipi\public\fond_ecran_poopign.png" alt="Logo GéocacaPipi" class="logo" />
    
    <p>
      Merci à Diego, Jules et Maël pour toute l'aide apportée
    </p>
  
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase/index.js';

const router = useRouter();
const nick = ref('');
const code = ref('');
const password = ref('');
const error = ref('');

import { onMounted } from 'vue';
onMounted(() => {
  const saved = localStorage.getItem('nick');
  if (saved) nick.value = saved;
  const savedCode = localStorage.getItem('playerCode');
  if (savedCode) code.value = savedCode;
});

async function enterSite() {
  error.value = '';
  if (!nick.value || !nick.value.trim()) {
    error.value = 'Rentre un pseudo.';
    return;
  }
  if (!password.value || password.value.trim().length < 3) {
    error.value = 'Le mot de passe doit faire au moins 3 caractères.';
    return;
  }

  const trimmed = nick.value.trim();
  const pwd = password.value.trim();

  try {
    let playerSession = null;

    if (code.value) {
      // Reconnecter avec code + mot de passe
      const { data, error: e } = await supabase
        .from('player_sessions')
        .select('*')
        .eq('code', code.value.trim())
        .single();

      if (e && e.code !== 'PGRST116') throw e;

      if (data) {
        // Vérifier le mot de passe (simple comparaison en clair pour démo, en prod: hash + bcrypt)
        if (data.password !== pwd) {
          error.value = 'Code ou mot de passe incorrect.';
          return;
        }
        playerSession = data;
      } else {
        error.value = 'Code invalide. Crée une nouvelle session.';
        return;
      }
    } else {
      // Créer une nouvelle session avec mot de passe
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const { data, error: e } = await supabase.from('player_sessions').insert([
        {
          pseudo: trimmed,
          code: newCode,
          session_id: sessionId,
          password: pwd, // Stocker le mot de passe (en prod: hasher avec bcrypt)
        },
      ]).select().single();

      if (e) throw e;
      playerSession = data;

      alert(`Ton code de session : ${newCode}\nPartage-le pour rejouer la prochaine fois !`);
    }

    localStorage.setItem('nick', trimmed);
    localStorage.setItem('playerCode', playerSession.code);
    localStorage.setItem('playerId', playerSession.id);

    // Aller à la scène
    router.push({ name: 'Scene', query: { nick: trimmed } });
  } catch (err) {
    error.value = 'Erreur : ' + (err.message || String(err));
  }
}
</script>

<style src="../style_Home.css" scoped></style>
