<script setup>
defineProps({
  visible: Boolean,
  floorData: Object,
});
const emit = defineEmits(['close']);

const floorNames = ['RDC', '1er étage', '2ème étage', '3ème étage', '4ème étage'];

function closeModal() {
  emit('close');
}
</script>

<template>
  <div v-if="visible">
    <div id="overlay" @click="closeModal"></div>
    <div id="modal">
      <button id="close-modal" @click="closeModal">×</button>
      <h3 id="modal-title">
        {{ floorData.wing }} {{ floorData.wingNumber }} - {{ floorNames[floorData.floorNumber] }}
      </h3>
      <div id="modal-content">
        <ul>
          <li>Information 1</li>
          <li>Information 2</li>
          <li>Information 3</li>
          <li>Information 4</li>
          <li>Information 5</li>
        </ul>
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
  min-width: 400px;
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
  font-size: 24px;
  font-weight: bold;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 10px;
}

#modal-content {
  font-size: 14px;
  line-height: 1.8;
}

#modal ul {
  list-style: none;
  padding: 0;
  margin: 15px 0;
}

#modal ul li {
  padding: 10px 0;
  padding-left: 30px;
  position: relative;
}

#modal ul li:before {
  content: "•";
  position: absolute;
  left: 10px;
  font-size: 20px;
  color: #ffd700;
}

#close-modal {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  transition: all 0.3s;
}

#close-modal:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: rotate(90deg);
}

#overlay {
  display: block; /* Changed from none */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 999;
  backdrop-filter: blur(5px);
}
</style>
