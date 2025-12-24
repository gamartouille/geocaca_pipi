<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ThreeExperience } from '../three/main.js';

const emit = defineEmits(['floor-click']);
const sceneContainer = ref(null);
let experience = null;
const nick = ref('');
const route = useRoute();
const router = useRouter();

function handleFloorClick(floorData) {
  emit('floor-click', floorData);
}

function clearNick() {
  localStorage.removeItem('nick');
  router.push({ name: 'Home' });
}

onMounted(() => {
  const routeNick = route.query.nick;
  nick.value = routeNick || localStorage.getItem('nick') || '';
  if (sceneContainer.value) {
    experience = new ThreeExperience(sceneContainer.value, handleFloorClick);
  }
});

onUnmounted(() => {
  if (experience) {
    experience.destroy();
  }
});
</script>

<template>
  <div ref="sceneContainer" class="scene-container"></div>
  <div v-if="nick" class="welcome-overlay">
    Bonjour, {{ nick }} — visite de l'école
    <button @click="clearNick">Changer</button>
  </div>
</template>

<style scoped>
.scene-container {
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
}
.welcome-overlay {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(0,0,0,.6);
  color: white;
  padding: .5rem 1rem;
  border-radius: 6px;
  z-index: 1000;
  display: flex;
  gap: .6rem;
  align-items: center;
}
.welcome-overlay button {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255,255,255,.2);
  padding: .2rem .5rem;
  border-radius: 4px;
  cursor: pointer;
}
</style>
