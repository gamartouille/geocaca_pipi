<template>
  <div class="toilet-rating" style="padding:16px; background:#f9f9f9; border-radius:8px; max-width:380px">
    <h4 style="margin:0 0 12px 0">Note les Toilettes 🚽</h4>

    <div v-if="!playerData" style="font-size:12px; color:#666">
      Connecte-toi d'abord pour noter les toilettes.
    </div>

    <div v-else>
      <div v-if="error" style="color:#a00; font-size:12px; margin-bottom:8px">{{ error }}</div>
      <div v-if="successMsg" style="color:#060; font-size:12px; margin-bottom:8px">{{ successMsg }}</div>

      <div style="margin-bottom:12px">
        <label style="display:block; font-size:12px; margin-bottom:4px"><strong>Note (1-5)</strong></label>
        <div style="display:flex; gap:8px">
          <button
            v-for="n in 5"
            :key="n"
            @click="rating = n"
            :style="{
              padding: '8px 12px',
              background: rating === n ? '#ffc107' : '#ddd',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: rating === n ? 'bold' : 'normal'
            }"
          >
            {{ n }}
          </button>
        </div>
      </div>

      <div style="margin-bottom:12px">
        <label style="display:block; font-size:12px; margin-bottom:4px"><strong>Commentaire (optionnel)</strong></label>
        <textarea
          v-model="comment"
          placeholder="Ton avis..."
          style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-size:12px; resize:vertical; min-height:60px"
        ></textarea>
      </div>

      <button
        @click="submitRating"
        style="padding:8px 12px; background:#28a745; color:#fff; border:none; border-radius:4px; cursor:pointer; width:100%"
        :disabled="loading || !rating"
      >
        {{ loading ? "En cours..." : "Soumettre" }}
      </button>

      <div v-if="playerData" style="margin-top:12px; font-size:11px; color:#666; border-top:1px solid #ddd; padding-top:8px">
        <div><strong>Joueur:</strong> {{ playerData.pseudo }}</div>
        <div v-if="playerData.toilet_rating">
          <strong>Note actuelle:</strong> {{ playerData.toilet_rating }}/5
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '../supabase/index.js';

const props = defineProps({
  playerData: {
    type: Object,
    default: null,
  },
});

const rating = ref(0);
const comment = ref('');
const loading = ref(false);
const error = ref('');
const successMsg = ref('');

async function submitRating() {
  if (!rating.value || !props.playerData) return;

  error.value = '';
  successMsg.value = '';
  loading.value = true;

  try {
    const { error: e } = await supabase
      .from('player_sessions')
      .update({
        toilet_rating: rating.value,
        toilet_comment: comment.value || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', props.playerData.id);

    if (e) throw e;

    successMsg.value = '✓ Note enregistrée!';
    rating.value = 0;
    comment.value = '';
  } catch (err) {
    error.value = err.message || String(err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
textarea { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
</style>
