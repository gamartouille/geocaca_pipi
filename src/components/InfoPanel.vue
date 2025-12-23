<template>
  <div id="info">
    <h2>🏫 Géodata Paris (ex ENSG)</h2>
    <p><strong>6-8 Avenue Blaise Pascal</strong></p>
    <p>Cité Descartes, Champs-sur-Marne</p>
    <p style="margin-top: 10px; font-size: 11px;">
      Architecture: Chaix & Morel (1997)<br />
      Bâtiment partagé avec l'École des Ponts
    </p>
    <p style="margin-top: 10px; font-size: 11px;">
      <strong>Géodata (Ouest) :</strong> 3 ailes Cassini<br />
      <strong>École des Ponts (Est) :</strong> 3 ailes Belgrand
    </p>
    <p style="margin-top: 10px; color: #ffd700;">
      💡 Survolez et cliquez sur les étages !
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
