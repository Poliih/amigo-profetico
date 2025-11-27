<template>
  <div class="page-container">
    <div class="card">
      <form @submit.prevent="cadastrar">
        
        <div class="photo-upload-container">
          <div class="photo-preview" :class="{ 'error-border': errors.foto }">
            <img v-if="previewUrl" :src="previewUrl" alt="Preview da foto" />
            <span v-else class="placeholder-icon">📷</span>
          </div>
          <label for="file-upload" class="upload-btn">
            {{ previewUrl ? 'Alterar foto' : 'Adicionar foto' }}
          </label>
          <input 
            id="file-upload" 
            type="file" 
            accept="image/*" 
            @change="onFileChange" 
            class="hidden-input"
          />
        </div>

        <div class="input-group">
          <label for="nome-input">Nome Completo</label>
          <input 
            id="nome-input"
            v-model="nome" 
            type="text" 
            placeholder="Ex: Maria Oliveira" 
            :class="{ 'input-error': errors.nome }"
            @input="errors.nome = false"
          />
        </div>

        <div class="input-group">
          <label for="tel-input">Telefone</label>
          <input 
            id="tel-input"
            :value="telefone"
            @input="onPhoneInput"
            type="tel" 
            placeholder="(00) 00000-0000" 
            maxlength="15"
            :class="{ 'input-error': errors.telefone }"
          />
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          <span v-if="loading" class="loader"></span>
          <span v-else>Salvar Participante</span>
        </button>
      </form>

      <transition name="fade">
        <div v-if="ok" class="success-message">
          ✨ Participante cadastrado com sucesso!
        </div>
      </transition>

      <transition name="fade">
        <div v-if="errorMessage" class="error-message">
          ⚠️ {{ errorMessage }}
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";

const nome = ref("");
const telefone = ref("");
const ok = ref(false);
const loading = ref(false);
const errorMessage = ref("");
const errors = reactive({ nome: false, telefone: false, foto: false });

const previewUrl = ref(null);
let fotoFile = null;

function onPhoneInput(e) {
  errors.telefone = false; 
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/^(\d{2})/g, "($1) ");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  telefone.value = v;
}

function onFileChange(e) {
  errors.foto = false; 
  const file = e.target.files[0];
  if (file) {
    fotoFile = file;
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = URL.createObjectURL(file);
  }
}

function mostrarErro(msg) {
  errorMessage.value = msg;
  setTimeout(() => { errorMessage.value = "" }, 4000);
}

async function cadastrar() {
  if (loading.value) return;

  let hasError = false;
  if (!nome.value.trim()) { errors.nome = true; hasError = true; }
  
  const telLimpo = telefone.value.replace(/\D/g, "");
  if (!telLimpo || telLimpo.length < 10) { errors.telefone = true; hasError = true; }

  if (hasError) {
    mostrarErro("Preencha os campos obrigatórios.");
    return;
  }

  loading.value = true;
  ok.value = false;
  errorMessage.value = "";

  try {
    const formData = new FormData();
    formData.append("nome", nome.value);
    formData.append("telefone", telLimpo);
    if (fotoFile) formData.append("foto", fotoFile);

    const res = await fetch("http://localhost:3000/api/registrar", {
      method: "POST",
      body: formData, 
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erro desconhecido no servidor.");
    }

    ok.value = true;
    resetForm();
    setTimeout(() => { ok.value = false }, 3000);

  } catch (err) {
    console.error("Erro Front:", err);
    mostrarErro(err.message); 
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  nome.value = "";
  telefone.value = "";
  fotoFile = null;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null;
  errors.nome = false;
  errors.telefone = false;
  errors.foto = false;
}
</script>

<style scoped>

.input-error {
  border-color: #ef4444 !important;
  background-color: #fef2f2 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

.error-border {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
}

.error-message {
  margin-top: 1rem;
  padding: 12px;
  background-color: #fef2f2; 
  color: #b91c1c; 
  border: 1px solid #fecaca;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.1);
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}


.page-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2f7 0%, #dce4f3 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding: 20px;
}

.card {
  background: #ffffff;
  width: 100%;
  max-width: 420px;
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
}

.photo-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.photo-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 4px solid #ffffff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05), 0 0 0 2px #e2e8f0 inset;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 12px;
  position: relative;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-icon {
  font-size: 3rem;
  opacity: 0.3;
  filter: grayscale(1);
}

.upload-btn {
  font-size: 0.9rem;
  color: #6366f1;
  cursor: pointer;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.upload-btn:hover {
  background-color: #eef2ff;
}

.hidden-input {
  display: none;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 0.5rem;
  margin-left: 4px;
}

input[type="text"],
input[type="tel"] {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  background-color: #f8fafc;
  transition: all 0.2s ease-in-out;
  box-sizing: border-box;
}

input[type="text"]::placeholder,
input[type="tel"]::placeholder {
    color: #9ca3af;
}

input[type="text"]:focus,
input[type="tel"]:focus {
  outline: none;
  border-color: #6366f1;
  background-color: #fff;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
  margin-top: 1rem;
}

.submit-btn:hover:not(:disabled) {
  background-color: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.submit-btn:disabled {
  background: #a5b4fc;
  cursor: not-allowed;
  box-shadow: none;
}

.success-message {
  margin-top: 1.5rem;
  padding: 12px;
  background-color: #d1fae5;
  color: #065f46;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
  font-size: 0.95rem;
}

.loader {
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>