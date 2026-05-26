<template>
  <div class="absolute left-[68px] top-3 z-[500] max-w-[360px] rounded-xl border border-[#d8dee8] bg-white px-3 py-2 shadow-lg">
    <p class="text-[11px] font-black text-[#102372]">
      {{ helperTitle }}
    </p>

    <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
      {{ helperText }}
    </p>

    <div
      v-if="drawMode && !editingDraft"
      class="mt-3 grid gap-2 border-t border-[#edf0f5] pt-3"
    >
      <label class="block">
        <span class="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
          Nombre
        </span>

        <input
          :value="draftGeofenceForm.name"
          type="text"
          placeholder="Nombre de la geocerca"
          class="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#102372]"
          @input="$emit('update-draft-field', 'name', $event.target.value)"
        />
      </label>

      <div class="grid grid-cols-2 gap-2">
        <label class="block">
          <span class="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            Borde
          </span>

          <input
            :value="draftGeofenceForm.strokeColor"
            type="color"
            class="h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
            @input="$emit('update-draft-field', 'strokeColor', $event.target.value)"
          />
        </label>

        <label
          v-if="drawMode !== 'route'"
          class="block"
        >
          <span class="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            Relleno
          </span>

          <input
            :value="draftGeofenceForm.fillColor"
            type="color"
            class="h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
            @input="$emit('update-draft-field', 'fillColor', $event.target.value)"
          />
        </label>

        <div
          v-else
          class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <span class="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            Tipo
          </span>

          <p class="mt-1 text-[11px] font-black text-[#102372]">
            Ruta
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 rounded-lg bg-[#f8fafc] px-3 py-2">
        <div class="min-w-0">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            Vista previa
          </p>

          <p class="mt-0.5 truncate text-[11px] font-black text-slate-700">
            {{ draftGeofencePreviewName }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <span
            class="h-5 w-5 rounded-full border border-slate-200"
            :style="{ backgroundColor: draftGeofenceForm.strokeColor }"
            title="Color de borde"
          ></span>

          <span
            v-if="drawMode !== 'route'"
            class="h-5 w-5 rounded-full border border-slate-200"
            :style="{ backgroundColor: draftGeofenceForm.fillColor }"
            title="Color de relleno"
          ></span>
        </div>
      </div>
    </div>

    <div
      v-if="editingDraft"
      class="mt-3 grid gap-2 border-t border-[#edf0f5] pt-3"
    >
      <label class="block">
        <span class="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
          Nombre
        </span>

        <input
          :value="editingDraft.name"
          type="text"
          placeholder="Nombre de la geocerca"
          class="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#102372]"
          @change="$emit('update-editing-meta', 'name', $event.target.value)"
          @keydown.enter.prevent="$event.target.blur()"
        />
      </label>

      <div class="grid grid-cols-2 gap-2">
        <label class="block">
          <span class="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            Borde
          </span>

          <input
            :value="editingStrokeColor"
            type="color"
            class="h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
            @change="$emit('update-editing-meta', 'strokeColor', $event.target.value)"
          />
        </label>

        <label
          v-if="editingDraft.type !== 'route'"
          class="block"
        >
          <span class="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            Relleno
          </span>

          <input
            :value="editingFillColor"
            type="color"
            class="h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
            @change="$emit('update-editing-meta', 'fillColor', $event.target.value)"
          />
        </label>

        <div
          v-else
          class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <span class="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            Tipo
          </span>

          <p class="mt-1 text-[11px] font-black text-[#102372]">
            Ruta
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 rounded-lg bg-[#f8fafc] px-3 py-2">
        <div class="min-w-0">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            Vista previa
          </p>

          <p class="mt-0.5 truncate text-[11px] font-black text-slate-700">
            {{ editingPreviewName }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <span
            class="h-5 w-5 rounded-full border border-slate-200"
            :style="{ backgroundColor: editingStrokeColor }"
            title="Color de borde"
          ></span>

          <span
            v-if="editingDraft.type !== 'route'"
            class="h-5 w-5 rounded-full border border-slate-200"
            :style="{ backgroundColor: editingFillColor }"
            title="Color de relleno"
          ></span>
        </div>
      </div>
    </div>

    <div
      v-if="editingDraft?.type === 'polygon' || editingDraft?.type === 'route'"
      class="mt-2 flex flex-wrap gap-2"
    >
      <button
        type="button"
        class="cursor-pointer rounded-md bg-[#eef3ff] px-2 py-1 text-[10px] font-black text-[#102372] transition hover:bg-[#dbe6ff]"
        :class="editAddPoint ? 'bg-[#FF6600] text-white hover:bg-[#FF6600]' : ''"
        @click="$emit('update-edit-add-point', !editAddPoint)"
      >
        + Punto
      </button>

      <button
        type="button"
        class="cursor-pointer rounded-md bg-red-50 px-2 py-1 text-[10px] font-black text-red-600 transition hover:bg-red-100"
        :disabled="!canRemoveLastEditPoint"
        :class="!canRemoveLastEditPoint ? 'cursor-not-allowed opacity-50' : ''"
        @click="$emit('remove-last-edit-point')"
      >
        Quitar último
      </button>

      <button
        type="button"
        class="cursor-pointer rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white transition hover:bg-[#0c1b59]"
        @click="$emit('stop-editing')"
      >
        Listo
      </button>
    </div>

    <div
      v-if="editingDraft?.type === 'circle'"
      class="mt-2 flex gap-2"
    >
      <button
        type="button"
        class="cursor-pointer rounded-md bg-[#102372] px-2 py-1 text-[10px] font-black text-white transition hover:bg-[#0c1b59]"
        @click="$emit('stop-editing')"
      >
        Listo
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  drawMode: {
    type: String,
    default: null,
  },
  editingDraft: {
    type: Object,
    default: null,
  },
  helperTitle: {
    type: String,
    default: "",
  },
  helperText: {
    type: String,
    default: "",
  },
  draftGeofenceForm: {
    type: Object,
    required: true,
  },
  draftGeofencePreviewName: {
    type: String,
    default: "",
  },
  editAddPoint: {
    type: Boolean,
    default: false,
  },
  editingStrokeColor: {
    type: String,
    default: "#FF6600",
  },
  editingFillColor: {
    type: String,
    default: "#FF6600",
  },
  editingPreviewName: {
    type: String,
    default: "Geocerca sin nombre",
  },
  canRemoveLastEditPoint: {
    type: Boolean,
    default: false,
  },
})

defineEmits([
  "update-draft-field",
  "update-editing-meta",
  "update-edit-add-point",
  "remove-last-edit-point",
  "stop-editing",
])
</script>