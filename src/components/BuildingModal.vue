<script setup>
import { ref, watch, computed } from 'vue'
import { supabase } from '../supabase/index.js'

const props = defineProps({
  visible: Boolean,
  floorData: Object,
})
const emit = defineEmits(['close'])

const floorNames = ['RDC', '1er étage', '2ème étage', '3ème étage', '4ème étage']

const records = ref([])
const recordsByType = ref({}) // { toiletType: [records...] }
const nick = ref('')
const rating = ref(0)
const comment = ref('')
const selectedToiletType = ref('normal') // current tab
const maxShown = 5
const messages = ref([])
const showMessage = ref(false)
const messageText = ref('')

const wingCodeToName = { A: 'Cassini', B: 'Laplace', C: 'Maupertuis' }
const wingNameToCode = Object.fromEntries(Object.entries(wingCodeToName).map(([k, v]) => [v.toLowerCase(), k]))

// Déterminer les types de toilettes selon l'étage
const toiletTypes = computed(() => {
  const floorNum = props.floorData?.floorNumber
  if (floorNum === 2 || floorNum === 4) {
    return ['Toilettes valides', 'Toilettes handicapées']
  } else {
    return ['Hommes', 'Femmes']
  }
})


function displayWingName(w) {
  if (!w) return ''
  const s = String(w).trim()
  if (wingCodeToName[s]) return wingCodeToName[s]
  const lower = s.toLowerCase()
  if (wingNameToCode[lower]) return wingCodeToName[wingNameToCode[lower]]
  return s
}

function closeModal() {
  emit('close')
}

function storageKeyForFloor(floor, toiletType) {
  if (!floor) return null
  return `floor_records_${floor.wing || 'W'}_${floor.wingNumber || 0}_${floor.floorNumber || 0}_${toiletType}`
}

async function loadRecords() {
  recordsByType.value = {}
  
  // Initialiser selectedToiletType au premier type disponible
  if (toiletTypes.value.length > 0) {
    selectedToiletType.value = toiletTypes.value[0]
  }

  for (const type of toiletTypes.value) {
    const key = storageKeyForFloor(props.floorData, type)

    if (!key) {
      recordsByType.value[type] = []
      continue
    }

    try {
      const { data, error } = await supabase
        .from('poop_history')
        .select('*, nick:player_sessions ( pseudo )')
        .eq('wing_name', props.floorData.wing)
        .eq('floor_number', props.floorData.floorNumber)
        .eq('toilet_type', type)

      data.map(entree => entree.nick = entree.nick.pseudo)

      // console.log(data)
      if (error) throw error

      // console.log("Données reçues pour", type, ":", data)
      
      let records = data || []
      
      records.sort((a, b) => b.created_at - a.created_at)
      recordsByType.value[type] = records

    } catch (e) {
      recordsByType.value[type] = []
    }
  }
}

const recent = computed(() => recordsByType.value[selectedToiletType.value]?.slice(0, maxShown) || [])

// console.log(await supabase
//       .from('poop_history')
//       .select('*'))
// console.log(await supabase
//       .from('player_sessions')
//       .select('*'))

async function fetchMessagesFile() {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('code, floor_number, wing_name, message')

    // console.log(data)
    if (error || !data) {
      messages.value = []
      return
    }

    messages.value = data.map((r) => ({
      code: r.code != null ? String(r.code).trim() : '',
      floorNumber: r.floor_number != null ? String(r.floor_number).trim() : '',
      wingName: r.wing_name != null ? String(r.wing_name).trim() : '',
      message: r.message || ''
    }))
  } catch (e) {
    messages.value = []
  }
}

function findMessageForFloor(floor) {
  if (!floor) return null
  let code = ''
  if (typeof floor.wing === 'string') {
    const s = floor.wing.trim()
    if (wingCodeToName[s]) code = s
    else {
      const lower = s.toLowerCase()
      if (wingNameToCode[lower]) code = wingNameToCode[lower]
    }
  }
  if (!code && floor.wingCode) code = String(floor.wingCode).trim()
  const fn = String(floor.floorNumber ?? '')
  // derive a normalized wing name for matching
  let wingNameFromFloor = ''
  if (typeof floor.wing === 'string') {
    wingNameFromFloor = floor.wing.trim()
  } else if (floor.wingName) {
    wingNameFromFloor = String(floor.wingName).trim()
  }

  const norm = (s) => (s == null ? '' : String(s).trim().toLowerCase())

  // try exact match by code or wing name + floor
  // console.log(messages)
  const exact = messages.value.find(m => {
    return norm(m.floorNumber) === norm(fn) && (
      norm(m.code) === norm(code) ||
      norm(m.code) === norm(wingNameFromFloor) ||
      norm(m.wingName) === norm(wingNameFromFloor) ||
      norm(m.wingName) === norm(code)
    )
  })
  if (exact) return exact.message

  // fallback: any message for the floor number
  const last = messages.value.find(m => norm(m.floorNumber) === norm(fn))
  return last ? last.message : null
}

function saveRecordsForType(toiletType) {
  const key = storageKeyForFloor(props.floorData, toiletType)
  if (!key) return
  localStorage.setItem(key, JSON.stringify(recordsByType.value[toiletType] || []))
}

async function addRecord() {
  const username = localStorage.getItem('nick') || nick.value || 'Anonyme'
  if (!rating.value || rating.value < 1) return
  
  const entry = {
    nick: username,
    rating: Number(rating.value),
    comment: (comment.value || '').trim(),
    ts: Date.now(),
    toilet_type: selectedToiletType.value
  }
  
  if (!recordsByType.value[selectedToiletType.value]) {
    recordsByType.value[selectedToiletType.value] = []
  }
  recordsByType.value[selectedToiletType.value].unshift(entry)
  if (recordsByType.value[selectedToiletType.value].length > 50) {
    recordsByType.value[selectedToiletType.value].length = 50
  }
  saveRecordsForType(selectedToiletType.value)
  
  // Sauvegarder dans Supabase
  try {
    const playerId = localStorage.getItem('playerId')
    if (playerId) {
      // Insérer dans la table poop_history
      await supabase.from('poop_history').insert([
        {
          player_id: playerId,
          wing_name: props.floorData.wing,
          wing_number: props.floorData.wingNumber,
          floor_number: props.floorData.floorNumber,
          toilet_type: selectedToiletType.value,
          rating: rating.value,
          comment: comment.value || null,
        },
      ])
    }
  } catch (e) {
    console.warn('Erreur Supabase:', e)
  }
  rating.value = 0
  comment.value = ''
  if (messages.value.length === 0) await fetchMessagesFile()
  const msg = findMessageForFloor(props.floorData)
  if (msg) {
    messageText.value = msg
    showMessage.value = true
  }
}

function starArray(n) {
  return Array.from({ length: 5 }, (_, i) => i + 1)
}

watch(() => props.visible, (v) => {
  if (v) {
    loadRecords()
  }
})

</script>

<template>
  <div v-if="visible">
    <div id="overlay" @click="closeModal"></div>
    <div id="modal">
      <button id="close-modal" @click="closeModal">×</button>
      <h3 id="modal-title">
        {{ displayWingName(floorData.wing) }} - {{ floorNames[floorData.floorNumber] }}
      </h3>
      <div id="modal-content">
        <!-- Sélecteur de type de toilette (volets) -->
        <div class="toilet-type-tabs">
          <button
            v-for="type in toiletTypes"
            :key="type"
            :class="['tab-btn', { active: selectedToiletType === type }]"
            @click="selectedToiletType = type"
          >
            {{ type }}
          </button>
        </div>

        <section class="recent-section">
          <h4>Dernières utilisations ({{ selectedToiletType }})</h4>
          <div v-if="recent.length === 0">Aucune utilisation enregistrée pour ce type.</div>
          <ul v-else>
            <li v-for="(r, idx) in recent" :key="r.ts + '-' + idx" class="record-item">
              <div class="record-meta">
                <strong>{{ r.nick }}</strong>
                <span class="record-rating">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
                <small class="record-date">{{ new Date(r.created_at).toLocaleString() }}</small>
              </div>
              <div class="record-comment" v-if="r.comment">{{ r.comment }}</div>
            </li>
          </ul>
        </section>

        <section class="add-section">
          <h4>Enregistre ton poop</h4>

          <!-- message overlay shown after adding a record -->
          <div v-if="showMessage" class="message-window">
            <div class="message-box">
              <button class="msg-close" @click="showMessage = false">×</button>
              <h4>Message pour {{ displayWingName(floorData.wing) }} {{ floorData.wingNumber }} - {{ floorNames[floorData.floorNumber] }}</h4>
              <div class="message-content">{{ messageText }}</div>
              <div class="message-actions">
                <button @click="showMessage = false">Fermer</button>
              </div>
            </div>
          </div>

          <div class="form-row">
            <label>Note (obligatoire)</label>
            <div class="stars">
              <button
                v-for="s in starArray(5)"
                :key="s"
                type="button"
                :class="['star-btn', { active: s <= rating } ]"
                @click="rating = s"
                aria-label="Donner {{s}} étoile(s)"
              >
                ★
              </button>
            </div>
          </div>

          <div class="form-row">
            <label>Commentaire (optionnel)</label>
            <textarea v-model="comment" rows="3" placeholder="Comment s'est passé ce poop ?"></textarea>
          </div>

          <div class="form-row actions">
            <button :disabled="!rating" @click="addRecord">Enregistrer</button>
          </div>
        </section>
      </div>
    </div>
  </div>
  </template>

<style scoped>

#modal {
  display: block; /* Changed from none to allow Vue to control visibility */
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgb(4, 32, 147);
  color: white;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  min-width: 420px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: modalAppear 0.3s ease-out;
}

@media (max-width: 768px) {
  #modal {
    padding: 20px;
    border-radius: 15px;
    min-width: auto;
    width: calc(100vw - 30px);
    max-height: 85vh;
  }
}

@media (max-width: 480px) {
  #modal {
    padding: 15px;
    border-radius: 12px;
    width: calc(100vw - 20px);
    max-height: 80vh;
  }
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

#modal h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 20px;
}

#modal-content {
  font-size: 20px;
  line-height: 1.4;
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  overflow: hidden;
}

.recent-section {
  overflow-y: auto;
  flex: 1;
  margin-bottom: 12px;
  padding-right: 8px;
}

.recent-section::-webkit-scrollbar {
  width: 6px;
}

.recent-section::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.recent-section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.recent-section::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Volets/Tabs pour les types de toilettes */
.toilet-type-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 5px 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.9);
  color: #764ba2;
  border-color: white;
  font-weight: bold;
}

@media (max-width: 768px) {
  #modal h3 {
    font-size: 16px;
    margin-bottom: 15px;
    padding-bottom: 8px;
  }

  #modal-content {
    font-size: 13px;
    grid-template-columns: 1fr;
    gap: 15px;
  }
}

@media (max-width: 480px) {
  #modal h3 {
    font-size: 14px;
    margin-bottom: 12px;
  }

  #modal-content {
    font-size: 12px;
    gap: 12px;
  }
}

#modal ul { list-style: none; padding: 0; margin: 0 }

.record-item { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06) }
.record-meta { display:flex; gap:10px; align-items:center; flex-wrap: wrap }
.record-rating { color: #ffd700 }
.record-date { margin-left: auto; font-size: 11px; opacity: 0.9 }
.record-comment { margin-top: 6px; font-style: italic; opacity: 0.95 }

.add-section { background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; flex-shrink: 0; }
.form-row { margin-bottom: 10px; display:flex; flex-direction: column }
input, textarea { padding: 8px; border-radius: 6px; border: none; outline: none; font-size: 16px; font-family: inherit; }
textarea { resize: vertical; min-height: 80px; }
.stars { display:flex; gap:6px; flex-wrap: wrap }
.star-btn { background: transparent; color: rgba(255,255,255,0.35); border: none; font-size: 22px; cursor: pointer; padding: 4px; }
.star-btn.active { color: #ffd700 }
.actions { display:flex; justify-content: flex-end }
.actions button { padding: 8px 14px; border-radius: 6px; border: none; cursor: pointer; font-size: 14px; }

@media (max-width: 480px) {
  .add-section {
    padding: 12px;
    margin-top: 8px;
  }

  .form-row {
    margin-bottom: 12px;
  }

  .form-row label {
    margin-bottom: 6px;
    font-size: 14px;
  }

  input, textarea {
    padding: 10px;
    font-size: 16px;
  }

  textarea {
    min-height: 70px;
  }

  .record-date {
    margin-left: 0;
    margin-top: 4px;
    width: 100%;
  }

  .star-btn {
    font-size: 20px;
  }

  .actions button {
    padding: 10px 16px;
    font-size: 14px;
  }
}

#overlay { display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 999; backdrop-filter: blur(5px); }

@supports not (backdrop-filter: blur(5px)) {
  #overlay {
    background: rgba(0, 0, 0, 0.8);
  }
}
</style>
<style scoped>
.message-window { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; z-index:2000; padding: 10px; background: rgba(0, 0, 0, 0.5); }
.message-box { background: #fff; color: #111; padding: 20px; border-radius: 10px; min-width: 320px; max-width: 80vw; box-shadow: 0 10px 40px rgba(0,0,0,0.4); position: relative; }
.message-box h4 { margin:0 0 10px 0; font-family: inherit; }
.message-content { margin-bottom: 12px; line-height: 1.6; font-family: inherit; }
.message-actions { text-align: right }
.msg-close { position:absolute; right:12px; top:8px; background:transparent; border:none; font-size:18px; cursor:pointer; padding: 4px; }

@media (max-width: 768px) {
  .message-box {
    min-width: auto;
    max-width: calc(100vw - 20px);
    padding: 15px;
  }
  .message-box h4 {
    font-size: 15px;
  }
  .message-content {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .message-window {
    padding: 8px;
  }
  .message-box {
    padding: 12px;
    border-radius: 8px;
    min-width: calc(100vw - 16px);
    max-width: calc(100vw - 16px);
  }
  .message-box h4 {
    font-size: 14px;
    margin-bottom: 8px;
  }
  .message-content {
    font-size: 13px;
  }
}
</style>
