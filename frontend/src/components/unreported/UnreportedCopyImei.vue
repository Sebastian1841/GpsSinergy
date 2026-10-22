<template>
  <span class="imei-copy">
    <span>{{ imei }}</span>
    <button
      type="button"
      :disabled="busy || !imei"
      :title="message || 'Copiar IMEI'"
      :aria-label="message || 'Copiar IMEI'"
      @click.stop="copy"
    >
      <SvgIcon :name="copied ? 'check' : 'copy'" />
    </button>
    <span class="copy-feedback" role="status">{{ message }}</span>
  </span>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"

const props = defineProps({ imei: { type: String, default: "" } })
const busy = ref(false)
const copied = ref(false)
const message = ref("")
let timer
let generation = 0
function reset() {
  generation += 1
  clearTimeout(timer)
  busy.value = false
  copied.value = false
  message.value = ""
}
watch(() => props.imei, reset)
onBeforeUnmount(reset)
async function copy() {
  if (busy.value || !props.imei) return
  const current = generation
  busy.value = true
  try {
    await navigator.clipboard.writeText(props.imei)
    if (current !== generation) return
    copied.value = true
    message.value = "IMEI copiado"
  } catch {
    if (current !== generation) return
    message.value = "No se pudo copiar el IMEI"
  } finally {
    if (current === generation) {
      busy.value = false
      timer = setTimeout(reset, 3000)
    }
  }
}
</script>

<style scoped>
.imei-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  position: relative;
  vertical-align: middle;
}
.imei-copy > span:first-child {
  overflow-wrap: anywhere;
  min-width: 0;
}
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #526b94;
  cursor: pointer;
}
button:hover,
button:focus-visible {
  background: #edf3ff;
  border-color: #b7c9ed;
  color: #102372;
}
button :deep(svg) {
  width: 16px;
  height: 16px;
}
.copy-feedback {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 10;
  background: #fff;
  color: #102372;
  box-shadow: 0 2px 6px #0002;
  border-radius: 4px;
  padding: 4px 8px;
  white-space: nowrap;
  font-size: 12px;
}
.copy-feedback:empty {
  display: none;
}
</style>
