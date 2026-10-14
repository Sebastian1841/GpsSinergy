<template>
  <section class="support-view">
    <header class="support-topbar">
      <div>
        <h1>Panel de soporte</h1>
        <span
          >{{ counts.open }} abiertas <i>·</i> {{ counts.waiting }} esperando al cliente <i>·</i>
          {{ counts.resolved }} resueltas</span
        >
      </div>
      <button class="primary" :disabled="busy || !accessibleCompanies.length" @click="openCreate">
        <SvgIcon name="plus" />Nueva solicitud
      </button>
    </header>
    <div class="support-filters">
      <label class="support-search"
        ><SvgIcon name="search" /><input
          v-model="search"
          type="search"
          aria-label="Buscar solicitudes"
          placeholder="Buscar solicitud, vehiculo o empresa"
      /></label>
      <select v-model="company" aria-label="Filtrar empresa">
        <option value="">Todas las empresas</option>
        <option v-for="item in accessibleCompanies" :key="item.id" :value="String(item.id)">
          {{ item.name }}
        </option>
      </select>
      <select v-model="status" aria-label="Filtrar estado">
        <option value="">Todos los estados</option>
        <option v-for="item in SUPPORT_STATUSES" :key="item.id" :value="item.id">
          {{ item.label }}
        </option>
      </select>
      <select v-model="type" aria-label="Filtrar tipo">
        <option value="">Todos los tipos</option>
        <option v-for="item in SUPPORT_TYPES" :key="item">{{ item }}</option>
      </select>
    </div>
    <p v-if="error && !createOpen" role="alert" class="support-feedback error">{{ error }}</p>
    <p v-if="notice" role="status" class="support-feedback success">{{ notice }}</p>
    <div class="support-workspace">
      <aside class="request-list" aria-label="Solicitudes">
        <div class="list-heading">
          <strong>Solicitudes</strong><span>{{ filtered.length }}</span>
        </div>
        <div class="list-scroll">
          <button
            v-for="item in displayed"
            :key="item.id"
            class="request-row"
            :class="{ selected: selectedId === item.id }"
            :aria-pressed="selectedId === item.id"
            :disabled="busy"
            @click="selectedId = item.id"
          >
            <div class="row-meta">
              <b>{{ item.number }}</b
              ><span class="status" :class="item.status">{{
                supportStatusLabel(item.status)
              }}</span>
            </div>
            <strong>{{ item.subject }}</strong
            ><small
              >{{ item.company }}<template v-if="item.plate"> · {{ item.plate }}</template></small
            >
            <div class="row-meta">
              <small>{{ item.type }}</small
              ><time>{{ date(item.updatedAt, false) }}</time>
            </div>
          </button>
          <div v-if="!displayed.length" class="empty">
            <SvgIcon name="support" /><strong>{{
              accessibleCompanies.length ? "Sin solicitudes" : "Sin empresas disponibles"
            }}</strong
            ><span>{{
              search || status || type || company
                ? "No hay resultados para estos filtros."
                : "Todavia no hay solicitudes registradas."
            }}</span
            ><button
              v-if="accessibleCompanies.length && !(search || status || type || company)"
              :disabled="busy"
              @click="openCreate"
            >
              Nueva solicitud
            </button>
          </div>
        </div>
        <footer class="list-pagination">
          <span>{{ page }} / {{ pageCount }}</span
          ><button
            title="Pagina anterior"
            aria-label="Pagina anterior"
            :disabled="page === 1 || busy"
            @click="page--"
          >
            <SvgIcon name="chevron-left" /></button
          ><button
            title="Pagina siguiente"
            aria-label="Pagina siguiente"
            :disabled="page === pageCount || busy"
            @click="page++"
          >
            <SvgIcon name="chevron-right" />
          </button>
        </footer>
      </aside>
      <section class="request-detail" aria-label="Detalle de solicitud">
        <template v-if="selected">
          <header class="detail-heading">
            <div class="row-meta">
              <span>{{ selected.number }} · {{ selected.type }}</span
              ><span class="status" :class="selected.status">{{
                supportStatusLabel(selected.status)
              }}</span>
            </div>
            <h2>{{ selected.subject }}</h2>
            <div class="detail-facts">
              <span
                >{{ selected.company
                }}<template v-if="selected.plate"> · {{ selected.plate }}</template></span
              ><span
                >Creada por {{ selected.creator || "Usuario" }} ·
                {{ date(selected.createdAt) }}</span
              ><span>Responsable: {{ selected.assignee || "Sin asignar" }}</span
              ><span v-if="selected.scheduledAt">Atencion: {{ date(selected.scheduledAt) }}</span>
            </div>
          </header>
          <form v-if="canManage" class="management" @submit.prevent="saveManagement">
            <label
              >Estado<select v-model="management.status" :disabled="busy">
                <option v-for="item in SUPPORT_STATUSES" :key="item.id" :value="item.id">
                  {{ item.label }}
                </option>
              </select></label
            ><label
              >Responsable<select v-model="management.assigneeId" :disabled="busy">
                <option value="">Sin asignar</option>
                <option v-for="user in assignees" :key="user.id" :value="String(user.id)">
                  {{ user.name }}
                </option>
              </select></label
            ><label
              >Fecha de atencion<input
                v-model="management.scheduledAt"
                type="datetime-local"
                :required="management.status === 'scheduled'"
                :disabled="busy" /></label
            ><button type="submit" :disabled="busy"><SvgIcon name="check" />Guardar</button>
          </form>
          <section class="conversation" aria-label="Conversacion">
            <article
              v-for="message in selected.messages"
              :key="message.id"
              :class="{ 'conversation-event': message.kind === 'event' }"
            >
              <div class="message-heading">
                <strong>{{ message.author }}</strong
                ><time>{{ date(message.createdAt) }}</time>
              </div>
              <p v-if="message.text">{{ message.text }}</p>
              <div v-if="message.attachments?.length" class="message-files">
                <button
                  v-for="file in message.attachments"
                  :key="file.storageId"
                  :disabled="busy"
                  @click="downloadAttachment(selected.id, file)"
                >
                  <SvgIcon name="download" /><span>{{ file.name }}</span>
                </button>
              </div>
            </article>
          </section>
          <form class="reply-form" @submit.prevent="sendReply">
            <label
              >Respuesta<textarea
                v-model="replyText"
                maxlength="5000"
                rows="3"
                :disabled="busy"
              ></textarea>
            </label>
            <div class="reply-actions">
              <label class="attach-button"
                ><SvgIcon name="support-attachment" />Adjuntar<input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                  :disabled="busy"
                  @change="selectReplyFiles" /></label
              ><span>{{ replyFiles.length ? `${replyFiles.length} archivos` : "" }}</span
              ><button
                class="primary"
                type="submit"
                :disabled="busy || (!replyText.trim() && !replyFiles.length)"
              >
                {{
                  busy
                    ? "Procesando..."
                    : selected.status === "resolved"
                      ? "Reabrir y responder"
                      : "Enviar respuesta"
                }}<SvgIcon name="arrow-right" />
              </button>
            </div>
            <ul v-if="replyFiles.length" class="reply-files">
              <li v-for="(file, index) in replyFiles" :key="index">
                <span>{{ file.name }}</span
                ><button
                  type="button"
                  :disabled="busy"
                  :aria-label="`Quitar ${file.name}`"
                  @click="replyFiles.splice(index, 1)"
                >
                  <SvgIcon name="close" />
                </button>
              </li>
            </ul>
          </form>
        </template>
        <div v-else class="empty detail-empty">
          <SvgIcon name="support" /><strong>Solicitudes de soporte</strong
          ><span>Sin solicitud seleccionada.</span>
        </div>
      </section>
    </div>
    <SupportRequestModal
      v-if="createOpen"
      :companies="accessibleCompanies"
      :assets="visibleAssets"
      :initial-company="company"
      :busy="busy"
      :error="error"
      @close="closeCreate"
      @submit="createRequest"
    />
  </section>
</template>
<script setup>
import { defineAsyncComponent } from "vue"
import SvgIcon from "../components/icons/SvgIcon.vue"
import { useSupportPanel } from "../composables/support/useSupportPanel.js"
import {
  SUPPORT_TYPES,
  SUPPORT_STATUSES,
  supportStatusLabel,
  validateSupportFiles,
} from "../utils/support/supportRequestUtils.js"
const SupportRequestModal = defineAsyncComponent(
  () => import("../components/support/SupportRequestModal.vue"),
)
const {
  accessibleCompanies,
  visibleAssets,
  search,
  status,
  type,
  company,
  selectedId,
  page,
  pageCount,
  filtered,
  displayed,
  selected,
  canManage,
  assignees,
  counts,
  busy,
  error,
  notice,
  createOpen,
  replyText,
  replyFiles,
  management,
  createRequest,
  sendReply,
  saveManagement,
  downloadAttachment,
} = useSupportPanel()
const date = (value, time = true) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? "Sin fecha"
    : new Intl.DateTimeFormat("es-CL", {
        dateStyle: "short",
        ...(time ? { timeStyle: "short" } : {}),
        timeZone: "America/Santiago",
      }).format(parsed)
}
const openCreate = () => {
  error.value = ""
  notice.value = ""
  createOpen.value = true
}
const closeCreate = () => {
  createOpen.value = false
  error.value = ""
}
const selectReplyFiles = (event) => {
  const files = [...replyFiles.value, ...event.target.files]
  try {
    validateSupportFiles(files)
    replyFiles.value = files
    error.value = ""
  } catch (cause) {
    error.value = cause.message
  }
  event.target.value = ""
}
</script>
<style scoped>
.support-view {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f4f7fb;
  color: #102372;
}
.support-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #d8e0eb;
}
h1 {
  font-size: 22px;
  font-weight: 750;
  margin: 0 0 4px;
}
.support-topbar span {
  font-size: 12px;
  color: #65748d;
}
.support-topbar i {
  font-style: normal;
  margin: 0 8px;
}
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #ccd8ef;
  background: white;
  color: #102372;
  border-radius: 4px;
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
.primary {
  background: #102372;
  color: white;
  border-color: #102372;
}
button:hover:not(:disabled) {
  background: #edf3f9;
}
.primary:hover:not(:disabled) {
  background: #1b3991;
}
.support-filters {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) repeat(3, minmax(140px, 200px));
  gap: 10px;
  padding: 14px 24px;
}
input,
select,
textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #ccd8ef;
  border-radius: 4px;
  background: white;
  padding: 9px 10px;
  color: #102372;
  font-size: 12px;
}
textarea {
  resize: vertical;
}
.support-search {
  position: relative;
}
.support-search :deep(.svg-icon-wrapper) {
  position: absolute;
  left: 10px;
  top: 10px;
  width: 16px;
  height: 16px;
}
.support-search input {
  padding-left: 34px;
}
.support-feedback {
  margin: 0 24px 12px;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 12px;
}
.error {
  background: #fff0f3;
  color: #b51239;
}
.success {
  background: #e8f8f1;
  color: #00835e;
}
.support-workspace {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  margin: 0 24px 20px;
  border: 1px solid #d8e0eb;
  border-radius: 6px;
  background: white;
  overflow: hidden;
}
.request-list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid #d8e0eb;
}
.list-heading {
  display: flex;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #d8e0eb;
  font-size: 13px;
}
.list-heading span {
  color: #65748d;
}
.list-scroll {
  overflow: auto;
  flex: 1;
  min-height: 0;
}
.request-row {
  display: block;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #e1e8f1;
  border-radius: 0;
  text-align: left;
  padding: 15px 16px;
  font-weight: 400;
}
.request-row.selected {
  background: #edf4ff;
  box-shadow: inset 3px 0 #1462df;
}
.request-row > strong {
  display: block;
  font-size: 13px;
  margin: 9px 0 5px;
  overflow-wrap: anywhere;
}
.request-row small,
.request-row time {
  font-size: 11px;
  color: #65748d;
}
.row-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 11px;
}
.request-row > .row-meta:last-child {
  margin-top: 9px;
}
.status {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 7px;
  border-radius: 4px;
  background: #edf1f6;
  color: #5b6a82;
}
.status.received {
  background: #e9f1ff;
  color: #1259c4;
}
.status.review {
  background: #f0eaff;
  color: #6542b4;
}
.status.waiting {
  background: #fff4df;
  color: #9b6000;
}
.status.scheduled {
  background: #e6f5fc;
  color: #007a9d;
}
.status.resolved {
  background: #e5f7ee;
  color: #007b54;
}
.list-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid #d8e0eb;
  font-size: 11px;
}
.list-pagination span {
  margin-right: auto;
}
.list-pagination button {
  padding: 6px;
}
.request-detail {
  min-width: 0;
  min-height: 0;
  overflow: auto;
}
.detail-heading {
  padding: 20px 24px;
  border-bottom: 1px solid #e1e8f1;
}
.detail-heading h2 {
  font-size: 19px;
  font-weight: 700;
  margin: 12px 0;
  overflow-wrap: anywhere;
}
.detail-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 7px 20px;
  font-size: 11px;
  color: #65748d;
}
.management {
  display: grid;
  grid-template-columns: 1fr 1fr minmax(180px, 1fr) auto;
  align-items: end;
  gap: 10px;
  padding: 14px 24px;
  background: #f7f9fc;
  border-bottom: 1px solid #e1e8f1;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11px;
  font-weight: 650;
}
.conversation {
  padding: 4px 24px;
}
.conversation article {
  padding: 17px 0;
  border-bottom: 1px solid #edf1f5;
}
.message-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}
.message-heading time {
  font-size: 10px;
  color: #65748d;
}
.conversation p {
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin: 8px 0 0;
}
.conversation-event {
  color: #65748d;
}
.conversation-event p {
  font-size: 11px;
}
.message-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.message-files button {
  max-width: 100%;
  font-size: 11px;
}
.message-files span {
  overflow-wrap: anywhere;
  min-width: 0;
}
.reply-form {
  padding: 20px 24px;
}
.reply-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}
.reply-actions > span {
  font-size: 11px;
  color: #65748d;
}
.reply-actions > button {
  margin-left: auto;
}
.attach-button {
  position: relative;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  border: 1px solid #ccd8ef;
  border-radius: 4px;
  padding: 9px 10px;
  overflow: hidden;
}
.attach-button input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.reply-files {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
}
.reply-files li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
}
.reply-files span {
  overflow-wrap: anywhere;
}
.reply-files button {
  padding: 4px;
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 20px;
  color: #65748d;
  text-align: center;
  font-size: 12px;
}
.empty :deep(.svg-icon-wrapper) {
  width: 32px;
  height: 32px;
  color: #8394b1;
}
.empty strong {
  color: #102372;
  font-size: 14px;
}
.detail-empty {
  height: 100%;
}
button :deep(.svg-icon-wrapper) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
@media (max-width: 1200px) {
  .support-workspace {
    grid-template-columns: 300px minmax(0, 1fr);
  }
  .management {
    grid-template-columns: 1fr 1fr;
  }
  .management button {
    justify-self: end;
  }
  .support-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .support-view {
    height: auto;
    min-height: 100%;
  }
  .support-topbar {
    padding: 16px;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .support-filters {
    padding: 12px 16px;
  }
  .support-workspace {
    display: flex;
    flex-direction: column;
    margin: 0 16px 16px;
    overflow: visible;
  }
  .request-list {
    border-right: 0;
    border-bottom: 1px solid #d8e0eb;
  }
  .list-scroll {
    max-height: 300px;
  }
  .request-detail {
    overflow: visible;
  }
  .detail-heading,
  .reply-form,
  .management {
    padding: 16px;
  }
  .conversation {
    padding: 0 16px;
  }
  .support-feedback {
    margin-left: 16px;
    margin-right: 16px;
  }
  .message-heading {
    flex-wrap: wrap;
  }
  .reply-actions {
    flex-wrap: wrap;
  }
  h1 {
    font-size: 20px;
  }
}
@media (max-width: 420px) {
  .management {
    grid-template-columns: 1fr;
  }
  .support-filters {
    grid-template-columns: 1fr;
  }
  .reply-actions > button {
    margin-left: 0;
    width: 100%;
  }
}
</style>
