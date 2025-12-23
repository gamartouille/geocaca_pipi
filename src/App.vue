<script setup>
import { ref } from 'vue';
import Scene from './components/Scene.vue';
import InfoPanel from './components/InfoPanel.vue';
import ControlsGuide from './components/ControlsGuide.vue';
import BuildingModal from './components/BuildingModal.vue';

const isModalVisible = ref(false);
const selectedFloorData = ref(null);

function openModal(floorData) {
  selectedFloorData.value = floorData;
  isModalVisible.value = true;
}

function closeModal() {
  isModalVisible.value = false;
  selectedFloorData.value = null;
}
</script>

<template>
  <div id="app-content">
    <Scene @floor-click="openModal" />
    <InfoPanel />
    <ControlsGuide />
    <BuildingModal 
      :visible="isModalVisible" 
      :floor-data="selectedFloorData" 
      @close="closeModal" 
    />
  </div>
</template>

<style scoped>
#app-content {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>