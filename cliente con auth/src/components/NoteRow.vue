<template>
  <div class="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-all border border-gray-100 hover:border-indigo-200">
    <!-- Título -->
    <h3 class="text-xl font-bold text-gray-900 mb-2 truncate">{{ note.noteId || 'Sin ID' }}</h3>
    
    <!-- Texto nota -->
    <p class="text-gray-700 mb-4 line-clamp-3 leading-relaxed">{{ note.text }}</p>
    
    <!-- Traducción (post-proceso) -->
    <div v-if="note.translation" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
      <strong class="text-sm text-green-800 block mb-1">Traducción:</strong>
      <span class="text-green-900 text-sm">{{ note.translation }}</span>
    </div>
    
    <!-- Audio MP3 (post-proceso Polly/S3) -->
    <AudioPlayer v-if="note.audioUrl" :url="note.audioUrl" />
    
    <!-- Botones acciones -->
    <div class="flex gap-2 pt-4 border-t border-gray-100">
      <button
        @click="$emit('edit', note)"
        class="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        :disabled="isProcessing"
      >
        Editar
      </button>
      
      <button
        @click="$emit('delete', note.noteId)"
        class="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
        :disabled="isProcessing"
      >
        Borrar
      </button>
      
      <button
        @click="$emit('process', note.noteId)"
        class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        :disabled="isProcessing || note.s3Url"
      >
        {{ isProcessing ? 'Procesando...' : (note.s3Url ? '✅ Listo' : 'Procesar') }}
      </button>
    </div>
    
    <!-- Indicador procesando -->
    <div v-if="isProcessing" class="mt-2 flex items-center text-sm text-indigo-600">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
      Generando audio y traducción...
    </div>
  </div>
</template>

<script setup>
import AudioPlayer from './AudioPlayer.vue';  

defineProps({
  note: Object,
  isProcessing: Boolean
});
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
