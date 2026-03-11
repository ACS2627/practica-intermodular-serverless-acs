<template>
  <div>
    <!-- Loading -->
    <div v-if="notesStore.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Error -->
    <div v-else-if="notesStore.error" class="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6">
      {{ notesStore.error }}
      <button @click="notesStore.fetchNotes" class="ml-4 underline">Reintentar</button>
    </div>

    <!-- Grid de notas -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <NoteRow
        v-for="note in notesStore.notes"
        :key="note.noteId"
        :note="note"
        :is-processing="notesStore.processingNoteId === note.noteId"
        @edit="startEdit"
        @delete="handleDelete"
        @process="handleProcess"
      />
      
      <!-- Fila vacía para nueva nota -->
      <div v-if="loggedIn" class="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group" @click="startNewNote">
        <svg class="w-12 h-12 text-gray-400 group-hover:text-indigo-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">Añadir nueva nota</h3>
        <p class="text-sm text-gray-500 mt-1">Crea tu primera nota o añade más</p>
      </div>
    </div>

    <!-- Editor/Modal (se abre con nueva/editar) -->
    <NoteEditor 
      v-if="notesStore.editingNote"
      :note="notesStore.editingNote"
      @save="handleSave"
      @cancel="notesStore.cancelEdit"
    />
  </div>
</template>

<script setup>
import { useNotesStore } from '@/stores/notes.js';
import NoteRow from './NoteRow.vue';
import NoteEditor from './NoteEditor.vue';
import { ref, onMounted, onUnmounted } from 'vue';  
import { isLoggedIn } from '@/services/auth';

const notesStore = useNotesStore();
const loggedIn = ref(false);  

const emit = defineEmits(['edit', 'delete', 'process']);

const startNewNote = () => {
  notesStore.startEdit({ text: '', title: '' }); 
};

const handleDelete = async (noteId) => {
  if (confirm('¿Borrar esta nota?')) {
    await notesStore.removeNote(noteId);
  }
};

const handleProcess = async (noteId) => {
  await notesStore.processCurrentNote(noteId);
};

const startEdit = (note) => {
  notesStore.startEdit(note);
};

const handleSave = async (noteData) => {
  if (notesStore.editingNote.noteId) {
    // Actualizar existente
    await notesStore.updateCurrentNote(notesStore.editingNote.noteId, noteData);
  } else {
    // Nueva nota
    await notesStore.addNote(noteData);
  }
  notesStore.cancelEdit();
};

const handleLoginSuccess = () => {
  loggedIn.value = isLoggedIn();
  console.log('NotesGrid login via event:', loggedIn.value);
};

onMounted(() => {
  loggedIn.value = isLoggedIn();  // Inicial
  window.addEventListener('login-success', handleLoginSuccess);
});

onUnmounted(() => {
  window.removeEventListener('login-success', handleLoginSuccess);
});

</script>