<template>
  <div class="flex items-center gap-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg h-12">
    <audio 
      ref="audio" 
      :src="url" 
      controls 
      preload="metadata"
      @error="isExpired = true"
      @loadedmetadata="isExpired = false"
      class="flex-1 h-10 rounded bg-emerald-100 border border-emerald-200 shadow-sm"
    />
    <span v-if="isExpired" class="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded whitespace-nowrap">
      🔴 Caducado
    </span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({ url: String });
const audio = ref(null);
const isExpired = ref(false);

onMounted(() => {
  if (audio.value?.networkState === 3) isExpired.value = true;
});
</script>
