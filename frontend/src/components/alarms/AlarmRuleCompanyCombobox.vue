<template>
  <div ref="root" class="company-combobox" @focusout="onFocusOut">
    <label :for="inputId">Empresa</label>
    <div class="company-combobox-field">
      <input
        :id="inputId"
        ref="input"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="isOpen"
        :aria-controls="listId"
        :aria-activedescendant="isOpen && choices[activeIndex] ? optionId(activeIndex) : undefined"
        :value="isOpen ? query : selectedLabel"
        placeholder="Buscar empresa..."
        autocomplete="off"
        @focus="open"
        @click="open"
        @input="onInput"
        @keydown="onKeydown"
      />
      <button
        type="button"
        tabindex="-1"
        aria-label="Mostrar empresas"
        :aria-expanded="isOpen"
        @mousedown.prevent
        @click="toggle"
      >
        <SvgIcon name="chevron-down" />
      </button>
    </div>
    <ul
      v-if="isOpen"
      :id="listId"
      ref="list"
      role="listbox"
      aria-label="Empresas"
      class="company-combobox-options"
    >
      <li
        v-for="(option, index) in choices"
        :id="optionId(index)"
        :key="option.id"
        role="option"
        :aria-selected="String(option.id) === String(modelValue)"
        :class="{ active: index === activeIndex }"
        @mousedown.prevent
        @mouseenter="activeIndex = index"
        @click="select(option)"
      >
        <span>{{ option.label }}</span
        ><SvgIcon v-if="String(option.id) === String(modelValue)" name="check" />
      </li>
      <li v-if="query.trim() && !matches.length" class="company-combobox-empty" role="presentation">
        No se encontraron empresas.
      </li>
    </ul>
  </div>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"
const props = defineProps({
  modelValue: { type: String, default: "all" },
  options: { type: Array, default: () => [] },
})
const emit = defineEmits(["update:modelValue"])
const id = useId(),
  inputId = "company-input-" + id,
  listId = "company-list-" + id
const root = ref(null),
  input = ref(null),
  list = ref(null)
const isOpen = ref(false),
  query = ref(""),
  activeIndex = ref(0)
const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
const matches = computed(() =>
  props.options.filter((option) => normalize(option.label).includes(normalize(query.value))),
)
const choices = computed(() => [{ id: "all", label: "Todas las empresas" }, ...matches.value])
const selectedLabel = computed(() =>
  props.modelValue === "all"
    ? "Todas las empresas"
    : props.options.find((option) => String(option.id) === props.modelValue)?.label ||
      "Todas las empresas",
)
const optionId = (index) => listId + "-" + index
const open = () => {
  if (isOpen.value) return
  query.value = ""
  isOpen.value = true
  activeIndex.value = Math.max(
    0,
    choices.value.findIndex((option) => String(option.id) === props.modelValue),
  )
}
const close = () => {
  isOpen.value = false
  query.value = ""
}
const select = (option) => {
  emit("update:modelValue", String(option.id))
  close()
}
const toggle = () => {
  if (isOpen.value) close()
  else {
    input.value?.focus()
    open()
  }
}
const onInput = (event) => {
  isOpen.value = true
  query.value = event.target.value
  activeIndex.value = matches.value.length ? 1 : 0
}
const onKeydown = async (event) => {
  if (event.isComposing) return
  if (event.key === "Escape" && isOpen.value) {
    event.preventDefault()
    event.stopPropagation()
    close()
    return
  }
  if (event.key === "Tab") {
    close()
    return
  }
  if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter"].includes(event.key)) return
  if (["Home", "End"].includes(event.key) && !isOpen.value) return
  event.preventDefault()
  if (!isOpen.value) {
    open()
    return
  }
  if (event.key === "Enter") {
    if (choices.value[activeIndex.value]) select(choices.value[activeIndex.value])
    return
  }
  if (event.key === "Home") activeIndex.value = 0
  else if (event.key === "End") activeIndex.value = choices.value.length - 1
  else
    activeIndex.value =
      (activeIndex.value + (event.key === "ArrowDown" ? 1 : -1) + choices.value.length) %
      choices.value.length
  await nextTick()
  list.value
    ?.querySelector("#" + CSS.escape(optionId(activeIndex.value)))
    ?.scrollIntoView({ block: "nearest" })
}
const onFocusOut = (event) => {
  if (!root.value?.contains(event.relatedTarget)) close()
}
const outside = (event) => {
  if (!root.value?.contains(event.target)) close()
}
onMounted(() => document.addEventListener("pointerdown", outside, true))
onBeforeUnmount(() => document.removeEventListener("pointerdown", outside, true))
</script>
<style scoped>
.company-combobox {
  position: relative;
  min-width: 0;
  color: #102372;
}
label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 800;
  color: #49618a;
}
.company-combobox-field {
  display: flex;
  align-items: center;
  height: 40px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  background: white;
  overflow: hidden;
}
.company-combobox-field:focus-within {
  border-color: #102372;
  box-shadow: 0 0 0 2px rgb(16 35 114 / 10%);
}
input {
  min-width: 0;
  width: 100%;
  height: 100%;
  padding: 0 10px;
  border: 0;
  outline: 0;
  color: #102372;
  font-size: 12px;
  background: transparent;
}
button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 38px;
  flex-shrink: 0;
  color: #49618a;
}
button :deep(.svg-icon-wrapper) {
  width: 15px;
  height: 15px;
}
.company-combobox-options {
  position: absolute;
  z-index: 30;
  top: 100%;
  left: 0;
  right: 0;
  margin: 5px 0 0;
  padding: 4px;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  background: white;
  box-shadow: 0 8px 24px rgb(15 23 42 / 14%);
}
li[role="option"] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 36px;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  overflow-wrap: anywhere;
}
li[role="option"].active {
  background: #eef3ff;
}
li[aria-selected="true"] {
  font-weight: 800;
}
li :deep(.svg-icon-wrapper) {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.company-combobox-empty {
  padding: 10px 8px;
  font-size: 12px;
  color: #7f93b3;
}
</style>
