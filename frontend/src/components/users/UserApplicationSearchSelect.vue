<template>
  <div ref="rootElement" class="relative">
    <label class="block">
      <span class="text-[10px] font-black uppercase text-slate-400"> Aplicación / empresa </span>

      <div class="relative mt-1">
        <input
          v-model="search"
          type="text"
          class="h-10 w-full rounded-xl border border-[#d8dee8] bg-white px-3 pr-9 text-[12px] font-bold text-[#102372] outline-none transition placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/10"
          placeholder="Buscar aplicación o empresa..."
          @focus="isOpen = true"
        />

        <button
          v-if="modelValue"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-base leading-none text-slate-400 transition hover:text-[#ff6600]"
          @click="clearSelection"
        >
          &times;
        </button>

        <svg
          v-else
          viewBox="0 0 24 24"
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </label>

    <div
      v-if="isOpen"
      class="absolute z-50 mt-2 max-h-[260px] w-full overflow-auto rounded-2xl border border-[#d8dee8] bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
    >
      <button
        v-for="option in filteredOptions"
        :key="option.id"
        type="button"
        class="flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-[#fff7ed]"
        :class="String(option.id) === String(modelValue) ? 'bg-[#fff7ed]' : ''"
        @click="selectOption(option)"
      >
        <span
          class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#102372]/10 text-[11px] font-black text-[#102372]"
        >
          {{ option.initials }}
        </span>

        <span class="min-w-0 flex-1">
          <span class="block truncate text-[12px] font-black text-[#102372]">
            {{ option.label }}
          </span>

          <span class="mt-0.5 block truncate text-[11px] font-semibold text-slate-500">
            {{ option.companyLabel }}
          </span>
        </span>

        <span
          v-if="String(option.id) === String(modelValue)"
          class="mt-1 rounded-full bg-[#ff6600]/10 px-2 py-1 text-[9px] font-black uppercase text-[#ff6600]"
        >
          Seleccionada
        </span>
      </button>

      <div
        v-if="!filteredOptions.length"
        class="rounded-xl border border-dashed border-[#d8dee8] bg-[#f8fafc] px-3 py-4 text-center"
      >
        <p class="text-[12px] font-black text-[#102372]">Sin resultados</p>

        <p class="mt-1 text-[11px] font-semibold text-slate-500">
          Intenta buscar por empresa o aplicación.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"

const props = defineProps({
  modelValue: {
    type: [String, Number],
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

const rootElement = ref(null)
const search = ref("")
const isOpen = ref(false)

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const getInitials = (value) => {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

const companyMap = computed(() => {
  return new Map(
    props.companies.map((company) => {
      return [String(company.id), company]
    }),
  )
})

const normalizedOptions = computed(() => {
  return props.applications.map((application) => {
    const companyId =
      application.companyId || application.empresaId || application.company?.id || ""
    const company = companyMap.value.get(String(companyId)) || application.company || null

    const label =
      application.label ||
      application.name ||
      application.applicationName ||
      application.moduleName ||
      "Aplicación sin nombre"

    const companyLabel =
      company?.name ||
      company?.razonSocial ||
      application.companyName ||
      application.empresa ||
      "Sin empresa asociada"

    return {
      ...application,
      id: application.id,
      label,
      companyLabel,
      initials: getInitials(label),
      searchText: normalizeText(`${label} ${companyLabel} ${application.id}`),
    }
  })
})

const selectedOption = computed(() => {
  return (
    normalizedOptions.value.find((option) => {
      return String(option.id) === String(props.modelValue)
    }) || null
  )
})

const filteredOptions = computed(() => {
  const term = normalizeText(search.value)

  if (!term) return normalizedOptions.value

  return normalizedOptions.value.filter((option) => {
    return option.searchText.includes(term)
  })
})

const selectOption = (option) => {
  emit("update:modelValue", option.id)
  search.value = option.label
  isOpen.value = false
}

const clearSelection = () => {
  emit("update:modelValue", "")
  search.value = ""
  isOpen.value = true
}

const handleDocumentClick = (event) => {
  if (!rootElement.value) return
  if (rootElement.value.contains(event.target)) return

  isOpen.value = false
}

watch(
  () => props.modelValue,
  () => {
    search.value = selectedOption.value?.label || ""
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener("click", handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick)
})
</script>
