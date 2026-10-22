<template>
  <Teleport to="body"
    ><dialog ref="dialog" aria-labelledby="operation-title" @cancel.prevent="emit('close')">
      <header>
        <div class="heading">
          <div class="equipment-heading">
            <span class="equipment-symbol">
              <img
                v-if="vehicleImage && failedVehicleImage !== vehicleImage"
                :src="vehicleImage"
                :alt="equipment.name"
                @error="failedVehicleImage = vehicleImage"
              />
              <SvgIcon v-else name="vehiculos" />
            </span>
            <div class="equipment-identity">
              <div class="title-line">
                <h2 id="operation-title">
                  {{
                    consultationOpen
                      ? editingCall
                        ? "Editar consulta"
                        : "Registrar consulta"
                      : "Revisar equipo"
                  }}
                  <span>· {{ equipment.name }}</span>
                </h2>
                <span v-if="!consultationOpen && equipment.assetType" class="type-badge">{{
                  getAssetTypeLabel(equipment.assetType)
                }}</span>
                <span
                  v-if="!consultationOpen"
                  class="status-badge"
                  :class="{ 'is-reporting': ['reporting', 'recovered'].includes(equipment.mode) }"
                  >{{ equipment.status }}</span
                >
              </div>
              <p class="identity">
                {{ equipment.company }} · <UnreportedCopyImei :imei="String(equipment.imei)" />
              </p>
            </div>
          </div>
          <div
            v-if="!consultationOpen && activeTab === 'general'"
            class="company-contact"
            aria-label="Contacto de la empresa"
          >
            <div class="contact-item">
              <span class="contact-symbol"><SvgIcon name="user" /></span>
              <div>
                <strong>Contacto</strong>
                <p>{{ companyContact.name || "Sin contacto registrado" }}</p>
              </div>
            </div>
            <div class="contact-item">
              <span class="contact-symbol"><SvgIcon name="telefono" /></span>
              <div>
                <strong>Telefono</strong>
                <p>
                  <a
                    v-if="companyContact.href"
                    :href="companyContact.href"
                    :aria-label="'Llamar al ' + companyContact.phone"
                    >{{ companyContact.phone }}</a
                  >
                  <span v-else>{{ companyContact.phone || "Sin telefono registrado" }}</span>
                </p>
              </div>
            </div>
          </div>
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
        <nav v-if="!consultationOpen" class="review-tabs" aria-label="Detalle del equipo">
          <button
            type="button"
            :class="{ selected: activeTab === 'general' }"
            :disabled="consultationOpen"
            @click="activeTab = 'general'"
          >
            Detalles del vehiculo
          </button>
          <button
            type="button"
            :class="{ selected: activeTab === 'consultations' }"
            :disabled="consultationOpen"
            @click="activeTab = 'consultations'"
          >
            Consultas registradas ({{ caseCalls.length }})
          </button>
        </nav>
        <section
          v-if="activeTab === 'general' && !consultationOpen"
          class="review-overview"
          aria-label="Resumen del equipo"
        >
          <dl class="review-facts">
            <div>
              <dt>Conectividad</dt>
              <dd>{{ equipment.status }}</dd>
            </div>
            <div>
              <dt>Ultimo reporte</dt>
              <dd>{{ equipment.lastReport }}</dd>
            </div>
            <div>
              <dt>{{ equipment.mode === "recovered" ? "Interrupcion" : "Sin reportar" }}</dt>
              <dd>{{ equipment.duration }}</dd>
            </div>
            <div>
              <dt>Ubicacion del ultimo reporte</dt>
              <dd>{{ equipment.location }}</dd>
            </div>
          </dl>
          <div class="review-status-grid">
            <section class="gps-diagnosis">
              <h3>Ultimo dato GPS</h3>
              <strong>{{ equipment.diagnosis?.reason }}</strong>
              <p>{{ equipment.diagnosis?.evidence }}</p>
              <div class="last-evidence">
                <h3>Ultima evidencia disponible</h3>
                <p class="evidence-date">
                  {{
                    lastEvidence.reportedAt
                      ? formatDate(lastEvidence.reportedAt)
                      : "Sin fecha de lectura registrada"
                  }}
                </p>
                <dl class="evidence-values">
                  <div v-for="field in lastEvidence.fields" :key="field.label">
                    <dt>{{ field.label }}</dt>
                    <dd>{{ field.value }}</dd>
                  </div>
                </dl>
                <p class="evidence-caution">
                  Datos de la ultima lectura disponible, no del estado actual.
                </p>
              </div>
            </section>
            <section class="follow-up-panel">
              <div>
                <h3>
                  {{ equipment.mode === "recovered" ? "Decision anterior" : "Revision en terreno" }}
                </h3>
                <strong>{{ equipment.followUpLabel }}</strong>
                <small v-if="equipment.lastConsultation"
                  >{{ equipment.lastConsultation.author }} ·
                  {{ formatDate(equipment.lastConsultation.createdAt) }}</small
                >
                <p v-if="equipment.lastConsultation?.nextCallDate" class="mt-2 font-bold">
                  Proxima llamada: {{ followUpDateLabel(equipment.lastConsultation.nextCallDate) }}
                </p>
                <p v-if="equipment.lastConsultation?.visitResult" class="mt-2">
                  Visita del {{ followUpDateLabel(equipment.lastConsultation.visitDate) }}:
                  {{ visitResultLabel(equipment.lastConsultation.visitResult) }}
                </p>
              </div>
            </section>
          </div>
        </section>
        <section
          v-if="activeTab === 'consultations' || consultationOpen"
          class="consultation-list"
          :class="{ 'is-editing': consultationOpen }"
          aria-label="Consultas a la empresa"
        >
          <template v-if="!consultationOpen">
            <div class="consultations-heading">
              <span class="consultations-symbol"><SvgIcon name="reporte" /></span>
              <h3>Historial de consultas</h3>
              <span class="consultations-count"
                >{{ caseCalls.length }}
                {{ caseCalls.length === 1 ? "consulta registrada" : "consultas registradas" }}</span
              >
            </div>
            <article
              v-for="call in [...caseCalls].reverse()"
              :key="call.id"
              class="consultation-record"
            >
              <div class="consultation-meta">
                <span class="consultations-symbol"><SvgIcon name="user" /></span>
                <div class="consultation-author">
                  <span>Registro la consulta</span>
                  <strong>{{ call.author }}</strong>
                  <time :datetime="call.createdAt"
                    ><SvgIcon name="maintenance-calendar" />{{ formatDate(call.createdAt) }}</time
                  >
                  <small v-if="call.updatedAt"
                    >Editada por {{ call.editedBy }} · {{ formatDate(call.updatedAt) }}</small
                  >
                </div>
              </div>
              <div class="consultation-information">
                <div class="consultation-situation">
                  <SvgIcon name="reporte" />
                  <div>
                    <span>Situacion</span><strong>{{ situationLabel(call.situation) }}</strong>
                  </div>
                </div>
                <div class="consultation-outcome">
                  <span>Revision en terreno</span
                  ><strong class="consultation-decision">{{ decisionLabel(call.decision) }}</strong>
                </div>
                <p v-if="call.observation">
                  <span class="consultation-field-label">Observacion</span>{{ call.observation }}
                </p>
                <p v-if="call.workshopDays">
                  Estadia estimada en taller: {{ call.workshopDays }} dias
                </p>
                <p v-if="call.contactedPerson || call.contactedRole">
                  {{ consultationContactLabel(call) }}
                </p>
                <p v-if="call.nextCallDate">
                  <strong>Proxima llamada:</strong> {{ followUpDateLabel(call.nextCallDate) }}
                </p>
                <p v-if="call.visitResult">
                  <strong>Visita del {{ followUpDateLabel(call.visitDate) }}:</strong>
                  {{ visitResultLabel(call.visitResult) }}
                </p>
              </div>
              <div v-if="!equipment.archived" class="consultation-actions">
                <button
                  type="button"
                  title="Editar consulta"
                  aria-label="Editar consulta"
                  @click="editCall(call)"
                >
                  <SvgIcon name="pencil" />Editar
                </button>
                <button
                  type="button"
                  title="Eliminar consulta"
                  aria-label="Eliminar consulta"
                  @click="deleteCandidate = call.id"
                >
                  <SvgIcon name="trash" />Eliminar
                </button>
              </div>
              <div v-if="deleteCandidate === call.id" class="delete-confirmation" role="alert">
                <p>¿Eliminar esta consulta? Esta accion no se puede deshacer.</p>
                <button type="button" @click="deleteCandidate = null">Cancelar</button>
                <button type="button" @click="emit('delete-consultation', call.id)">
                  Eliminar consulta
                </button>
              </div>
            </article>
            <p v-if="!caseCalls.length" class="identity">Sin consultas para esta desconexion</p>
          </template>
          <div v-else class="consultation-left-column">
            <section class="consultation-panel">
              <h3><SvgIcon name="reporte" />Informacion de la consulta</h3>
              <div class="consultation-editor consultation-main-fields">
                <label
                  >Situacion informada
                  <select v-model="consultation.situation" required>
                    <option value="" disabled>Seleccionar</option>
                    <option
                      v-for="option in consultationSituations"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </label>
                <label
                  >Revision en terreno
                  <select
                    v-model="consultation.decision"
                    :disabled="!!consultationDecisionForSituation(consultation.situation)"
                    required
                  >
                    <option value="" disabled>Seleccionar</option>
                    <option
                      v-for="option in consultationDecisions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </label>
                <label v-if="consultation.situation === 'workshop'">
                  {{
                    editingCall
                      ? "Dias estimados desde la fecha de la consulta"
                      : "Dias estimados en taller desde hoy"
                  }}
                  <input
                    v-model.number="consultation.workshopDays"
                    type="number"
                    min="1"
                    max="3650"
                    step="1"
                    required
                  />
                  <span v-if="workshopEstimate" class="text-[14px] text-[#526b94]">
                    Salida estimada: {{ followUpDateLabel(workshopEstimate.releaseDate) }}
                  </span>
                </label>
                <label v-if="consultation.situation !== 'not_contacted'"
                  >Hablo con (opcional)
                  <input
                    v-model="consultation.contactedPerson"
                    type="text"
                    maxlength="100"
                    autocomplete="off"
                    placeholder="Nombre de la persona..."
                  />
                </label>
                <label v-if="consultation.situation !== 'not_contacted'"
                  >Cargo (opcional)
                  <input
                    v-model="consultation.contactedRole"
                    type="text"
                    maxlength="80"
                    autocomplete="off"
                    placeholder="Cargo de la persona..."
                  />
                </label>
              </div>
            </section>
            <section class="consultation-panel observation-panel">
              <h3><SvgIcon name="mail" />Observacion</h3>
              <label class="observation-field">
                <span class="sr-only">Observacion</span>
                <textarea
                  v-model="consultation.observation"
                  maxlength="500"
                  rows="3"
                  placeholder="Resultado de la llamada..."
                  aria-describedby="observation-count"
                ></textarea>
              </label>
              <span id="observation-count" class="observation-count"
                >{{ consultation.observation.length }}/500</span
              >
            </section>
          </div>
        </section>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <footer>
          <button
            v-if="
              !consultationOpen &&
              activeTab === 'general' &&
              demo &&
              equipment.mode === 'active' &&
              !equipment.archived
            "
            type="button"
            class="demo-report"
            @click="emit('simulate')"
          >
            Simular reporte (demo)
          </button>
          <template v-if="consultationOpen">
            <button type="button" @click="consultationOpen = false">Cancelar</button>
            <button
              class="primary"
              type="submit"
              :disabled="!consultation.situation || !consultation.decision"
            >
              <SvgIcon name="check" />{{ editingCall ? "Guardar cambios" : "Guardar consulta" }}
            </button>
          </template>
          <template v-else>
            <button type="button" @click="emit('close')">Cerrar</button>
            <button
              v-if="equipment.mode === 'active' && !equipment.archived"
              class="primary"
              type="button"
              @click="startConsultation"
            >
              Registrar consulta
            </button>
          </template>
        </footer>
      </form>
    </dialog></Teleport
  >
</template>
<script setup>
import { computed, onMounted, ref, watch } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"
import UnreportedCopyImei from "./UnreportedCopyImei.vue"
import { getAssetTypeLabel } from "../../utils/activos/assetTypeOptions.js"
import { describeUnreportedEvidence } from "../../utils/unreported/unreportedEvidence.js"
import {
  consultationSituations,
  consultationDecisionForSituation,
  consultationDecisions,
  currentConsultations,
  followUpDateLabel,
  visitResultLabel,
  consultationContactLabel,
} from "../../utils/unreported/unreportedFlow.js"
import { workshopSchedule } from "../../utils/unreported/unreportedWorkshop.js"
const situationLabel = (value) =>
  consultationSituations.find((option) => option.value === value)?.label || "Sin confirmar"
const decisionLabel = (value) =>
  consultationDecisions.find((option) => option.value === value)?.label || "Pendiente de confirmar"
const props = defineProps({
  equipment: { type: Object, required: true },
  error: { type: String, default: "" },
  demo: Boolean,
  vehicleImage: { type: String, default: "" },
  companyContact: { type: Object, default: () => ({ name: "", phone: "", href: "" }) },
})
const emit = defineEmits([
  "close",
  "consultation",
  "edit-consultation",
  "delete-consultation",
  "simulate",
])
const consultationOpen = ref(false)
const failedVehicleImage = ref("")
const editingCall = ref(null)
const deleteCandidate = ref(null)
const blankConsultation = () => ({
  situation: "",
  decision: "",
  observation: "",
  contactedPerson: "",
  contactedRole: "",
  workshopDays: "",
})
const consultation = ref(blankConsultation())
watch(
  () => consultation.value.situation,
  (situation) => {
    if (situation === "not_contacted") {
      consultation.value.contactedPerson = ""
      consultation.value.contactedRole = ""
    }
    if (situation !== "workshop") consultation.value.workshopDays = ""
    consultation.value.decision = consultationDecisionForSituation(situation)
  },
)
const caseCalls = computed(() => currentConsultations(props.equipment))
const workshopEstimate = computed(() =>
  consultation.value.situation === "workshop"
    ? workshopSchedule(consultation.value.workshopDays, editingCall.value?.createdAt || new Date())
    : null,
)
const lastEvidence = computed(() => describeUnreportedEvidence(props.equipment.telemetry))
const startConsultation = () => {
  editingCall.value = null
  deleteCandidate.value = null
  consultation.value = blankConsultation()
  consultationOpen.value = true
}
const editCall = (call) => {
  editingCall.value = call
  deleteCandidate.value = null
  consultation.value = {
    ...blankConsultation(),
    ...call,
    decision: consultationDecisionForSituation(call.situation),
  }
  consultationOpen.value = true
}
watch(
  () => props.equipment.consultations,
  () => {
    if (consultationOpen.value) activeTab.value = "consultations"
    consultationOpen.value = false
    editingCall.value = null
    deleteCandidate.value = null
  },
)
const activeTab = ref("general")
const dialog = ref(null)
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
const submit = () => {
  if (consultationOpen.value) {
    if (consultation.value.situation && consultation.value.decision)
      emit(editingCall.value ? "edit-consultation" : "consultation", {
        ...consultation.value,
        ...(editingCall.value ? { id: editingCall.value.id } : {}),
        workshopDays:
          consultation.value.situation === "workshop" ? consultation.value.workshopDays : "",
      })
    return
  }
}
onMounted(() => dialog.value.showModal())
</script>
<style scoped>
dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(1020px, calc(100vw - 48px));
  height: min(760px, calc(100dvh - 40px));
  max-width: calc(100vw - 24px);
  max-height: calc(100dvh - 24px);
  padding: 0;
  border: 1px solid #d8e0eb;
  border-radius: 8px;
  color: #10234c;
  background: white;
  box-shadow: 0 12px 28px rgb(15 35 80 / 18%);
}
dialog[open] {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
dialog::backdrop {
  background: #15202d99;
}
header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 24px 12px;
}
.heading,
.equipment-identity {
  min-width: 0;
}
.heading {
  flex: 1;
  overflow-wrap: anywhere;
}
.equipment-heading {
  display: flex;
  align-items: center;
  gap: 20px;
}
.equipment-symbol,
.contact-symbol {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 8px;
  background: #edf4ff;
}
.equipment-symbol {
  width: 48px;
  height: 48px;
  color: #2874db;
}
.equipment-symbol img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: inherit;
}
.equipment-symbol :deep(.svg-icon-wrapper) {
  width: 36px;
  height: 36px;
}
.title-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 14px;
}
h2 {
  font-size: 26px;
  line-height: 1.35;
  font-weight: 700;
  margin: 0;
  overflow-wrap: anywhere;
}
h2 span {
  font-weight: 400;
}
.identity {
  font-size: 16px;
  color: #7185a7;
  margin: 5px 0 0;
  overflow-wrap: anywhere;
}
.type-badge,
.status-badge {
  font-size: 13px;
  font-weight: 700;
  border-radius: 6px;
  padding: 7px 12px;
  max-width: 280px;
}
.type-badge {
  background: #e8f0ff;
}
.status-badge {
  background: #fff2e2;
  color: #875209;
}
.status-badge.is-reporting {
  background: #e0f3ec;
  color: #1c614d;
}
.company-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 26px;
  margin-top: 12px;
  font-size: 16px;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  overflow-wrap: anywhere;
}
.contact-item + .contact-item {
  border-left: 1px solid #d8e0eb;
  padding-left: 26px;
}
.contact-symbol {
  width: 36px;
  height: 36px;
  background: #f3f6fb;
}
.contact-symbol :deep(.svg-icon-wrapper) {
  width: 24px;
  height: 24px;
}
.contact-item strong {
  font-size: 13px;
  color: #526789;
}
.contact-item p {
  margin: 2px 0 0;
}
.company-contact a {
  color: #1766db;
  font-weight: 700;
  text-decoration: underline;
  display: inline-flex;
  align-items: center;
  min-height: 28px;
}
form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 0 24px 16px;
  overflow: hidden;
  font-size: 16px;
}
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 44px;
  border: 1px solid #ccd8eb;
  border-radius: 6px;
  padding: 10px 20px;
  background: white;
  color: #18325a;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.close-button {
  width: 46px;
  height: 46px;
  min-width: 46px;
  padding: 0;
}
button :deep(.svg-icon-wrapper) {
  width: 21px;
  height: 21px;
}
.primary {
  background: #2460d2;
  border-color: #2460d2;
  color: white;
}
button:disabled {
  cursor: default;
  opacity: 0.5;
}
button:focus-visible,
a:focus-visible,
summary:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid #3679e4;
  outline-offset: 2px;
}
.review-tabs {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid #d8e0eb;
}
.review-tabs button {
  padding: 10px 16px;
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: #7285a6;
  font-size: 16px;
}
.consultation-list select:disabled {
  background-color: #edf0f4;
  color: #64748b;
  border-color: #cbd5e1;
  cursor: not-allowed;
  opacity: 1;
  -webkit-text-fill-color: #64748b;
}
.review-tabs .selected {
  border-bottom-color: #236fff;
  color: #1263ed;
}
.review-tabs button:disabled {
  opacity: 1;
}
.consultation-list {
  display: grid;
  gap: 16px;
  flex: 1;
  min-height: 0;
  align-content: start;
  overflow-y: auto;
  padding: 2px 2px 8px;
}
.consultation-list.is-editing {
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  grid-auto-rows: minmax(min-content, auto);
  gap: 20px;
}
.consultation-left-column {
  display: grid;
  gap: 16px;
  align-content: start;
  min-width: 0;
}
.consultation-panel,
.visit-panel {
  border: 1px solid #dce5f1;
  border-radius: 8px;
  padding: 16px;
  min-width: 0;
  background: #fff;
}
.consultation-panel h3 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 14px;
  font-size: 18px;
  font-weight: 700;
}
.consultation-panel h3 :deep(.svg-icon-wrapper) {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}
.consultation-editor {
  display: grid;
  align-content: start;
  gap: 18px;
}
.consultation-main-fields {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 20px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
}
.consultation-list input,
.consultation-list select,
textarea {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  border: 1px solid #ccd8eb;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 16px;
  font-weight: 400;
  background: white;
  color: #233d65;
}
input::placeholder,
textarea::placeholder {
  color: #8093b1;
}
textarea {
  display: block;
  resize: none;
  height: 80px;
  min-height: 80px;
  max-height: 80px;
}
.observation-panel h3 {
  margin-bottom: 14px;
}
.observation-panel {
  position: relative;
  padding-bottom: 28px;
}
.observation-field > .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.observation-count {
  position: absolute;
  right: 16px;
  bottom: 6px;
  color: #8093b1;
  font-size: 13px;
}
.visit-column {
  min-width: 0;
  border-left: 1px solid #dce5f1;
  padding-left: 20px;
}
.visit-panel {
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
}
.visit-panel summary {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  list-style: none;
}
.visit-panel summary::-webkit-details-marker {
  display: none;
}
.visit-panel summary :deep(.svg-icon-wrapper) {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: #2874db;
}
.visit-panel summary .visit-chevron {
  margin-left: auto;
  width: 18px;
  height: 18px;
}
.visit-panel[open] .visit-chevron {
  transform: rotate(180deg);
}
.visit-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin: 20px 0;
  border: 1px solid #d7e8ff;
  border-radius: 6px;
  background: #f0f7ff;
  color: #526e99;
  font-size: 15px;
  overflow-wrap: anywhere;
}
.visit-status :deep(.svg-icon-wrapper) {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  color: #2874db;
}
footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  border-top: 1px solid #d8e0eb;
  margin-top: 12px;
  padding-top: 12px;
}
footer > button:first-child {
  margin-right: auto;
}
footer > button:only-child {
  margin-right: 0;
}
.demo-report {
  border: 0;
  padding-left: 0;
  color: #65748d;
  font-size: 12px;
}
.error {
  flex-shrink: 0;
  margin: 8px 0 0;
  color: #b51239;
}
.review-overview {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.review-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}
.review-facts dt,
.review-overview h3 {
  font-size: 14px;
  color: #65748d;
  font-weight: 700;
  margin-bottom: 8px;
}
.review-facts dd {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.review-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid #d8e0eb;
}
.gps-diagnosis {
  font-size: 16px;
  overflow-wrap: anywhere;
}
.gps-diagnosis p {
  margin-top: 8px;
  color: #65748d;
}
.last-evidence {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #d8e0eb;
}
.evidence-values {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
  margin-top: 12px;
}
.evidence-values dt {
  color: #65748d;
  font-size: 14px;
}
.evidence-values dd {
  margin: 4px 0 0;
  font-weight: 700;
}
.evidence-date,
.evidence-caution {
  font-size: 14px;
}
@media (max-width: 540px) {
  .evidence-values {
    grid-template-columns: minmax(0, 1fr);
  }
}
.follow-up-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  font-size: 16px;
  overflow-wrap: anywhere;
}
.follow-up-panel small {
  display: block;
  margin-top: 8px;
  color: #65748d;
}
.consultation-record {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr) 160px;
  gap: 24px;
  padding: 20px;
  background: #fff;
  border: 1px solid #dce5f1;
  border-radius: 8px;
}
.consultation-record p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.5;
}
.consultation-meta {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #29456f;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.consultation-decision {
  display: block;
  margin-top: 8px;
  font-size: 15px;
}
.consultation-actions {
  display: flex;
  flex-direction: column;
  border-left: 1px solid #d8e0eb;
  padding-left: 20px;
  gap: 8px;
  margin: 0;
}
.consultation-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.consultation-actions :deep(svg) {
  width: 16px;
  height: 16px;
}
.delete-confirmation {
  grid-column: 1 / -1;
  padding: 12px;
  margin: 12px 0;
  border: 1px solid #f4b4b4;
  border-radius: 6px;
  background: #fff5f5;
}
.delete-confirmation button {
  margin: 8px 8px 0 0;
}
.consultations-heading {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  background: #eef4ff;
  border-radius: 8px;
}
.consultations-heading h3 {
  margin: 0;
  font-size: 17px;
}
.consultations-symbol {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border-radius: 50%;
  background: #e8f0ff;
  color: #1260eb;
}
.consultations-symbol :deep(svg) {
  width: 24px;
  height: 24px;
}
.consultations-count {
  margin-left: auto;
  padding: 8px 12px;
  border-radius: 6px;
  background: #dbe8ff;
  color: #0659da;
  font-size: 13px;
  font-weight: 700;
}
.consultation-author {
  min-width: 0;
  display: grid;
  gap: 8px;
}
.consultation-author > span,
.consultation-information span {
  color: #657b9b;
  font-size: 14px;
}
.consultation-author > strong {
  color: #10234c;
  font-size: 16px;
}
.consultation-author time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}
.consultation-author time :deep(svg) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.consultation-author small {
  font-size: 12px;
}
.consultation-information {
  min-width: 0;
  border-left: 1px solid #d8e0eb;
  padding-left: 24px;
}
.consultation-situation {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
}
.consultation-situation :deep(svg) {
  width: 22px;
  height: 22px;
}
.consultation-situation strong,
.consultation-field-label {
  display: block;
  margin-top: 4px;
}
.consultation-outcome {
  margin-top: 10px;
}
.consultation-outcome .consultation-decision {
  margin-top: 4px;
}
@media (max-width: 800px) {
  .consultation-record {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .consultation-information {
    border-left: 0;
    border-top: 1px solid #d8e0eb;
    padding: 12px 0 0;
  }
  .consultation-actions {
    flex-direction: row;
    border-left: 0;
    padding-left: 0;
    flex-wrap: wrap;
  }
  .consultations-heading {
    flex-wrap: wrap;
  }
  .consultations-count {
    margin-left: 0;
  }
}
@media (max-width: 980px) {
  .consultation-list.is-editing {
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
  }
  .visit-column {
    border-left: 0;
    padding-left: 0;
  }
  .visit-panel {
    min-height: 0;
  }
}
@media (max-width: 540px) {
  dialog {
    width: calc(100vw - 24px);
    height: calc(100dvh - 24px);
  }
  header {
    padding: 18px 16px;
    gap: 12px;
  }
  form {
    padding: 0 16px 16px;
  }
  h2 {
    font-size: 21px;
  }
  .equipment-symbol {
    width: 44px;
    height: 44px;
  }
  .equipment-symbol :deep(.svg-icon-wrapper) {
    width: 28px;
    height: 28px;
  }
  .equipment-heading {
    gap: 12px;
  }
  .company-contact {
    gap: 10px;
  }
  .contact-item + .contact-item {
    border-left: 0;
    padding-left: 0;
  }
  .consultation-main-fields,
  .review-facts,
  .review-status-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .consultation-panel,
  .visit-panel {
    padding: 16px;
  }
  .review-tabs button {
    padding-inline: 8px;
    font-size: 15px;
  }
  .type-badge,
  .status-badge {
    font-size: 12px;
    padding: 5px 8px;
  }
  .close-button {
    width: 40px;
    height: 40px;
    min-width: 40px;
  }
}
@media (max-height: 800px) and (min-width: 981px) {
  header {
    padding-block: 18px 12px;
  }
  .company-contact {
    margin-top: 12px;
  }
  .equipment-symbol {
    width: 52px;
    height: 52px;
  }
  .review-tabs {
    margin-bottom: 16px;
  }
  .consultation-panel,
  .visit-panel {
    padding: 16px;
  }
  .consultation-main-fields {
    gap: 14px 20px;
  }
  .consultation-panel h3 {
    margin-bottom: 14px;
  }
  .consultation-left-column {
    gap: 16px;
  }
  textarea {
    height: 80px;
  }
}
@media (max-height: 900px) and (min-width: 981px) {
  header {
    padding-block: 14px 10px;
  }
  .company-contact {
    margin-top: 8px;
  }
  .contact-symbol {
    width: 28px;
    height: 28px;
  }
  .contact-item > div {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .contact-item p {
    margin: 0;
  }
  .company-contact a {
    min-height: 24px;
  }
}
</style>
