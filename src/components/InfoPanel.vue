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
  top: 80px;
  left: 20px;
  color: white;
  background: rgba(0, 0, 0, 0.8);
  padding: 1rem;
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
  font-size: 14.5px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  #info {
    top: 60px;
    left: 10px;
    padding: 0.75rem;
    font-size: 12px;
    max-width: calc(100vw - 30px);
    border-radius: 8px;
  }
  #info h2 {
    font-size: 14px;
    margin-bottom: 8px;
  }
  #info p {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  #info {
    top: 50px;
    left: 8px;
    padding: 0.5rem;
    font-size: 11px;
    max-width: calc(100vw - 20px);
  }
  #info h2 {
    font-size: 12px;
    margin-bottom: 6px;
  }
  #info p {
    font-size: 11px;
    line-height: 1.3;
  }
}
</style>
