<template>
  <main class="home">
    <h1>Bienvenue dans les toilettes de GéocacaPipi</h1>

    <form @submit.prevent="enterSite" class="form">
      <label for="nick">Ton pseudo de pooper</label>
      <input id="nick" v-model="nick" required maxlength="30" placeholder="ex : Bastien DoucheDoré, Clara Crotte, Nell Caca, Louise Goupet, Mathéo Rendsmoitoncaca,..." />

      <button class="button-30" role="button">Let's GO</button>

    </form>
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
