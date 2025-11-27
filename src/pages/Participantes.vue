<template>
  <div class="page-container">
    <div class="card">
      <div class="header">
        <h2>Participantes</h2>
        <span class="count-badge" v-if="!loading">{{ participantes.length }}</span>
      </div>

      <div v-if="loading" class="list-container">
        <div v-for="i in 3" :key="i" class="skeleton-item">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-info">
            <div class="skeleton-text w-50"></div>
            <div class="skeleton-text w-30"></div>
          </div>
        </div>
      </div>

      <div v-else-if="participantes.length === 0" class="empty-state">
        <div class="empty-icon">📂</div>
        <p>Nenhum participante encontrado.</p>
      </div>

      <ul v-else class="list-container">
        <li 
          v-for="p in participantes" 
          :key="p.id" 
          class="list-item clickable"
          @click="abrirDetalhes(p)"
        >
          <div class="avatar-wrapper">
            <img v-if="p.foto" :src="p.foto" alt="Foto" class="avatar-img" />
            <div v-else class="avatar-placeholder">
              {{ getInitials(p.nome) }}
            </div>
          </div>

          <div class="info">
            <strong>{{ p.nome }}</strong>
            <span class="phone-text">
              <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              {{ formatPhone(p.telefone) }}
            </span>
          </div>
        </li>
      </ul>
    </div>

    <transition name="modal">
      <div v-if="selectedParticipant" class="modal-overlay" @click.self="fecharDetalhes">
        <div class="modal-card">
          
          <button class="close-btn" @click="fecharDetalhes">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          <div class="modal-avatar-container">
            <img 
              v-if="selectedParticipant.foto" 
              :src="selectedParticipant.foto" 
              class="modal-avatar-img"
            />
            <div v-else class="modal-avatar-placeholder">
              {{ getInitials(selectedParticipant.nome) }}
            </div>
          </div>

          <h3 class="modal-name">{{ selectedParticipant.nome }}</h3>
          <p class="modal-phone">{{ formatPhone(selectedParticipant.telefone) }}</p>

          <a 
            :href="getWhatsappLink(selectedParticipant.telefone)" 
            target="_blank" 
            class="whatsapp-btn"
          >
            <svg class="wa-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.16C10.58 20.16 9.11 19.76 7.85 19L7.55 18.82L4.43 19.64L5.26 16.6L5.07 16.29C4.24 14.96 3.8 13.45 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.05 20.16Z"/>
            </svg>
            Conversar no WhatsApp
          </a>

        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const participantes = ref([]);
const loading = ref(true);
const selectedParticipant = ref(null); 

function abrirDetalhes(p) {
  selectedParticipant.value = p;
}

function fecharDetalhes() {
  selectedParticipant.value = null;
}

function getWhatsappLink(phone) {
  if (!phone) return "#";
  const cleanPhone = phone.toString().replace(/\D/g, ""); 
  return `https://wa.me/55${cleanPhone}`;
}

function formatPhone(phone) {
  if (!phone) return "---";
  const v = phone.toString().replace(/\D/g, "");
  if (v.length === 11) {
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  }
  return phone; 
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

onMounted(async () => {
  try {
    const res = await fetch("http://localhost:3000/api/participantes");
    participantes.value = await res.json();
  } catch(err) {
    console.error("Erro:", err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  display: flex;
  
  align-items: flex-start; 
  justify-content: center;
  
  background: linear-gradient(135deg, #eef2f7 0%, #dce4f3 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  
  padding: 100px 20px 40px 20px; 
}

.card {
  background: #ffffff;
  width: 100%;
  max-width: 480px;
  padding: 2rem;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.count-badge {
  background: #f1f5f9;
  color: #64748b;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

.list-container {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.list-item.clickable {
  cursor: pointer;
}

.list-item.clickable:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
  transform: translateX(5px); 
}

.avatar-wrapper {
  margin-right: 16px;
  flex-shrink: 0;
}

.avatar-img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.avatar-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #818cf8, #6366f1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.info {
  display: flex;
  flex-direction: column;
}

.info strong {
  font-size: 1rem;
  color: #334155;
  margin-bottom: 3px;
  font-weight: 600;
}

.phone-text {
  font-size: 0.85rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.icon-svg {
  width: 14px;
  height: 14px;
  color: #cbd5e1;
}

.empty-state {
  text-align: center;
  padding: 2rem 0;
  color: #94a3b8;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.4;
  filter: grayscale(1);
}

.skeleton-item { display: flex; align-items: center; padding: 12px; margin-bottom: 8px; }
.skeleton-avatar { width: 50px; height: 50px; border-radius: 50%; background: #f1f5f9; margin-right: 16px; animation: pulse 1.5s infinite; }
.skeleton-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.skeleton-text { height: 12px; background: #f1f5f9; border-radius: 4px; animation: pulse 1.5s infinite; }
.w-50 { width: 50%; }
.w-30 { width: 30%; }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6); 
  backdrop-filter: blur(4px); 
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-card {
  background: white;
  width: 100%;
  max-width: 320px;
  border-radius: 24px;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: popUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popUp {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f1f5f9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #ef4444; 
}

.modal-avatar-container {
  margin-bottom: 1rem;
}

.modal-avatar-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.modal-avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #818cf8, #6366f1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  border: 4px solid white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.modal-name {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
  text-align: center;
}

.modal-phone {
  margin: 4px 0 24px 0;
  color: #64748b;
  font-size: 1rem;
}

.whatsapp-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #25D366;
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 600;
  width: 100%;
  box-sizing: border-box;
  transition: transform 0.2s, box-shadow 0.2s;
}

.whatsapp-btn:hover {
  background-color: #22c55e;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(37, 211, 102, 0.3);
}

.wa-icon {
  width: 20px;
  height: 20px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>