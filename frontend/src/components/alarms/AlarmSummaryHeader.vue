<template>
  <section class="flex flex-wrap items-center gap-1.5">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="inline-flex h-9 min-w-[104px] items-center justify-center gap-2 rounded-lg border px-3 text-[12px] font-black transition"
      :class="isItemSelected(item) ? selectedClass : unselectedClass"
      @click="$emit('select-summary', item)"
    >
      <span
        v-if="item.tone"
        class="h-2 w-2 shrink-0 rounded-full"
        :class="getDotClass(item.tone)"
      ></span>

      <span class="min-w-0 truncate">{{ item.label }}</span>

      <span
        class="inline-flex h-5 min-w-7 items-center justify-center rounded-full px-2 text-[11px] font-black"
        :class="isItemSelected(item) ? 'bg-white/20 text-white' : 'bg-[#eef3ff] text-[#102372]'"
      >
        {{ item.value }}
      </span>
    </button>
  </section>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  selectedStatus: {
    type: String,
    default: "all",
  },
})

defineEmits(["select-summary"])

const selectedClass = "border-[#102372] bg-[#102372] text-white shadow-sm"
const unselectedClass =
  "border-[#d8e0eb] bg-white text-[#102372] hover:border-[#9eb3d1] hover:bg-[#f8fbff]"

const getDotClass = (tone) => {
  if (tone === "success") return "bg-[#16a34a]"
  if (tone === "danger") return "bg-[#ef1b23]"

  return "bg-[#8aa0bd]"
}

const isItemSelected = (item) => {
  return item.status === props.selectedStatus
}
</script>
