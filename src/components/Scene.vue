<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { ThreeExperience } from '../three/main.js';

const emit = defineEmits(['floor-click']);
const sceneContainer = ref(null);
let experience = null;

function handleFloorClick(floorData) {
  emit('floor-click', floorData);
}

onMounted(() => {
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
</template>

<style scoped>
.scene-container {
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
