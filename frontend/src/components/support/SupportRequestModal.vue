<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="support-create"
      aria-labelledby="support-create-title"
      @cancel.prevent="close"
      @click="backdrop"
    >
      <header>
        <h2 id="support-create-title">Nueva solicitud</h2>
        <button type="button" aria-label="Cerrar" title="Cerrar" :disabled="busy" @click="close">
          <SvgIcon name="close" />
        </button>
      </header>
      <form @submit.prevent="submit">
        <div class="fields">
          <label
            >Empresa<select v-model="draft.companyId" required :disabled="busy">
              <option value="" disabled>Seleccionar empresa</option>
              <option v-for="item in companies" :key="item.id" :value="String(item.id)">
                {{ item.name }}
              </option>
            </select></label
          >
          <label
            >Tipo<select v-model="draft.type" required :disabled="busy">
              <option v-for="item in SUPPORT_TYPES" :key="item">{{ item }}</option>
            </select></label
          >
          <label class="wide"
            >Vehiculo<select v-model="draft.vehicleId" :disabled="busy">
              <option value="">Sin vehiculo asociado</option>
              <option v-for="item in companyAssets" :key="item.id" :value="String(item.id)">
                {{ item.patente || item.plate }} -
                {{ item.name || item.nombre || item.modelo || "Vehiculo" }}
              </option>
            </select></label
          >
          <label class="wide"
            >Asunto<input
              v-model="draft.subject"
              autofocus
              required
              maxlength="120"
              :disabled="busy"
          /></label>
          <label class="wide"
            >Descripcion<textarea
              v-model="draft.description"
              required
              maxlength="5000"
              rows="5"
              :disabled="busy"
            ></textarea>
          </label>
          <label class="wide"
            >Adjuntos<input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
              :disabled="busy"
              @change="selectFiles"
          /></label>
          <ul v-if="draft.files.length" class="wide file-list">
            <li v-for="(file, index) in draft.files" :key="index">
              <span>{{ file.name }}</span
              ><button
                type="button"
                :disabled="busy"
                :aria-label="`Quitar ${file.name}`"
                @click="draft.files.splice(index, 1)"
              >
                <SvgIcon name="close" />
              </button>
            </li>
          </ul>
        </div>
        <p v-if="localError || error" role="alert" class="error">{{ localError || error }}</p>
        <footer>
          <button type="button" :disabled="busy" @click="close">Cancelar</button
          ><button class="primary" type="submit" :disabled="busy || !companies.length">
            {{ busy ? "Enviando..." : "Enviar solicitud" }}
          </button>
        </footer>
      </form>
    </dialog>
  </Teleport>
</template>
<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"
import { SUPPORT_TYPES, validateSupportFiles } from "../../utils/support/supportRequestUtils.js"
const props = defineProps({
  companies: { type: Array, required: true },
  assets: { type: Array, required: true },
  initialCompany: { type: String, default: "" },
  busy: Boolean,
  error: { type: String, default: "" },
})
const emit = defineEmits(["close", "submit"])
const dialog = ref(null),
  localError = ref("")
const draft = reactive({
  companyId: props.initialCompany || String(props.companies[0]?.id || ""),
  type: SUPPORT_TYPES[0],
  vehicleId: "",
  subject: "",
  description: "",
  files: [],
})
const companyAssets = computed(() =>
  props.assets.filter((asset) => String(asset.companyId) === draft.companyId),
)
watch(
  () => draft.companyId,
  () => {
    draft.vehicleId = ""
  },
)
const close = () => {
  if (!props.busy) emit("close")
}
const backdrop = (event) => {
  if (event.target === dialog.value) {
    const rect = dialog.value.getBoundingClientRect()
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      close()
  }
}
const selectFiles = (event) => {
  localError.value = ""
  const files = [...draft.files, ...event.target.files]
  try {
    validateSupportFiles(files)
    draft.files = files
  } catch (error) {
    localError.value = error.message
  }
  event.target.value = ""
}
const submit = () => {
  if (!props.busy) {
    localError.value = ""
    emit("submit", { ...draft, files: [...draft.files] })
  }
}
onMounted(() => dialog.value.showModal())
</script>
<style scoped>
.support-create {
  width: min(640px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  border: 1px solid #d8e0eb;
  border-radius: 8px;
  padding: 0;
  color: #102372;
}
.support-create::backdrop {
  background: #15202d99;
}
header,
footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #d8e0eb;
}
h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}
header button {
  padding: 6px;
}
form {
  max-height: calc(100dvh - 100px);
  overflow: auto;
}
.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 20px;
}
.wide {
  grid-column: 1/-1;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
}
input,
select,
textarea,
button {
  min-width: 0;
  border: 1px solid #ccd8ef;
  border-radius: 4px;
  padding: 9px;
  background: #fff;
  color: #102372;
  font-size: 13px;
}
textarea {
  resize: vertical;
}
footer {
  justify-content: flex-end;
  border-top: 1px solid #d8e0eb;
  border-bottom: 0;
  position: sticky;
  bottom: 0;
  background: white;
}
.primary {
  background: #102372;
  color: white;
  font-weight: 700;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
.file-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.file-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
}
.file-list span {
  overflow-wrap: anywhere;
}
.error {
  color: #bc1238;
  padding: 0 20px;
  font-size: 12px;
}
@media (max-width: 480px) {
  .fields {
    grid-template-columns: 1fr;
    padding: 14px;
  }
  header,
  footer {
    padding: 14px;
  }
}
</style>
