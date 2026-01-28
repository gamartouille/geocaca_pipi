<template>
  <div id="controls">
    Cliquez et glissez pour faire tourner<br />
    Molette pour zoomer/dézoomer<br />
    Cliquez sur un étage pour voir qui est passé avant vous
  </div>
</template>

<style scoped>
#controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
  color: white;
  background: rgba(0, 0, 0, 0.8);
  padding: 15px;
  border-radius: 8px;
  font-size: 12px;
  z-index: 10;
}
</style>
