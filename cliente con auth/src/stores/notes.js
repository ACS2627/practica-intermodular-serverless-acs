import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getNotes, createNote, getNote, updateNote, deleteNote, processNote } from '@/services/api.js';
import { isLoggedIn, getIdToken } from '@/services/auth';

export const useNotesStore = defineStore('notes', () => {
  // Estado
  const notes = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const editingNote = ref(null);
  const processingNoteId = ref(null);

  // GET /notes
  const fetchNotes = async () => {
    // CAMBIO: Skip si no logueado (evita CORS 401)
    if (!isLoggedIn()) {
      notes.value = [];
      return;
    }

    try {
      loading.value = true;
      error.value = null;
      notes.value = await getNotes();  // Espera que getNotes() use Authorization header
    } catch (err) {
      error.value = err.message || 'Error cargando notas';
      console.error('Fetch notes error:', err);
    } finally {
      loading.value = false;
    }
  };

  // POST /notes
	  const addNote = async (noteData) => {
		try {
		  loading.value = true;
		  
		  await createNote(noteData);
		  
		  await fetchNotes();
		  
		  return true;
		} catch (err) {
		  error.value = 'Error creando nota';
		  console.error(err);
		  throw err;
		} finally {
		  loading.value = false;
		}
	  };

	
  // PUT /notes/{id}
	const updateCurrentNote = async (noteId, noteData) => {
	  try {
		loading.value = true;
		
		await updateNote(noteId, noteData);
		
		await fetchNotes();  // recarga
		
		editingNote.value = null;
		return noteData;
	  } catch (err) {
		error.value = 'Error actualizando nota';
		throw err;
	  } finally {
		loading.value = false;
	  }
	};
  // DELETE /notes/{id}
  const removeNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      notes.value = notes.value.filter(n => n.noteId !== noteId);
    } catch (err) {
      error.value = 'Error borrando nota';
      throw err;
    }
  };

  // POST /notes/{id}/process
  const processCurrentNote = async (noteId) => {
    try {
      processingNoteId.value = noteId;
      const processed = await processNote(noteId);
      const index = notes.value.findIndex(n => n.noteId === noteId);
      if (index !== -1) notes.value[index] = processed;
      return processed;
    } catch (err) {
      error.value = 'Error procesando (Translate/Polly/S3)';
      throw err;
    } finally {
      processingNoteId.value = null;
    }
  };

  const startEdit = (note) => {
    editingNote.value = { ...note };
  };

  const cancelEdit = () => {
    editingNote.value = null;
  };

  // Load inicial
  fetchNotes();

  return {
    notes, loading, error, editingNote, processingNoteId,
    fetchNotes, addNote, updateCurrentNote, removeNote,
    processCurrentNote, startEdit, cancelEdit
  };
});
