<template>
  <section>
    <div class="flex items-center justify-between gap-3">
      <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6600]">
        Alcance por grupo
      </p>

      <span class="rounded-md bg-[#eef2f7] px-2 py-1 text-[10px] font-black text-[#102372]">
        {{ groupScopeLabel }}
      </span>
    </div>

    <div v-if="availableGroups.length" class="mt-3 rounded-lg border border-[#edf1f5] bg-[#f8fafc]">
      <div
        class="grid gap-2 border-b border-[#edf1f5] p-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
      >
        <label class="min-w-0">
          <span class="sr-only">Buscar grupo</span>

          <input
            :value="groupSearch"
            type="search"
            class="h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-bold text-[#102372] outline-none placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
            placeholder="Buscar grupo o empresa..."
            @input="emit('update-group-search', $event.target.value)"
          />
        </label>

        <div class="flex flex-wrap gap-1.5">
          <button
            type="button"
            class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[9px] font-black uppercase tracking-[0.06em] text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="draft.id === 'all' || !filteredGroups.length"
            @click="emit('select-filtered-groups')"
          >
            Seleccionar visibles
          </button>

          <button
            type="button"
            class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[9px] font-black uppercase tracking-[0.06em] text-slate-500 transition hover:border-[#ff6600] hover:text-[#ff6600] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="draft.id === 'all' || !draft.groupIds.length"
            @click="emit('clear-selected-groups')"
          >
            Todos
          </button>
        </div>
      </div>

      <div class="max-h-[300px] overflow-auto p-2">
        <div v-if="groupSections.length" class="grid gap-2">
          <section
            v-for="section in groupSections"
            :key="section.companyKey"
            class="rounded-lg border border-[#edf1f5] bg-white"
          >
            <header class="flex items-center justify-between gap-2 bg-[#102372] px-3 py-2">
              <p class="truncate text-[10px] font-black uppercase tracking-[0.08em] text-white">
                {{ section.companyName }}
              </p>

              <button
                type="button"
                class="shrink-0 rounded-md bg-white/10 px-2 py-1 text-[9px] font-black text-white/70 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="draft.id === 'all'"
                @click="emit('toggle-company-groups', section.groups)"
              >
                {{ areAllCompanyGroupsSelected(section.groups) ? "Quitar" : "Empresa" }}
              </button>
            </header>

            <div class="grid gap-1.5 p-2 sm:grid-cols-2 xl:grid-cols-3">
              <label
                v-for="group in section.groups"
                :key="group.id"
                class="flex min-w-0 cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 transition"
                :class="
                  isGroupSelected(group.id)
                    ? 'border-[#102372] bg-[#eef3ff]'
                    : 'border-[#edf1f5] bg-[#f8fafc] hover:border-[#ff6600]/50'
                "
              >
                <input
                  type="checkbox"
                  class="h-3.5 w-3.5 shrink-0 accent-[#ff6600]"
                  :checked="isGroupSelected(group.id)"
                  :disabled="draft.id === 'all'"
                  @change="emit('toggle-group', group.id)"
                />

                <span class="min-w-0 truncate text-[10px] font-black text-[#102372]">
                  {{ group.name }}
                </span>
              </label>
            </div>
          </section>
        </div>

        <div v-else class="rounded-lg bg-white px-3 py-5 text-center">
          <p class="text-[11px] font-black text-[#102372]">Sin grupos encontrados</p>
        </div>
      </div>
    </div>

    <div v-else class="mt-3 rounded-lg bg-[#eef2f7] px-3 py-2">
      <p class="text-[11px] font-bold text-slate-500">
        No hay grupos configurados. La regla se aplica a todos.
      </p>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  draft: {
    type: Object,
    required: true,
  },
  groupScopeLabel: {
    type: String,
    default: "",
  },
  availableGroups: {
    type: Array,
    default: () => [],
  },
  filteredGroups: {
    type: Array,
    default: () => [],
  },
  groupSections: {
    type: Array,
    default: () => [],
  },
  groupSearch: {
    type: String,
    default: "",
  },
})

const emit = defineEmits([
  "update-group-search",
  "select-filtered-groups",
  "clear-selected-groups",
  "toggle-company-groups",
  "toggle-group",
])

const isGroupSelected = (groupId) => {
  return props.draft.groupIds.includes(String(groupId))
}

const areAllCompanyGroupsSelected = (groups = []) => {
  return groups.every((group) => isGroupSelected(group.id))
}
</script>
