<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
    <header class="max-w-6xl mx-auto mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Mis Notas AWS</h1>
          <p class="text-xl text-gray-600">CRUD + Procesar con Translate/Polly/S3</p>
        </div>
        <div class="flex gap-4">
          <button
            v-if="!loggedIn"  
            @click="login"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Iniciar Sesión con Cognito
          </button>
          <button
            v-else
            @click="logout"
            class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
    
    <main v-if="isLoggedIn" class="max-w-6xl mx-auto">
      <NotesGrid />
    </main>
    
    <div v-else class="max-w-6xl mx-auto text-center py-20">
      <p class="text-2xl text-gray-500 mb-8">Por favor, inicia sesión para ver tus notas</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useNotesStore } from '@/stores/notes';  
import NotesGrid from '@/components/NotesGrid.vue';
import { login, handleCallback, isLoggedIn, logout } from '@/services/auth';  

const notesStore = useNotesStore();
const loggedIn = ref(false);

onMounted(async () => {
  loggedIn.value = isLoggedIn();  

  if (window.location.hash.includes('id_token')) {
    try {
      await handleCallback();
      console.log('Callback OK');
      loggedIn.value = isLoggedIn();  
      window.dispatchEvent(new CustomEvent('login-success'));
    } catch (error) {
      console.error(error);
    }
  }

  if (loggedIn.value) {
    await notesStore.fetchNotes();
  }
});

watch(() => isLoggedIn(), (newVal) => {
  loggedIn.value = newVal;
});

</script>