<template>
  <section class="grid gap-3 sm:grid-cols-2">
    <label class="block sm:col-span-2">
      <span class="text-[10px] font-black uppercase text-slate-400">Nombre</span>
      <input
        :value="draft.label"
        type="text"
        class="mt-1 h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
        placeholder="Velocidad sobre limite"
        @input="emit('update-field', 'label', $event.target.value)"
      />
    </label>

    <label class="block sm:col-span-2">
      <span class="text-[10px] font-black uppercase text-slate-400">Descripcion</span>
      <textarea
        :value="draft.description"
        rows="4"
        class="mt-1 w-full resize-none rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[12px] font-semibold leading-relaxed text-[#102372] outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
        placeholder="Eventos que deben aparecer en el reporte."
        @input="emit('update-field', 'description', $event.target.value)"
      />
    </label>

    <label
      class="flex items-center gap-2 rounded-lg border border-[#edf1f5] bg-[#f8fafc] px-3 py-2"
    >
      <input
        :checked="draft.active"
        type="checkbox"
        class="h-3.5 w-3.5 accent-[#ff6600]"
        :disabled="draft.id === 'all'"
        @change="emit('update-field', 'active', $event.target.checked)"
      />

      <span class="text-[11px] font-black text-[#102372]">Activa</span>
    </label>

    <div class="rounded-lg border border-[#edf1f5] bg-[#f8fafc] px-3 py-2">
      <p class="text-[10px] font-black uppercase text-slate-400">Tipo</p>
      <p class="mt-0.5 text-[11px] font-black text-[#102372]">
        {{ draft.source === "custom" ? "Regla propia" : "Regla base" }}
      </p>
    </div>
  </section>
</template>

<script setup>
defineProps({
  draft: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["update-field"])
</script>
