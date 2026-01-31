<template>
  <div class="poop-history-overlay" v-if="visible" @click.self="closeModal">
    <div class="poop-history-modal">
      <button class="close-btn" @click="closeModal">×</button>
      <h2>Mon Historique de Cacas 💩</h2>

      <!-- Statistiques globales -->
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-label">Cacas total</div>
          <div class="stat-value">{{ totalPoops }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Note moyenne</div>
          <div class="stat-value">{{ averageRating }}/5</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Lieu préféré</div>
          <div class="stat-value">{{ favoriteLoc }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Type préféré</div>
          <div class="stat-value">{{ favoriteType }}</div>
        </div>
      </div>

      <!-- Historique détaillé -->
      <div class="history-section">
        <h3>Détail des visites</h3>
        <div v-if="loading" style="text-align: center; padding: 20px; color: #666">Chargement...</div>
        <div v-else-if="poopHistory.length === 0" style="padding: 20px; color: #999">
          Pas encore de cacas enregistrés. Vas-y ! 🚽
        </div>
        <div v-else class="history-list">
          <div v-for="entry in poopHistory" :key="entry.id" class="history-entry">
            <div class="entry-header">
              <span class="entry-location">
                {{ displayWingName(entry.wing_name) }} {{ entry.wing_number }} - Étage {{ entry.floor_number }}
              </span>
              <span class="entry-rating">{{ '★'.repeat(entry.rating) }}{{ '☆'.repeat(5 - entry.rating) }}</span>
            </div>
            <div class="entry-type">{{ entry.toilet_type }}</div>
            <div v-if="entry.comment" class="entry-comment">{{ entry.comment }}</div>
            <div class="entry-date">{{ formatDate(entry.created_at) }}</div>
          </div>
        </div>
      </div>

      <button class="close-modal-btn" @click="closeModal">Fermer</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { supabase } from '../supabase/index.js';

const props = defineProps({
  visible: Boolean,
});
const emit = defineEmits(['close']);

const poopHistory = ref([]);
const loading = ref(false);

const wingCodeToName = { A: 'Cassini', B: 'Laplace', C: 'Maupertuis' };

function displayWingName(code) {
  return wingCodeToName[code] || code;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('fr-FR');
}

async function loadHistory() {
  loading.value = true;
  try {
    const playerId = localStorage.getItem('playerId');
    if (!playerId) {
      poopHistory.value = [];
      return;
    }

    const { data, error } = await supabase
      .from('poop_history')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    poopHistory.value = data || [];
  } catch (err) {
    console.error('Erreur chargement historique:', err);
    poopHistory.value = [];
  } finally {
    loading.value = false;
  }
}

const totalPoops = computed(() => poopHistory.value.length);

const averageRating = computed(() => {
  if (poopHistory.value.length === 0) return '—';
  const sum = poopHistory.value.reduce((acc, e) => acc + (e.rating || 0), 0);
  return (sum / poopHistory.value.length).toFixed(1);
});

const favoriteLoc = computed(() => {
  if (poopHistory.value.length === 0) return '—';
  const locMap = {};
  poopHistory.value.forEach(e => {
    const loc = `${displayWingName(e.wing_name)} ${e.wing_number} - Ét.${e.floor_number}`;
    locMap[loc] = (locMap[loc] || 0) + 1;
  });
  let max = 0;
  let favorite = '—';
  for (const [loc, count] of Object.entries(locMap)) {
    if (count > max) {
      max = count;
      favorite = loc;
    }
  }
  return favorite;
});

const favoriteType = computed(() => {
  if (poopHistory.value.length === 0) return '—';
  const typeMap = {};
  poopHistory.value.forEach(e => {
    typeMap[e.toilet_type] = (typeMap[e.toilet_type] || 0) + 1;
  });
  let max = 0;
  let favorite = '—';
  for (const [type, count] of Object.entries(typeMap)) {
    if (count > max) {
      max = count;
      favorite = type;
    }
  }
  return favorite;
});

function closeModal() {
  emit('close');
}

watch(() => props.visible, (v) => {
  if (v) {
    loadHistory();
  }
});
</script>

<style scoped>
.poop-history-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 10px;
  backdrop-filter: blur(4px);
}

.poop-history-modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.close-btn {
  position: absolute;
  right: 12px;
  top: 12px;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #000;
}

h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

@media (max-width: 480px) {
  .stats-container {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.history-section {
  margin-bottom: 24px;
}

.history-section h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.history-list {
  max-height: 350px;
  overflow-y: auto;
}

.history-entry {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  background: #f9f9f9;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.entry-location {
  font-weight: bold;
  color: #333;
  font-size: 13px;
}

.entry-rating {
  color: #ffc107;
  font-size: 12px;
}

.entry-type {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.entry-comment {
  font-size: 12px;
  color: #555;
  font-style: italic;
  margin-bottom: 4px;
}

.entry-date {
  font-size: 11px;
  color: #999;
}

.close-modal-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  font-weight: bold;
}

.close-modal-btn:hover {
  opacity: 0.9;
}
</style>
