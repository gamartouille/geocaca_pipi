<template>
  <div class="player-login" style="padding:16px; background:#f5f5f5; border-radius:8px; max-width:350px">
    <h4 style="margin:0 0 12px 0">Enregistrement Joueur</h4>

    <div v-if="error" style="color:#a00; font-size:12px; margin-bottom:8px">{{ error }}</div>
    <div v-if="successMsg" style="color:#060; font-size:12px; margin-bottom:8px">{{ successMsg }}</div>

    <div v-if="!isLoggedIn" style="display:flex; flex-direction:column; gap:8px">
      <input
        v-model="pseudo"
        placeholder="Pseudo"
        type="text"
        style="padding:8px; border:1px solid #ccc; border-radius:4px"
        :disabled="loading"
      />
      <input
        v-model="code"
        placeholder="Code session (optionnel)"
        type="text"
        style="padding:8px; border:1px solid #ccc; border-radius:4px"
        :disabled="loading"
      />
      <button
        @click="registerOrLogin"
        style="padding:8px; background:#007bff; color:#fff; border:none; border-radius:4px; cursor:pointer"
        :disabled="loading"
      >
        {{ code ? "Se connecter" : "S'enregistrer" }}
      </button>
    </div>

    <div v-else style="font-size:12px">
      <div style="margin-bottom:4px"><strong>Pseudo:</strong> {{ currentPlayer.pseudo }}</div>
      <div style="margin-bottom:4px"><strong>Code:</strong> {{ currentPlayer.code }}</div>
      <button @click="logout" style="padding:6px 12px; background:#dc3545; color:#fff; border:none; border-radius:4px; cursor:pointer">
        Déconnexion
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue';
import { supabase } from '../supabase/index.js';

const emit = defineEmits(['player-updated']);

const pseudo = ref('');
const code = ref('');
const loading = ref(false);
const error = ref('');
const successMsg = ref('');
const currentPlayer = ref(null);

const isLoggedIn = computed(() => !!currentPlayer.value);

async function registerOrLogin() {
  error.value = '';
  successMsg.value = '';
  loading.value = true;

  try {
    if (code.value) {
      // Rechercher une session existante par code
      const { data, error: e } = await supabase
        .from('player_sessions')
        .select('*')
        .eq('code', code.value)
        .single();

      if (e && e.code !== 'PGRST116') {
        throw e;
      }

      if (data) {
        currentPlayer.value = data;
        emit('player-updated', data);
        successMsg.value = `Bienvenue ${data.pseudo}!`;
        pseudo.value = '';
        code.value = '';
        return;
      } else {
        error.value = 'Code invalide. Vérifie ton code.';
        return;
      }
    }

    // Créer une nouvelle session
    if (!pseudo.value) {
      error.value = 'Rentre un pseudo.';
      return;
    }

    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const { data, error: e } = await supabase.from('player_sessions').insert([
      {
        pseudo: pseudo.value,
        code: newCode,
        session_id: sessionId,
      },
    ]).select().single();

    if (e) throw e;

    currentPlayer.value = data;
    emit('player-updated', data);
    successMsg.value = `Bienvenue ${data.pseudo}! Ton code: ${data.code}`;
    pseudo.value = '';
    code.value = '';
  } catch (err) {
    error.value = err.message || String(err);
  } finally {
    loading.value = false;
  }
}

function logout() {
  currentPlayer.value = null;
  emit('player-updated', null);
  pseudo.value = '';
  code.value = '';
}
</script>

<style scoped>
input, button { font-size: 14px; }
</style>
