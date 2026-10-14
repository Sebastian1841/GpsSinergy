<template>
  <Teleport to="body"
    ><dialog ref="dialog" aria-labelledby="operation-title" @cancel.prevent="emit('close')">
      <header>
        <div class="heading">
          <h2 id="operation-title">
            Notas del equipo <span>· {{ equipment.name }}</span>
          </h2>
          <p class="identity">{{ equipment.company }} · {{ equipment.imei }}</p>
        </div>
        <button
          class="close-button"
          type="button"
          title="Cerrar"
          aria-label="Cerrar"
          @click="emit('close')"
        >
          <SvgIcon name="close" />
        </button>
      </header>
      <form @submit.prevent="submit">
        <section class="notes-list" aria-label="Notas registradas">
          <article
            v-for="note in [...(equipment.notes || [])].reverse()"
            :key="note.id"
            class="note"
          >
            <div class="note-meta">
              <strong>{{ note.author }}</strong>
              <strong>{{ formatDate(note.createdAt) }}</strong>
              <details class="note-actions">
                <summary title="Acciones de la nota" aria-label="Acciones de la nota">⋮</summary>
                <div class="note-menu">
                  <button type="button" @click="startEdit(note, $event)">
                    <SvgIcon name="pencil" />Editar
                  </button>
                  <button type="button" @click="startDelete(note, $event)">
                    <SvgIcon name="trash" />Eliminar
                  </button>
                </div>
              </details>
            </div>
            <p>{{ note.text }}</p>
            <small v-if="note.updatedAt" class="modified"
              >Editada por {{ note.updatedBy }} · {{ formatDate(note.updatedAt) }}</small
            >
            <div v-if="deletingId === note.id" class="delete-confirm" role="alert">
              <p>¿Eliminar esta nota?</p>
              <button type="button" @click="deletingId = null">Cancelar</button>
              <button type="button" class="danger" @click="emit('delete', note.id)">
                Eliminar nota
              </button>
            </div>
          </article>
          <p v-if="!equipment.notes?.length" class="identity">Sin notas registradas</p>
        </section>
        <label v-if="editorOpen"
          >{{ editingId ? "Editar nota" : "Nueva nota"
          }}<textarea
            v-model="reason"
            required
            maxlength="500"
            rows="4"
            placeholder="Escribe una nota..."
            autofocus
          ></textarea>
        </label>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <footer>
          <template v-if="editorOpen">
            <button type="button" @click="cancelEdit">Cancelar</button>
            <button class="primary" type="submit" :disabled="!reason.trim()">
              {{ editingId ? "Guardar cambios" : "Guardar nota" }}
            </button>
          </template>
          <template v-else>
            <button type="button" @click="emit('close')">Cerrar</button>
            <button class="primary add-note" type="button" @click="startAdd">
              <SvgIcon name="plus" />Agregar nota
            </button>
          </template>
        </footer>
      </form>
    </dialog></Teleport
  >
</template>
<script setup>
import { nextTick, onMounted, ref, watch } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"
const props = defineProps({
  equipment: { type: Object, required: true },
  error: { type: String, default: "" },
})
const emit = defineEmits(["close", "confirm", "edit", "delete"])
const editingId = ref(null),
  deletingId = ref(null),
  editorOpen = ref(false)
const cancelEdit = () => {
  editingId.value = null
  reason.value = ""
  editorOpen.value = false
}
const focusEditor = async () => {
  await nextTick()
  dialog.value?.querySelector("textarea")?.focus()
}
const startAdd = () => {
  editingId.value = null
  deletingId.value = null
  reason.value = ""
  editorOpen.value = true
  focusEditor()
}
const startEdit = (note, event) => {
  event.currentTarget.closest("details").open = false
  editingId.value = note.id
  deletingId.value = null
  reason.value = note.text
  editorOpen.value = true
  focusEditor()
}
const startDelete = (note, event) => {
  event.currentTarget.closest("details").open = false
  deletingId.value = note.id
}
const dialog = ref(null),
  reason = ref("")
const formatDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Sin fecha registrada"
    : new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Santiago",
      }).format(date)
}
watch(
  () => props.equipment.notes,
  (notes) => {
    if (editingId.value) cancelEdit()
    else if (!deletingId.value) cancelEdit()
    if (deletingId.value && !notes?.some((note) => note.id === deletingId.value))
      deletingId.value = null
  },
)
const submit = () => {
  if (!editorOpen.value || !reason.value.trim()) return
  return editingId.value
    ? emit("edit", { id: editingId.value, text: reason.value })
    : emit("confirm", reason.value)
}
onMounted(() => dialog.value.showModal())
</script>
<style scoped>
dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(680px, calc(100vw - 32px));
  height: min(600px, calc(100dvh - 32px));
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 1px solid #d8e0eb;
  border-radius: 8px;
  color: #102372;
  background: white;
  box-shadow: 0 24px 64px rgb(15 35 80 / 22%);
}
dialog[open] {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
dialog::backdrop {
  background: #15202d88;
}
header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 24px 0;
  margin: 0 28px;
  border-bottom: 1px solid #d8e0eb;
}
h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}
.heading {
  min-width: 0;
  overflow-wrap: anywhere;
}
h2 span {
  font-size: 21px;
  font-weight: 500;
}
.close-button {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  padding: 0;
}
form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 24px 28px 28px;
  overflow: auto;
  font-size: 15px;
}
label {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 16px;
  font-weight: 700;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #d8e0eb;
}
textarea {
  width: 100%;
  border: 1px solid #ccd8ef;
  border-radius: 4px;
  padding: 14px 18px;
  min-height: 110px;
  height: 110px;
  max-height: 110px;
  font-size: 14px;
  font-weight: 400;
  resize: none;
}
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccd8ef;
  border-radius: 4px;
  padding: 12px 24px;
  background: white;
  color: #102372;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 22px;
  flex-wrap: wrap;
}
.primary {
  background: #1945b5;
  border-color: #1945b5;
  color: white;
}
.add-note {
  gap: 8px;
}
.identity {
  font-size: 15px;
  color: #8796b6;
  margin-top: 6px;
}
.notes-list {
  display: grid;
  gap: 12px;
  flex: 1;
  min-height: 80px;
  align-content: start;
  overflow-y: auto;
  margin-top: 0;
}
.note {
  padding: 18px 22px;
  background: #f3f6fb;
  border-radius: 8px;
}
.note p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin: 12px 0 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}
.note-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px 16px;
  color: #29456f;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.note-meta strong {
  font-weight: 700;
}
.note-meta strong:first-child {
  flex: 1;
}
.note-actions {
  position: relative;
}
.note-actions summary {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid #ccd8ef;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  list-style: none;
}
.note-actions summary::-webkit-details-marker {
  display: none;
}
.note-menu {
  position: absolute;
  right: 0;
  top: 32px;
  z-index: 1;
  display: grid;
  width: 140px;
  padding: 4px;
  background: white;
  border: 1px solid #ccd8ef;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgb(15 35 80 / 12%);
}
.note-menu button {
  justify-content: flex-start;
  gap: 8px;
  padding: 8px;
  border: 0;
}
.note-menu button:hover {
  background: #f3f6fb;
}
.modified {
  display: block;
  margin-top: 8px;
  color: #65748d;
  overflow-wrap: anywhere;
}
.delete-confirm {
  margin-top: 12px;
}
.delete-confirm p {
  font-size: 14px;
  margin-bottom: 8px;
}
.delete-confirm button {
  padding: 8px 12px;
  margin-right: 8px;
}
.danger {
  color: #b51239;
  border-color: #b51239;
}
button:disabled {
  cursor: default;
  opacity: 0.5;
}
.error {
  flex-shrink: 0;
  color: #b51239;
}
button :deep(.svg-icon-wrapper) {
  width: 16px;
  height: 16px;
}
@media (max-width: 540px) {
  header {
    margin-inline: 16px;
    padding-block: 18px;
  }
  form {
    padding: 18px 16px;
  }
  h2 {
    font-size: 20px;
  }
  h2 span {
    font-size: 18px;
  }
  footer button {
    padding-inline: 16px;
  }
}
</style>
