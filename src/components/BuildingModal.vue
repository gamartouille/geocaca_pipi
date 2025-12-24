<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  floorData: Object,
})
const emit = defineEmits(['close'])

const floorNames = ['RDC', '1er étage', '2ème étage', '3ème étage', '4ème étage']

const records = ref([])
const nick = ref('')
const rating = ref(0)
const comment = ref('')
const maxShown = 5
const messages = ref([])
const showMessage = ref(false)
const messageText = ref('')

const wingCodeToName = { A: 'Cassini', B: 'Laplace', C: 'Maupertuis' }
const wingNameToCode = Object.fromEntries(Object.entries(wingCodeToName).map(([k, v]) => [v.toLowerCase(), k]))

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

function storageKeyForFloor(floor) {
  if (!floor) return null
  // Create a stable key using wing, wingNumber, floorNumber
  return `floor_records_${floor.wing || 'W'}_${floor.wingNumber || 0}_${floor.floorNumber || 0}`
}

function loadRecords() {
  const key = storageKeyForFloor(props.floorData)
  if (!key) {
    records.value = []
    return
  }
  try {
    const raw = localStorage.getItem(key)
    records.value = raw ? JSON.parse(raw) : []
    // keep newest first
    records.value.sort((a, b) => b.ts - a.ts)
  } catch (e) {
    records.value = []
  }
}

async function fetchMessagesFile() {
  try {
    const res = await fetch('/messages.txt')
    if (!res.ok) return
    const txt = await res.text()
    // parse semicolon-separated lines: CODE;floorNumber;message
    const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const parsed = []
    for (const line of lines) {
      const parts = line.split(';')
      // expect at least 3 columns: code;floorNumber;message
      if (parts.length >= 3) {
        parsed.push({
          code: parts[0].trim(),
          floorNumber: parts[1].trim(),
          message: parts.slice(2).join(';').trim()
        })
      }
    }
    messages.value = parsed
  } catch (e) {
    messages.value = []
  }
}

function findMessageForFloor(floor) {
  if (!floor) return null
  // determine code for this floor's wing
  let code = ''
  if (typeof floor.wing === 'string') {
    const s = floor.wing.trim()
    if (wingCodeToName[s]) code = s
    else {
      const lower = s.toLowerCase()
      if (wingNameToCode[lower]) code = wingNameToCode[lower]
    }
  }
  // also accept direct wingCode in floor.wingCode
  if (!code && floor.wingCode) code = String(floor.wingCode).trim()

  const fn = String(floor.floorNumber ?? '')
  // match code + floorNumber
  if (code) {
    const exact = messages.value.find(m => String(m.code) === code && String(m.floorNumber) === fn)
    if (exact) return exact.message
  }
  // fallback: match floorNumber only
  const last = messages.value.find(m => String(m.floorNumber) === fn)
  return last ? last.message : null
}

function saveRecords() {
  const key = storageKeyForFloor(props.floorData)
  if (!key) return
  localStorage.setItem(key, JSON.stringify(records.value))
}

async function addRecord() {
  const username = localStorage.getItem('nick') || nick.value || 'Anonyme'
  if (!rating.value || rating.value < 1) return // rating mandatory
  const entry = {
    nick: username,
    rating: Number(rating.value),
    comment: (comment.value || '').trim(),
    ts: Date.now()
  }
  records.value.unshift(entry)
  // keep limited history (e.g., 50)
  if (records.value.length > 50) records.value.length = 50
  saveRecords()
  // reset form
  rating.value = 0
  comment.value = ''
  // ensure messages loaded and show message if any
  if (messages.value.length === 0) await fetchMessagesFile()
  const msg = findMessageForFloor(props.floorData)
  if (msg) {
    messageText.value = msg
    showMessage.value = true
  }
}

const recent = computed(() => records.value.slice(0, maxShown))

watch(() => props.visible, (v) => {
  if (v) {
    loadRecords()
  }
})

// expose helper to render stars
function starArray(n) {
  return Array.from({ length: 5 }, (_, i) => i + 1)
}
</script>

<template>
  <div v-if="visible">
    <div id="overlay" @click="closeModal"></div>
    <div id="modal">
      <button id="close-modal" @click="closeModal">×</button>
      <h3 id="modal-title">
        {{ displayWingName(floorData.wing) }} {{ floorData.wingNumber }} - {{ floorNames[floorData.floorNumber] }}
      </h3>
      <div id="modal-content">
        <section class="recent-section">
          <h4>Dernières utilisations</h4>
          <div v-if="recent.length === 0">Aucune utilisation enregistrée pour cet étage.</div>
          <ul v-else>
            <li v-for="(r, idx) in recent" :key="r.ts + '-' + idx" class="record-item">
              <div class="record-meta">
                <strong>{{ r.nick }}</strong>
                <span class="record-rating">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
                <small class="record-date">{{ new Date(r.ts).toLocaleString() }}</small>
              </div>
              <div class="record-comment" v-if="r.comment">{{ r.comment }}</div>
            </li>
          </ul>
        </section>

        <section class="add-section">
          <h4>Enregistrer ton utilisation</h4>

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
            <label>Ton pseudo (sera pris depuis ta session si vide)</label>
            <input v-model="nick" placeholder="Ton pseudo (optionnel)" />
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
            <textarea v-model="comment" rows="3" placeholder="Raconte brièvement ton utilisation..."></textarea>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  min-width: 420px;
  max-width: 90vw;
  animation: modalAppear 0.3s ease-out;
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
  padding-bottom: 10px;
}

#modal-content {
  font-size: 14px;
  line-height: 1.6;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

#modal ul { list-style: none; padding: 0; margin: 0 }

.record-item { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06) }
.record-meta { display:flex; gap:10px; align-items:center }
.record-rating { color: #ffd700 }
.record-date { margin-left: auto; font-size: 11px; opacity: 0.9 }
.record-comment { margin-top: 6px; font-style: italic; opacity: 0.95 }

.add-section { background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px }
.form-row { margin-bottom: 10px; display:flex; flex-direction: column }
input, textarea { padding: 8px; border-radius: 6px; border: none; outline: none }
.stars { display:flex; gap:6px }
.star-btn { background: transparent; color: rgba(255,255,255,0.35); border: none; font-size: 22px; cursor: pointer }
.star-btn.active { color: #ffd700 }
.actions { display:flex; justify-content: flex-end }
.actions button { padding: 8px 14px; border-radius: 6px; border: none; cursor: pointer }

#overlay { display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 999; backdrop-filter: blur(5px); }
</style>
<style scoped>
.message-window { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; z-index:2000 }
.message-box { background: #fff; color: #111; padding: 20px; border-radius: 10px; min-width: 320px; max-width: 80vw; box-shadow: 0 10px 40px rgba(0,0,0,0.4) }
.message-box h4 { margin:0 0 10px 0 }
.message-content { margin-bottom: 12px }
.message-actions { text-align: right }
.msg-close { position:absolute; right:12px; top:8px; background:transparent; border:none; font-size:18px; cursor:pointer }
</style>
