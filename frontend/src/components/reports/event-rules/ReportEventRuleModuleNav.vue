<template>
  <aside
    class="shrink-0 border-b border-slate-200/80 bg-white p-2 md:border-b-0 md:border-r md:border-slate-200/80"
  >
    <div class="grid grid-cols-2 gap-1 md:grid-cols-1">
      <button
        v-for="module in modules"
        :key="module.id"
        type="button"
        class="h-9 rounded-lg border px-3 text-left text-[10px] font-black uppercase tracking-[0.06em] transition"
        :class="
          activeModule === module.id
            ? 'border-[#102372] bg-[#102372] text-white'
            : 'border-[#edf1f5] bg-white text-[#102372] hover:border-[#ff6600] hover:text-[#ff6600]'
        "
        @click="emit('select', module.id)"
      >
        {{ module.label }}
      </button>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  modules: {
    type: Array,
    default: () => [],
  },
  activeModule: {
    type: String,
    default: "",
  },
})

const emit = defineEmits(["select"])
</script>
