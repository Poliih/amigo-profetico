<template>
  <div class="page-container">
    <div class="card">
      
      <div class="header">
        <div class="icon-bg">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="header-icon">
            <path d="M11.25 4.53l-6.72 2.4c-.65.23-1.03.95-.83 1.6l3.32 10.64c.2.65.9.99 1.55.76l6.72-2.4c.65-.23 1.03-.95.83-1.6l-3.32-10.64c-.2-.65-.9-.99-1.55-.76zm7.23 2.58l-2.09.74.88 2.83 2.09-.74c.65-.23.99-.95.76-1.6l-.04-.13c-.23-.65-.95-1.03-1.6-.8zM4.12 7.84l1.21-.43-.88-2.83-1.21.43c-.65.23-.99.95-.76 1.6l.04.13c.23.65.95 1.03 1.6.8z"/>
          </svg>
        </div>
        <h2>Sorteio</h2>
        <p class="subtitle">Descubra quem você tirou!</p>
      </div>

      <transition name="slide-fade" mode="out-in">
        
        <form v-if="!resultado" @submit.prevent="sortear" key="form">
          
          <div class="input-group">
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input 
                v-model="nome" 
                type="text" 
                placeholder="Seu nome" 
                required 
              />
            </div>
          </div>

          <div class="input-group">
            <div class="input-wrapper">
              <span class="input-icon">📱</span>
              <input 
                :value="telefone"
                @input="onPhoneInput"
                type="tel" 
                placeholder="(00) 00000-0000" 
                maxlength="15"
                required 
              />
            </div>
          </div>

          <div class="input-group">
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input 
                v-model="codigo" 
                type="password" 
                placeholder="Código" 
                required 
              />
            </div>
          </div>

          <button type="submit" :disabled="loading" class="action-btn">
            <span v-if="loading" class="loader"></span>
            <span v-else>🎲 Ver meu Papelzinho</span>
          </button>
        </form>

        <div v-else class="result-container" key="result">
          <div class="confetti-bg">🎉</div>
          
          <div class="ticket">
            <span class="ticket-label">SEU AMIGO SECRETO É:</span>
            
            <div class="winner-reveal">
              <div 
                class="winner-avatar" 
                :class="{ 'has-photo': resultado.foto }"
                @click="abrirFoto"
              >
                <img v-if="resultado.foto" :src="resultado.foto" alt="Foto" />
                <span v-else>{{ getInitials(resultado.nome) }}</span>
                
                <div v-if="resultado.foto" class="zoom-icon">🔍</div>
              </div>

              <h3 class="winner-name">{{ resultado.nome }}</h3>
            </div>

            <p class="ticket-info">Tire um print! Esse resultado é definitivo.</p>
            
            <div class="security-hash">
               Comprovante: #{{ resultado.hash?.substring(0, 8) }}
            </div>
          </div>

          <button @click="reset" class="reset-btn">
            🔙 Voltar / Sair
          </button>
        </div>

      </transition>

    </div>

    <transition name="modal">
      <div v-if="modalOpen" class="modal-overlay" @click="modalOpen = false">
        <div class="modal-content">
          <img :src="resultado.foto" class="modal-img" />
          
          <button class="modal-close" @click="modalOpen = false">✕</button>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref } from "vue";

const nome = ref("");
const telefone = ref("");
const codigo = ref("");
const resultado = ref(null);
const loading = ref(false);
const modalOpen = ref(false); 

function onPhoneInput(e) {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/^(\d{2})/g, "($1) ");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  telefone.value = v;
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function abrirFoto() {
  if (resultado.value && resultado.value.foto) {
    modalOpen.value = true;
  }
}

async function sortear() {
  if (loading.value) return;
  loading.value = true;

  try {
    const res = await fetch("http://localhost:3000/api/sortear", {
      method: "POST",
      body: JSON.stringify({
        nome: nome.value,
        telefone: telefone.value.replace(/\D/g, ""),
        codigo: codigo.value,
      }),
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
      const erro = await res.json();
      if (res.status === 400 || res.status === 403 || res.status === 409) {
         throw new Error(erro.error);
      }
      throw new Error("Erro de conexão.");
    }
    
    resultado.value = await res.json();

  } catch (err) {
    console.error(err);
    alert(err.message); 
  } finally {
    loading.value = false;
  }
}

function reset() {
  resultado.value = null;
  codigo.value = "";
  nome.value = "";
  telefone.value = "";
  modalOpen.value = false;
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 20px;
}

.card {
  background: #ffffff;
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.header { margin-bottom: 2rem; }

.icon-bg {
  width: 60px;
  height: 60px;
  background: #ede9fe;
  color: #7c3aed;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.header-icon { width: 32px; height: 32px; }

h2 { margin: 0; color: #1f2937; font-size: 1.8rem; font-weight: 800; }
.subtitle { color: #6b7280; margin-top: 0.5rem; font-size: 0.95rem; }

.input-group { margin-bottom: 1.2rem; text-align: left; }

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  font-size: 1.1rem;
  opacity: 0.6;
  z-index: 10;
}

input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  background: #f9fafb;
  transition: all 0.2s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #8b5cf6;
  background: white;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
}

.action-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(to right, #7c3aed, #6d28d9);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  margin-top: 1rem;
}

.action-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(124, 58, 237, 0.4); }
.action-btn:active { transform: scale(0.98); }
.action-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.result-container {
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.ticket {
  background: #f5f3ff;
  border: 2px dashed #a78bfa;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  position: relative;
}

.ticket-label {
  display: block;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #7c3aed;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.winner-reveal {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.winner-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f472b6, #db2777);
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border: 4px solid white;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.winner-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.winner-avatar.has-photo {
  cursor: pointer;
}

.winner-avatar.has-photo:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

.zoom-icon {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.winner-avatar.has-photo:hover .zoom-icon {
  opacity: 1;
}

.winner-name {
  font-size: 1.8rem;
  color: #1f2937;
  margin: 0;
  font-weight: 800;
}

.ticket-info {
  margin-top: 1.5rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.security-hash {
  margin-top: 10px;
  font-size: 0.7rem;
  color: #9ca3af;
  font-family: monospace;
}

.reset-btn {
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.reset-btn:hover { background: #f3f4f6; color: #374151; }

.loader {
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.slide-fade-enter-active { transition: all 0.4s ease-out; }
.slide-fade-leave-active { transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(20px); opacity: 0; }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px); 
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90vh;
  animation: popIn 0.3s ease-out;
}

.modal-img {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  border: 4px solid white;
}

.modal-close {
  position: absolute;
  top: -20px;
  right: -20px;
  background: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  color: #1f2937;
  transition: transform 0.2s;
}

.modal-close:hover {
  transform: scale(1.1);
  background: #f3f4f6;
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>