<template>
  <div class="app-wrapper">
    
    <nav class="glass-nav">
      <div class="nav-logo">
        🎁 <span class="logo-text">Amigo Profético</span>
      </div>
      
      <div class="nav-links">
        <button 
          @click="page = 'lista'" 
          :class="{ active: page === 'lista' }"
        >
          Participantes
        </button>
        
        <button 
          @click="page = 'sorteio'" 
          :class="{ active: page === 'sorteio' }"
        >
          Sortear
        </button>
        
        <button 
          @click="page = 'admin'" 
          :class="{ active: page === 'admin' }"
        >
          Cadastrar
        </button>
      </div>
    </nav>

    <main class="content-area">
      <transition name="fade" mode="out-in">
        <Participantes v-if="page === 'lista'" />
        <Sorteio v-else-if="page === 'sorteio'" />
        <AdminCadastro v-else-if="page === 'admin'" />
      </transition>
    </main>

  </div>
</template>

<script setup>
import { ref } from "vue";

import AdminCadastro from "./pages/AdminCadastro.vue";
import Participantes from "./pages/Participantes.vue";
import Sorteio from "./pages/Sorteio.vue";

const page = ref("lista");
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f3f4f6; 
  -webkit-font-smoothing: antialiased;
}

.app-wrapper {
  min-height: 100vh;
  position: relative;
}

.glass-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100; 
  
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

/* LOGO */
.nav-logo {
  font-size: 1.2rem;
  font-weight: 800;
  color: #4c1d95; 
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  background: linear-gradient(135deg, #7c3aed, #db2777);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: none; 
}

@media (min-width: 600px) {
  .logo-text { display: block; }
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-links button {
  background: transparent;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-links button:hover {
  background-color: rgba(139, 92, 246, 0.1); 
  color: #7c3aed;
}

.nav-links button.active {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: white;
  box-shadow: 0 4px 10px rgba(124, 58, 237, 0.3);
}

.content-area {

  width: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px); 
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px); 
}

@media (max-width: 480px) {
  .glass-nav {
    justify-content: center;
    padding: 0 10px;
    height: 60px;
  }
  .nav-logo {
    display: none;
  }
  .nav-links button {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}
</style>