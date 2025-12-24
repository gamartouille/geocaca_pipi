<template>
  <main class="home">
    <h1>Bienvenue à l'école</h1>
    <p>
      Bienvenue sur la visite 3D de l'école. Entre ton pseudo ci-dessous pour commencer
      la visite. Le pseudo sera conservé localement pour les prochaines visites.
    </p>

    <form @submit.prevent="enterSite" class="form">
      <label for="nick">Ton pseudo</label>
      <input id="nick" v-model="nick" required maxlength="30" placeholder="ex : Garance" />

      <button type="submit">Entrer</button>
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

<style scoped>
.home { padding: 1.5rem; max-width: 700px; margin: 3rem auto; }
.form { display: flex; gap: 0.5rem; flex-direction: column; margin-top: 1rem }
input { padding: .5rem; font-size: 1rem; }
button { padding: .6rem 1rem; font-size: 1rem; cursor: pointer; }
</style>
