<template>
  <div class="relative min-w-0 flex-1">
    <input
      :value="searchTerm"
      type="text"
      class="h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 pr-8 text-[11px] font-black text-[#102372] outline-none transition placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      :disabled="!applications.length"
      :placeholder="applications.length ? 'Agregar empresa' : 'Sin empresas disponibles'"
      @focus="openOptions"
      @input="handleSearchInput"
      @blur="handleBlur"
      @keydown.escape="closeOptions"
    />

    <span
      class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"
    >
      ▾
    </span>

    <div
      v-if="isOpen"
      class="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-56 overflow-auto rounded-lg border border-[#d8dee8] bg-white shadow-xl"
    >
      <button
        v-for="application in filteredApplications"
        :key="application.id"
        type="button"
        class="block w-full px-3 py-2 text-left transition hover:bg-[#f8fafc]"
        :class="application.id === modelValue ? 'bg-[#eef3ff]' : 'bg-white'"
        @mousedown.prevent="selectApplication(application)"
      >
        <span class="block truncate text-[11px] font-black text-[#102372]">
          {{ application.name }}
        </span>
        <span class="mt-0.5 block truncate text-[10px] font-semibold text-slate-500">
          {{ getCompanyName(application.companyId) }} · {{ application.assetsCount || 0 }} activos
        </span>
      </button>

      <div v-if="!filteredApplications.length" class="px-3 py-3 text-center">
        <p class="text-[11px] font-black text-slate-500">Sin resultados</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  applications: {
    type: Array,
    default: () => [],
  },
  companies: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["update:modelValue"])

const isOpen = ref(false)
const searchTerm = ref("")

const normalizedSearchTerm = computed(() => searchTerm.value.trim().toLowerCase())

const selectedApplication = computed(() => {
  return props.applications.find((application) => application.id === props.modelValue) || null
})

const companiesById = computed(() => {
  return new Map(props.companies.map((company) => [company.id, company]))
})

const filteredApplications = computed(() => {
  if (!normalizedSearchTerm.value) return props.applications

  return props.applications.filter((application) => {
    const companyName = getCompanyName(application.companyId)
    const searchableText = `${application.name} ${companyName}`.toLowerCase()

    return searchableText.includes(normalizedSearchTerm.value)
  })
})

const getCompanyName = (companyId) => {
  return companiesById.value.get(companyId)?.name || "Empresa sin nombre"
}

const openOptions = () => {
  if (!props.applications.length) return

  isOpen.value = true
}

const closeOptions = () => {
  isOpen.value = false
}

const handleSearchInput = (event) => {
  searchTerm.value = event.target.value
  isOpen.value = true

  if (selectedApplication.value?.name !== searchTerm.value) {
    emit("update:modelValue", "")
  }
}

const handleBlur = () => {
  setTimeout(() => {
    closeOptions()
  }, 100)
}

const selectApplication = (application) => {
  searchTerm.value = application.name
  emit("update:modelValue", application.id)
  closeOptions()
}

watch(
  () => props.modelValue,
  () => {
    searchTerm.value = selectedApplication.value?.name || ""
  },
  { immediate: true },
)

watch(
  () => props.applications,
  () => {
    if (!selectedApplication.value) {
      searchTerm.value = ""
      emit("update:modelValue", "")
    }
  },
)
</script>
