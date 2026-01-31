<template>
  <div class="logo">
    <img src="/logo_poopign.png" alt="Logo GéocacaPipi">
  </div>
  <div class="auth-page">
    <!-- Mode choix initial -->
    <div v-if="mode === 'choice'" class="auth-choice">
      <h1>Bienvenue dans GéocacaPipi</h1>
      <p class="subtitle">Les toilettes collaboratives</p>
      <div class="choice-buttons">
        <button class="btn btn-primary" @click="mode = 'signup'">Créer un compte</button>
        <button class="btn btn-secondary" @click="mode = 'login'">Se connecter</button>
      </div>
    </div>
    <!-- Mode créer un compte -->
    <div v-if="mode === 'signup'" class="auth-form">
      <button class="btn-back" @click="mode = 'choice'">← Retour</button>
      <h2>Créer un compte</h2>
      <form @submit.prevent="handleSignup">
        <div class="form-group">
          <label for="signup-pseudo">Pseudo</label>
          <input
            id="signup-pseudo"
            v-model="signupForm.pseudo"
            type="text"
            required
            maxlength="30"
            placeholder="ex: Mathéo Rendsmoitoncaca"
          />
        </div>

        <div class="form-group">
          <label for="signup-password">Mot de passe</label>
          <input
            id="signup-password"
            v-model="signupForm.password"
            type="password"
            required
            minlength="3"
            maxlength="50"
            placeholder="Minimum 3 caractères"
          />
        </div>

        <div class="form-group">
          <label for="signup-confirm">Confirmer le mot de passe</label>
          <input
            id="signup-confirm"
            v-model="signupForm.confirm"
            type="password"
            required
            maxlength="50"
            placeholder="Répète ton mot de passe"
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Création en cours...' : 'Créer mon compte' }}
        </button>
      </form>
    </div>

    <!-- Mode se connecter -->
    <div v-if="mode === 'login'" class="auth-form">
      <button class="btn-back" @click="mode = 'choice'">← Retour</button>
      <h2>Se connecter</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="login-pseudo">Pseudo</label>
          <input
            id="login-pseudo"
            v-model="loginForm.pseudo"
            type="text"
            required
            maxlength="30"
            placeholder="Ton pseudo"
          />
        </div>

        <div class="form-group">
          <label for="login-password">Mot de passe</label>
          <input
            id="login-password"
            v-model="loginForm.password"
            type="password"
            required
            maxlength="50"
            placeholder="Ton mot de passe"
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Connexion en cours...' : 'Se connecter' }}
        </button>
      </form>
    </div>

    <!-- Modal de succès (signup) -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeSuccessModal">
      <div class="modal-content" @click.stop>
        <h3>✓ Compte créé avec succès !</h3>
        <p>Tu peux maintenant te connecter avec ton pseudo et ton mot de passe.</p>
        <button class="btn btn-primary" @click="closeSuccessModal">Retour au menu</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase/index.js'
import { useRouter } from 'vue-router'

const router = useRouter()

const mode = ref('choice') // 'choice', 'signup', 'login'
const loading = ref(false)
const error = ref('')
const showSuccessModal = ref(false)

const signupForm = ref({
  pseudo: '',
  password: '',
  confirm: ''
})

const loginForm = ref({
  pseudo: '',
  password: ''
})

async function handleSignup() {
  error.value = ''

  // Validation
  if (!signupForm.value.pseudo.trim()) {
    error.value = 'Rentre un pseudo'
    return
  }
  if (signupForm.value.password.length < 3) {
    error.value = 'Le mot de passe doit faire au moins 3 caractères'
    return
  }
  if (signupForm.value.password !== signupForm.value.confirm) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }

  loading.value = true

  try {
    const pseudo = signupForm.value.pseudo.trim()
    const pwd = signupForm.value.password.trim()
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Vérifier si le pseudo existe déjà
    const { data: existing, error: checkError } = await supabase
      .from('player_sessions')
      .select('id')
      .eq('pseudo', pseudo)
      .single()

    if (existing) {
      error.value = 'Ce pseudo existe déjà. Choisis-en un autre.'
      loading.value = false
      return
    }

    // Créer le compte
    const { data, error: insertError } = await supabase
      .from('player_sessions')
      .insert([
        {
          pseudo: pseudo,
          code: newCode,
          session_id: sessionId,
          password: pwd // À hasher en production !
        }
      ])
      .select()
      .single()

    if (insertError) throw insertError

      // Afficher le message de succès et revenir au menu
    showSuccessModal.value = true

    // Réinitialiser le formulaire
    signupForm.value = { pseudo: '', password: '', confirm: '' }
  } catch (err) {
    error.value = 'Erreur : ' + (err.message || String(err))
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  error.value = ''

  if (!loginForm.value.pseudo.trim()) {
    error.value = 'Rentre ton pseudo'
    return
  }
  if (!loginForm.value.password) {
    error.value = 'Rentre ton mot de passe'
    return
  }

  loading.value = true

  try {
    const pseudo = loginForm.value.pseudo.trim()
    const pwd = loginForm.value.password

    // Chercher le joueur
    const { data, error: queryError } = await supabase
      .from('player_sessions')
      .select('*')
      .eq('pseudo', pseudo)
      .single()

    if (queryError && queryError.code !== 'PGRST116') throw queryError

    if (!data) {
      error.value = 'Pseudo ou mot de passe incorrect'
      loading.value = false
      return
    }

    // Vérifier le mot de passe
    if (data.password !== pwd) {
      error.value = 'Pseudo ou mot de passe incorrect'
      loading.value = false
      return
    }

    // Succès : sauvegarder et rediriger
    localStorage.setItem('nick', pseudo)
    localStorage.setItem('playerCode', data.code)
    localStorage.setItem('playerId', data.id)

    router.push({ name: 'Scene', query: { nick: pseudo } })
  } catch (err) {
    error.value = 'Erreur : ' + (err.message || String(err))
  } finally {
    loading.value = false
  }
}

function closeSuccessModal() {
  showSuccessModal.value = false
  mode.value = 'choice'
}
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: flex-start; /* start at top so content can scroll */
  justify-content: center;
  min-height: 100vh;
  background-color: rgb(4, 32, 147);
  font-family: 'Parchment MF', fantasy;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto; /* allow scrolling when content is taller than viewport */
}

.auth-choice,
.auth-form {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  max-width: 500px;
  width: 100%;
}

.auth-choice h1 {
  font-size: 36px;
  margin: 0 0 8px 0;
  color: rgb(4, 32, 147);
  text-align: center;
  line-height: 1.05;
}

.subtitle {
  font-size: 18px;
  color: #666;
  margin: 0 0 28px 0;
  text-align: center;
}

.choice-buttons {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.auth-form h2 {
  font-size: 24px;
  margin: 0 0 30px 0;
  color: rgb(4, 32, 147);
}

.btn-back {
  background: none;
  border: none;
  color: rgb(4, 32, 147);
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 20px;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-back:hover {
  opacity: 0.7;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.form-group label {
  font-weight: 600;
  color: rgb(4, 32, 147);
  margin-bottom: 8px;
  font-size: 14px;
}

.form-group input {
  align-items: center;
  appearance: none;
  background-color: #FCFCFD;
  border-radius: 4px;
  border-width: 0;
  box-shadow: rgba(45, 35, 66, 0.4) 0 2px 4px,rgba(45, 35, 66, 0.3) 0 7px 13px -3px,#D6D6E7 0 -3px 0 inset;
  box-sizing: border-box;
  color: #36395A;
  display: inline-flex;
  font-family: "JetBrains Mono",monospace;
  height: 48px;
  justify-content: center;
  padding-left: 16px;
  padding-right: 16px;
  font-size: 13px;
  transition: box-shadow 0.15s, transform 0.15s;
}

.form-group input:focus {
  outline: none;
  box-shadow: rgba(45, 35, 66, 0.4) 0 4px 8px, rgba(45, 35, 66, 0.3) 0 7px 13px -3px, #D6D6E7 0 -3px 0 inset;
  transform: translateY(-2px);
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
}

.btn {
  align-items: center;
  appearance: none;
  background-color: #FCFCFD;
  border-radius: 4px;
  border-width: 0;
  box-shadow: rgba(45, 35, 66, 0.4) 0 2px 4px,rgba(45, 35, 66, 0.3) 0 7px 13px -3px,#D6D6E7 0 -3px 0 inset;
  box-sizing: border-box;
  color: #36395A;
  cursor: pointer;
  display: inline-flex;
  font-family: "JetBrains Mono",monospace;
  height: 48px;
  justify-content: center;
  padding-left: 16px;
  padding-right: 16px;
  text-align: center;
  text-decoration: none;
  transition: box-shadow .15s,transform .15s;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  white-space: nowrap;
  will-change: box-shadow,transform;
  font-size: 18px;
  border: none;
  width: 100%;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:focus {
  box-shadow: #D6D6E7 0 0 0 1.5px inset, rgba(45, 35, 66, 0.4) 0 2px 4px, rgba(45, 35, 66, 0.3) 0 7px 13px -3px, #D6D6E7 0 -3px 0 inset;
}

.btn:hover:not(:disabled) {
  box-shadow: rgba(45, 35, 66, 0.4) 0 4px 8px, rgba(45, 35, 66, 0.3) 0 7px 13px -3px, #D6D6E7 0 -3px 0 inset;
  transform: translateY(-2px);
}

.btn:active:not(:disabled) {
  box-shadow: #D6D6E7 0 3px 7px inset;
  transform: translateY(2px);
}

.btn-primary {
  background-color: #FCFCFD;
  color: #36395A;
}

.btn-secondary {
  background-color: #FCFCFD;
  color: #36395A;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  padding: 40px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-content h3 {
  font-size: 22px;
  margin: 0 0 20px 0;
  color: rgb(4, 32, 147);
  font-family: 'Parchment MF', fantasy;
}

.modal-content p {
  font-size: 16px;
  color: #333;
  margin: 0 0 30px 0;
  font-family: 'Parchment MF', fantasy;
}

@media (max-width: 480px) {
  .auth-choice,
  .auth-form {
    padding: 30px 20px;
  }

  .auth-choice h1 {
    font-size: 24px;
  }

  .auth-form h2 {
    font-size: 20px;
  }

  .form-group input,
  .btn {
    height: 44px;
    font-size: 14px;
    padding-left: 12px;
    padding-right: 12px;
  }
}

.logo {
  display: block;
  width: 100%;
  margin: 0;
  padding: 18px 0; /* vertical padding to give breathing room */
  background-color: rgb(4, 32, 147);
  box-shadow: none;
  border-radius: 0; /* full-width bar, no rounded corners */
}

.logo img {
  max-width: 180px;
  width: auto;
  height: auto;
  display: block;
  margin: 0 auto;
  background: none !important;
  box-shadow: none !important;
  border: none !important;
}

@media (max-width: 480px) {
  .logo img {
    max-width: 120px;
  }

  .auth-page {
    padding-top: 24px;
  }

  .auth-choice h1 {
    font-size: 24px;
  }

  .subtitle {
    font-size: 14px;
    margin-bottom: 18px;
  }
}

</style>
