import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import SceneView from '../views/SceneView.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/scene', name: 'Scene', component: SceneView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
