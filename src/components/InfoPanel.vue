<template>
  <div id="info">
    <p style="margin-top: 10px; color: #ffd700;">
      Cliquez sur l'étage où vous avez posé la pêche !
    </p>
  </div>
</template>

<style scoped>
#info {
  position: absolute;
  top: 20px;
  left: 20px;
  color: white;
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 10px;
  font-size: 14px;
  max-width: 320px;
  z-index: 10;
}
#info h2 {
  margin: 0 0 10px 0;
  font-size: 18px;
}
#info p {
  margin: 5px 0;
  font-size: 12px;
  line-height: 1.5;
}
</style>
