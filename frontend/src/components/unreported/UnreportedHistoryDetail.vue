<template>
  <section
    class="flex min-h-0 flex-1 flex-col text-[#102372]"
    aria-label="Desconexiones del equipo"
  >
    <div class="history-scroll min-h-0 flex-1 overflow-auto">
      <header
        class="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe3ee] py-4"
      >
        <div>
          <button type="button" class="back-button" @click="$emit('back')">
            <SvgIcon name="chevron-left" class="h-5 w-5" />Volver a resultados
          </button>
          <h2 class="mt-3 text-[22px] font-bold">{{ equipment.name }}</h2>
          <p class="mt-1 text-[15px] text-[#526b94]">
            {{ equipment.company }} · <UnreportedCopyImei :imei="String(equipment.imei)" />
          </p>
          <p class="mt-2 font-bold">
            {{ equipment.completedCount }}
            {{
              equipment.completedCount === 1 ? "desconexion terminada" : "desconexiones terminadas"
            }}<span v-if="equipment.completedCount !== equipment.totalCompletedCount">
              de {{ equipment.totalCompletedCount }} en total</span
            >
          </p>
          <p
            v-if="equipment.mode === 'active' && !equipment.archived"
            class="mt-2 font-bold text-red-700"
          >
            Actualmente sin reportar
          </p>
        </div>
      </header>
      <button
        v-if="demo && !equipment.archived && ['recovered', 'reporting'].includes(equipment.mode)"
        type="button"
        class="my-3 self-start"
        @click="$emit('simulate-disconnection')"
      >
        Simular nueva desconexion (demo)
      </button>
      <table class="history-table w-full min-w-[720px] border-collapse text-left text-[15px]">
        <colgroup>
          <col style="width: 20%" />
          <col style="width: 19%" />
          <col style="width: 16%" />
          <col style="width: 45%" />
        </colgroup>
        <thead class="bg-[#f7f9fc]">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :aria-sort="
                sort.key === column.key
                  ? sort.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              "
            >
              <button type="button" class="sort-button" @click="toggleSort(column.key)">
                {{ column.label
                }}<SvgIcon
                  :name="
                    sort.key === column.key && sort.direction === 'asc'
                      ? 'chevron-up'
                      : 'chevron-down'
                  "
                  class="h-4 w-4 shrink-0"
                />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in presentedRows" :key="item.id">
            <td colspan="4" class="episode-cell">
              <details
                class="episode-dropdown"
                :open="item.open"
                @toggle="item.open = $event.target.open"
              >
                <summary
                  class="episode-summary"
                  :aria-label="'Ver informacion de la desconexion del ' + item.startLabel"
                >
                  <span class="font-bold">{{ item.startLabel }}</span>
                  <span>{{ item.recoveryLabel }}</span>
                  <strong>{{ item.durationLabel }}</strong>
                  <span class="episode-preview"
                    ><span class="diagnosis-name"
                      ><span v-if="item.readings.length" class="power-dot" aria-hidden="true" />{{
                        item.diagnosis.reason
                      }}</span
                    ><SvgIcon name="chevron-down" class="episode-chevron h-5 w-5 shrink-0"
                  /></span>
                </summary>
                <div v-if="item.open" class="episode-information">
                  <section class="gps-information">
                    <h3>Dato del GPS</h3>
                    <strong class="diagnosis-name"
                      ><span v-if="item.readings.length" class="power-dot" aria-hidden="true" />{{
                        item.diagnosis.reason
                      }}</strong
                    >
                    <dl v-if="item.readings.length" class="power-readings">
                      <div v-for="reading in item.readings" :key="reading.label">
                        <dt>{{ reading.label }}</dt>
                        <dd>{{ reading.value }}</dd>
                      </div>
                    </dl>
                    <p v-else>{{ item.diagnosis.evidence }}</p>
                  </section>
                  <section class="calls-information">
                    <h3>Llamadas a la empresa ({{ item.calls.length }})</h3>
                    <article v-for="call in item.calls" :key="call.id" class="episode-call">
                      <strong>{{ call.dateLabel }} · {{ call.author }}</strong>
                      <dl>
                        <div>
                          <dt>Situacion informada</dt>
                          <dd>{{ call.situationLabel }}</dd>
                        </div>
                        <div>
                          <dt>Decision</dt>
                          <dd>{{ call.decisionLabel }}</dd>
                        </div>
                      </dl>
                      <p v-if="call.observation">{{ call.observation }}</p>
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
                    </article>
                    <p v-if="!item.calls.length" class="text-[#526b94]">
                      Sin llamada registrada para este caso
                    </p>
                  </section>
                </div>
              </details>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <footer
      class="flex flex-wrap items-center justify-between gap-3 border-t border-[#dbe3ee] py-3 text-[15px]"
    >
      <span>{{ firstRow }} a {{ lastRow }} de {{ equipment.completedCount }} desconexiones</span>
      <div class="flex items-center gap-3">
        <select v-model.number="pageSize" aria-label="Desconexiones por pagina">
          <option :value="5">5 por pagina</option>
          <option :value="10">10 por pagina</option>
          <option :value="20">20 por pagina</option>
        </select>
        <button
          type="button"
          aria-label="Pagina anterior"
          :disabled="currentPage === 1"
          @click="changePage(-1)"
        >
          <SvgIcon name="chevron-left" class="h-5 w-5" />
        </button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button
          type="button"
          aria-label="Pagina siguiente"
          :disabled="currentPage === totalPages"
          @click="changePage(1)"
        >
          <SvgIcon name="chevron-right" class="h-5 w-5" />
        </button>
      </div>
    </footer>
  </section>
</template>
<script setup>
import { computed, ref } from "vue"
import { compareUnreportedColumn } from "../../utils/unreported/unreportedSorting.js"
import SvgIcon from "../icons/SvgIcon.vue"
import UnreportedCopyImei from "./UnreportedCopyImei.vue"
import { useUnreportedPagination } from "../../composables/unreported/useUnreportedPagination.js"
import { useUnreportedHistoryPresentation } from "../../composables/unreported/useUnreportedHistoryPresentation.js"
import {
  followUpDateLabel,
  visitResultLabel,
  consultationContactLabel,
} from "../../utils/unreported/unreportedFlow.js"
const props = defineProps({ equipment: { type: Object, required: true }, demo: Boolean })
defineEmits(["back", "simulate-disconnection"])
const columns = [
  { key: "historyCount", label: "Dejo de reportar" },
  { key: "historyRecovery", label: "Volvio a reportar" },
  { key: "historyDuration", label: "Duracion" },
  { key: "historyReason", label: "Dato GPS / llamada" },
]
const sort = ref({ key: "", direction: "asc" })
const toggleSort = (key) => {
  sort.value =
    sort.value.key !== key
      ? { key, direction: "asc" }
      : sort.value.direction === "asc"
        ? { key, direction: "desc" }
        : { key: "", direction: "asc" }
}
const episodes = computed(() =>
  sort.value.key
    ? [...props.equipment.interruptions].sort((a, b) =>
        compareUnreportedColumn(
          { episode: a },
          { episode: b },
          sort.value.key,
          sort.value.direction,
        ),
      )
    : props.equipment.interruptions,
)
const { pageSize, currentPage, totalPages, visibleRows, firstRow, lastRow, changePage } =
  useUnreportedPagination(episodes, [sort])
pageSize.value = 20
const presentedRows = useUnreportedHistoryPresentation(visibleRows, () => props.equipment)
</script>
<style scoped>
.history-table {
  table-layout: fixed;
}
.history-table .episode-cell {
  padding: 0;
}
.episode-summary {
  display: grid;
  grid-template-columns: 20% 19% 16% 45%;
  min-height: 52px;
  align-items: center;
  list-style: none;
  cursor: pointer;
}
.episode-summary::-webkit-details-marker {
  display: none;
}
.episode-summary > span,
.episode-summary > strong {
  padding: 14px 16px;
  overflow-wrap: anywhere;
  min-width: 0;
}
.episode-summary:hover,
.episode-dropdown[open] > summary {
  background: #f0f5fc;
}
.episode-summary:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: -3px;
}
.episode-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 700;
}
.episode-dropdown[open] .episode-chevron {
  transform: rotate(180deg);
}
.episode-information {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.7fr);
  gap: 40px;
  padding: 28px 36px;
  background: #fff;
}
.episode-information h3 {
  margin-bottom: 14px;
  font-size: 16px;
  font-weight: 700;
}
.episode-information p {
  margin-top: 10px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.gps-information {
  min-width: 0;
}
.calls-information {
  min-width: 0;
  border-left: 1px solid #dbe3ee;
  padding-left: 40px;
}
.diagnosis-name {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.power-dot {
  height: 12px;
  width: 12px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #ff7900;
}
.power-readings {
  margin-top: 18px;
}
.power-readings > div {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  gap: 6px;
  margin-top: 8px;
}
.power-readings dt {
  color: #526b94;
}
.power-readings dd {
  font-weight: 700;
}
.episode-call + .episode-call {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dbe3ee;
}
.episode-call dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 6px;
}
.episode-call dt {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.episode-call dd {
  font-weight: 600;
}
@media (max-width: 900px) {
  .episode-information {
    grid-template-columns: minmax(0, 1fr);
  }
  .calls-information {
    border-left: 0;
    padding-left: 0;
    border-top: 1px solid #dbe3ee;
    padding-top: 20px;
  }
}

th,
td {
  padding: 18px 14px;
  border-bottom: 1px solid #dbe3ee;
  vertical-align: top;
}
th {
  font-size: 14px;
  padding: 8px 16px;
}
.sort-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  padding: 0;
  text-align: left;
  font-weight: 700;
  background: transparent;
  min-height: 36px;
}
button,
select {
  min-height: 44px;
  border: 1px solid #d5deea;
  border-radius: 6px;
  padding: 8px 12px;
  background: white;
  color: #102372;
  cursor: pointer;
}
.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}
button:disabled {
  opacity: 0.4;
  cursor: default;
}
button:focus-visible,
select:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
}
</style>
