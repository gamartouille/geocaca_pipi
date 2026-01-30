<template>
  <main class="home">
    <h1>Bienvenue dans les toilettes de GéocacaPipi</h1>

    <form @submit.prevent="enterSite" class="form">
      <label for="nick">Ton pseudo de pooper</label>
      <input id="nick" v-model="nick" required maxlength="30" placeholder="ex : Mathéo Rendsmoitoncaca, Louise Goupet, Bastien DoucheDoré, Clara Crotte, Nell Caca..." />

      <button class="button-30" role="button">Let's GO</button>

    </form>

    
    <img src="D:\ENSG\geocaca-pipi\geocaca_pipi\public\fond_ecran_poopign.png" alt="Logo GéocacaPipi" class="logo" />
    
    <p>
      Merci à Diego, Jules et Maël pour toute l'aide apportée
    </p>
  
  </main>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return { nick: '' }
  },
  mounted() {
    const saved = localStorage.getItem('nick')
    if (saved) this.nick = saved
  },
  methods: {
    enterSite() {
      if (!this.nick || !this.nick.trim()) return
      const trimmed = this.nick.trim()
      localStorage.setItem('nick', trimmed)
      this.$router.push({ name: 'Scene', query: { nick: trimmed } })
    }
  }
}
</script>

<style src="../style_Home.css" scoped></style>
