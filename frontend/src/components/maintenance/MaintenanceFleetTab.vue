<template>
  <section class="overview-layout">
    <aside class="filter-panel">
      <header>
        <h2><SvgIcon name="filter-main" /> Filtros</h2>
        <button type="button" class="clear-header" @click="clearLocalFilters">
          Limpiar filtros
        </button>
      </header>
      <div class="filter-body">
        <label class="filter-search">
          <SvgIcon name="search" />
          <input v-model="searchModel" type="search" placeholder="Buscar vehiculo..." />
        </label>
        <fieldset>
          <legend>Estado de mantencion</legend>
          <button
            v-for="option in statusOptions"
            :key="option.key"
            type="button"
            :class="{ active: activeStatuses.includes(option.key) }"
            @click="selectStatus(option.key)"
          >
            <span class="status-option-label"><i :class="option.color" />{{ option.label }}</span>
            <span class="status-option-count">{{ statusCount(option.key) }}</span>
          </button>
        </fieldset>
        <label class="select-field"
          ><span>Tipo de mantencion</span
          ><select v-model="selectedTypeModel">
            <option value="all">Todas</option>
            <option v-for="type in maintenanceTypes" :key="type" :value="type">{{ type }}</option>
          </select></label
        >
        <label class="select-field"
          ><span>Empresa</span
          ><select v-model="selectedCompany">
            <option value="all">Todas</option>
            <option :value="activeCompanyLabel">{{ activeCompanyLabel }}</option>
          </select></label
        >
        <label class="select-field"
          ><span>Tipo de vehiculo</span
          ><select v-model="selectedVehicleType">
            <option value="all">Todos</option>
            <option value="Vehiculo menor">Vehiculo menor</option>
            <option value="Camion">Camion</option>
          </select></label
        >
        <fieldset class="date-range-field">
          <legend>Fecha de vencimiento</legend>
          <label><span>Desde</span><input v-model="dueDateFrom" type="date" /></label>
          <label><span>Hasta</span><input v-model="dueDateTo" type="date" /></label>
        </fieldset>
      </div>
    </aside>

    <main class="overview-main">
      <section class="maintenance-table">
        <header>
          <div>
            <h2>Listado de mantenciones</h2>
          </div>
          <div ref="columnMenuRoot" class="table-controls">
            <button
              type="button"
              class="columns-button"
              :aria-expanded="showColumnMenu"
              @click="toggleColumnMenu"
            >
              <SvgIcon name="tables" /> Columnas
              <SvgIcon name="chevron-right" class="columns-chevron" />
            </button>
            <div v-if="showColumnMenu" class="columns-menu">
              <strong>Columnas visibles</strong>
              <button
                v-for="column in configurableColumns"
                :key="column.key"
                type="button"
                :class="{ active: isColumnVisible(column.key) }"
                @click="toggleColumn(column.key)"
              >
                <span><SvgIcon v-if="isColumnVisible(column.key)" name="check" /></span>
                {{ column.label }}
              </button>
            </div>
          </div>
        </header>
        <div ref="tableScroll" class="table-scroll">
          <table>
            <colgroup>
              <col class="col-vehicle" />
              <col v-if="isColumnVisible('due')" class="col-maintenance" />
              <col v-if="isColumnVisible('status')" class="col-status" />
              <col v-if="isColumnVisible('due')" class="col-interval" />
              <col v-if="isColumnVisible('mileage')" class="col-mileage" />
              <col v-if="isColumnVisible('actions')" class="col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th v-for="column in visibleSortableColumns" :key="column.key" :aria-sort="fleetSort.key === column.key ? (fleetSort.direction === 1 ? 'ascending' : 'descending') : 'none'">
                  <button type="button" class="fleet-sort-button" @click="sortFleet(column.key)">
                    {{ column.label }}
                    <SvgIcon :name="fleetSort.key === column.key && fleetSort.direction === 1 ? 'chevron-up' : 'chevron-down'" />
                  </button>
                </th>
                <th v-if="isColumnVisible('actions')" class="actions-column">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="{ item, index } in fleetPagination.rows" :key="item.id">
                <tr :class="{ 'vehicle-row-expanded': isVehicleExpanded(item.id) }">
                  <td>
                    <div class="vehicle-cell">
                      <button
                        type="button"
                        class="vehicle-expand-button"
                        :title="
                          isVehicleExpanded(item.id) ? 'Ocultar mantenciones' : 'Ver mantenciones'
                        "
                        @click="toggleVehiclePlans(item.id)"
                      >
                        <SvgIcon
                          :name="isVehicleExpanded(item.id) ? 'chevron-down' : 'chevron-right'"
                        />
                      </button>
                      <span>
                        <img
                          v-if="loadedVehicleImages.includes(getVehicleImage(item))"
                          :src="getVehicleImage(item)"
                          width="46"
                          height="36"
                          decoding="async"
                          alt=""
                        />
                        <SvgIcon v-else name="vehiculos" class="vehicle-image-placeholder" />
                      </span>
                      <div>
                        <strong>{{ item.plate }}</strong
                        ><b>{{ vehicleKind(index) }}</b>
                      </div>
                    </div>
                  </td>
                  <td v-if="isColumnVisible('due')">
                    <strong>{{ vehicleMaintenances(item, index).length }} planes</strong>
                    <small class="plans-attention-count"
                      >{{ attentionPlanCount(item, index) }} requieren atencion</small
                    >
                  </td>
                  <td v-if="isColumnVisible('status')">
                    <span
                      class="status-pill"
                      :class="getStatusClass(priorityMaintenance(item, index).status)"
                      >● {{ getStatusLabel(priorityMaintenance(item, index).status) }}</span
                    >
                  </td>
                  <td v-if="isColumnVisible('due')">
                    <div class="next-maintenance-cell">
                      <strong>{{ priorityMaintenance(item, index).name }}</strong>
                      <span>{{ priorityMaintenance(item, index).date }}</span>
                      <small :class="getStatusTextClass(priorityMaintenance(item, index).status)">
                        {{ priorityMaintenance(item, index).detail }}
                      </small>
                    </div>
                  </td>
                  <td v-if="isColumnVisible('mileage')">
                    <div class="mileage-cell">
                      <div>
                        <strong>{{ item.odometerLabel }}</strong
                        ><small>Ultimo registro</small>
                      </div>
                    </div>
                  </td>
                  <td v-if="isColumnVisible('actions')" class="actions-column">
                    <div class="row-actions">
                      <button class="review-plans-button" @click="toggleVehiclePlans(item.id)">
                        {{ isVehicleExpanded(item.id) ? "Ocultar planes" : "Revisar planes" }}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="isVehicleExpanded(item.id)" class="vehicle-plans-row">
                  <td :colspan="visibleColumnCount">
                    <section class="vehicle-plans-panel">
                      <header>
                        <h3>Planes de mantención - {{ item.plate }}</h3>
                        <button
                          type="button"
                          class="plans-detail-button"
                          @click.stop="emit('open-vehicle-maintenance-plans', item.id)"
                        >
                          <SvgIcon name="eye" /> Ver detalle completo
                        </button>
                      </header>
                      <div class="vehicle-plans-table-wrap">
                        <table class="vehicle-plans-table">
                          <thead>
                            <tr>
                              <th>Mantención</th>
                              <th>Criterio</th>
                              <th>Última ejecución</th>
                              <th>Próximo vencimiento</th>
                              <th>Restante</th>
                              <th>Estado</th>
                              <th>Siguiente acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-if="!vehicleMaintenances(item, index).length"
                              class="vehicle-plans-empty-row"
                            >
                              <td colspan="7">
                                <div class="vehicle-plans-empty">
                                  <span>Este vehículo aún no tiene planes de mantención.</span>
                                  <button
                                    type="button"
                                    class="plan-action-button primary"
                                    @click="emit('configure-maintenance', item.id)"
                                  >
                                    Agregar primer plan
                                  </button>
                                </div>
                              </td>
                            </tr>
                            <tr v-for="plan in vehicleMaintenances(item, index)" :key="plan.id">
                              <td>
                                <button
                                  type="button"
                                  class="plan-detail-link"
                                  @click.stop="emit('open-vehicle-maintenance-plans', item.id)"
                                >
                                  {{ plan.name }}
                                </button>
                              </td>
                              <td>{{ plan.criterion }}</td>
                              <td>{{ plan.lastReading }}</td>
                              <td :class="getStatusTextClass(plan.status)">{{ plan.date }}</td>
                              <td :class="getStatusTextClass(plan.status)">{{ plan.detail }}</td>
                              <td>
                                <span class="status-pill" :class="getStatusClass(plan.status)"
                                  >● {{ getStatusLabel(plan.status) }}</span
                                >
                              </td>
                              <td>
                                <span
                                  v-if="nextPlanAction(plan).type === 'none'"
                                  class="plan-no-action"
                                >
                                  Sin acción
                                </span>
                                <button
                                  v-else
                                  type="button"
                                  class="plan-action-button"
                                  :class="{ primary: nextPlanAction(plan).primary }"
                                  @click="runPlanAction(item, plan)"
                                >
                                  {{ nextPlanAction(plan).label }}
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </td>
                </tr>
              </template>
              <tr v-if="!fleetPagination.total">
                <td :colspan="visibleColumnCount" class="fleet-empty-result">No se encontraron vehiculos.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer>
          <span
            >Mostrando {{ fleetPagination.start }} a {{ fleetPagination.end }} de
            {{ fleetPagination.total }} vehiculos</span
          >
          <div>
            <button type="button" title="Pagina anterior" aria-label="Pagina anterior" :disabled="fleetPagination.page === 1" @click="fleetPage--"><SvgIcon name="chevron-left" /></button>
            <button v-for="number in fleetPageNumbers" :key="number" type="button" :class="{ active: fleetPagination.page === number }" :aria-current="fleetPagination.page === number ? 'page' : undefined" :aria-label="'Pagina ' + number" @click="fleetPage = number">{{ number }}</button>
            <span class="fleet-page-count">{{ fleetPagination.page }} / {{ fleetPagination.pageCount }}</span>
            <button type="button" title="Pagina siguiente" aria-label="Pagina siguiente" :disabled="fleetPagination.page === fleetPagination.pageCount" @click="fleetPage++"><SvgIcon name="chevron-right" /></button>
            <select v-model.number="fleetPageSize" aria-label="Vehiculos por pagina">
              <option v-for="size in [10, 20, 50]" :key="size" :value="size">{{ size }} por pagina</option>
            </select>
          </div>
        </footer>
      </section>
    </main>
  </section>
</template>

<script setup>
import { computed, onActivated, onDeactivated, onBeforeUnmount, onMounted, ref, watch } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"
import vehicleBlueCar from "../../assets/map/vehicle-blue-car.png"
import vehicleBlueTruck from "../../assets/map/vehicle-blue-truck.png"
import { buildFleetOrderIndex, findFleetOpenOrder } from "./fleetOrderIndex.js"
import { getFleetPage } from "./fleetPagination.js"

const props = defineProps({
  activeCompanyLabel: { type: String, default: "Flota" },
  filteredMaintenanceItems: { type: Array, default: () => [] },
  getStatusClass: { type: Function, required: true },
  getStatusLabel: { type: Function, required: true },
  getStatusTextClass: { type: Function, required: true },
  getVehicleMaintenancePlans: { type: Function, required: true },
  getOrderStatusLabel: { type: Function, required: true },
  maintenanceItems: { type: Array, default: () => [] },
  maintenanceTypes: { type: Array, default: () => [] },
  openOrderCount: { type: Number, default: 0 },
  searchTerm: { type: String, default: "" },
  selectedType: { type: String, default: "all" },
  selectedStatus: { type: String, default: "all" },
  workOrders: { type: Array, default: () => [] },
})
const emit = defineEmits([
  "clear-filters",
  "configure-maintenance",
  "create-work-order",
  "open-orders",
  "renew-maintenance",
  "open-vehicle-maintenance-plans",
  "open-work-order",
  "update:search-term",
  "update:selected-status",
  "update:selected-type",
])
const activeStatuses = ref(["all"])
const showColumnMenu = ref(false)
const columnMenuRoot = ref(null)
const activeMaintenanceMenu = ref(null)
const expandedVehicleIds = ref([])
const selectedMaintenanceByVehicle = ref({})
const dueDateFrom = ref("")
const dueDateTo = ref("")
const selectedCompany = ref("all")
const selectedVehicleType = ref("all")
const configurableColumns = [
  { key: "due", label: "Mantencion e intervalo" },
  { key: "mileage", label: "Kilometraje" },
  { key: "status", label: "Estado" },
  { key: "actions", label: "Acciones" },
]
const visibleColumns = ref(configurableColumns.map((column) => column.key))
const visibleColumnCount = computed(
  () =>
    1 +
    (isColumnVisible("due") ? 2 : 0) +
    (isColumnVisible("mileage") ? 1 : 0) +
    (isColumnVisible("status") ? 1 : 0) +
    (isColumnVisible("actions") ? 1 : 0),
)
const isColumnVisible = (columnKey) => visibleColumns.value.includes(columnKey)
const toggleColumn = (columnKey) => {
  visibleColumns.value = isColumnVisible(columnKey)
    ? visibleColumns.value.filter((key) => key !== columnKey)
    : [...visibleColumns.value, columnKey]
}
const toggleColumnMenu = () => {
  activeMaintenanceMenu.value = null
  showColumnMenu.value = !showColumnMenu.value
}
const closeMenusOnOutsideClick = (event) => {
  if (showColumnMenu.value && !columnMenuRoot.value?.contains(event.target)) {
    showColumnMenu.value = false
  }
  if (!event.target.closest?.(".maintenance-selector")) {
    activeMaintenanceMenu.value = null
  }
}

onMounted(() => document.addEventListener("pointerdown", closeMenusOnOutsideClick))
onActivated(() => document.addEventListener("pointerdown", closeMenusOnOutsideClick))
onDeactivated(() => {
  document.removeEventListener("pointerdown", closeMenusOnOutsideClick)
  showColumnMenu.value = false
  activeMaintenanceMenu.value = null
})
onBeforeUnmount(() => document.removeEventListener("pointerdown", closeMenusOnOutsideClick))
const searchModel = computed({
  get: () => props.searchTerm,
  set: (value) => emit("update:search-term", value),
})
const selectedTypeModel = computed({
  get: () => props.selectedType,
  set: (value) => emit("update:selected-type", value),
})
watch(
  () => props.selectedStatus,
  (status) => {
    activeStatuses.value = [status || "all"]
  },
  { immediate: true },
)
const statusOptions = [
  { key: "all", label: "Todos", color: "bg-blue-600" },
  { key: "renewal-pending", label: "Sin renovar", color: "bg-violet-500" },
  { key: "current", label: "Al dia", color: "bg-emerald-500" },
  { key: "due", label: "Proxima", color: "bg-amber-500" },
  { key: "overdue", label: "Vencida", color: "bg-rose-600" },
  { key: "unconfigured", label: "Sin configurar", color: "bg-slate-400" },
]
const statusCount = (status) =>
  status === "all"
    ? props.maintenanceItems.length
    : props.maintenanceItems.filter((item) => {
        if (status === "renewal-pending") {
          return fleetRows.value.get(item.id)?.pendingRenewal
        }
        return item.status === status
      }).length
const displayedItems = computed(() => {
  const statuses =
    activeStatuses.value.includes("all") || !activeStatuses.value.length ? [] : activeStatuses.value
  const from = dueDateFrom.value ? new Date(`${dueDateFrom.value}T00:00:00`) : null
  const to = dueDateTo.value ? new Date(`${dueDateTo.value}T23:59:59`) : null
  return props.filteredMaintenanceItems.filter((item, index) => {
    const selectedDueDate = parseDisplayDate(selectedMaintenance(item, index).date)

    return (
      (!statuses.length ||
        statuses.includes(item.status) ||
        (statuses.includes("renewal-pending") &&
          fleetRows.value.get(item.id)?.pendingRenewal)) &&
      (selectedCompany.value === "all" ||
        item.companyName === selectedCompany.value ||
        (!item.companyName && selectedCompany.value === props.activeCompanyLabel)) &&
      (selectedVehicleType.value === "all" || vehicleKind(index) === selectedVehicleType.value) &&
      (!from || selectedDueDate >= from) &&
      (!to || selectedDueDate <= to)
    )
  })
})
const loadedVehicleImages = ref([])
const fleetSort = ref({ key: '', direction: 1 })
const visibleSortableColumns = computed(() => [
  { key: 'plate', label: 'Vehiculo' },
  ...(isColumnVisible('due') ? [{ key: 'plans', label: 'Planes' }] : []),
  ...(isColumnVisible('status') ? [{ key: 'status', label: 'Estado' }] : []),
  ...(isColumnVisible('due') ? [{ key: 'due', label: 'Proximo vencimiento' }] : []),
  ...(isColumnVisible('mileage') ? [{ key: 'odometer', label: 'Lectura actual' }] : []),
])
const sortFleet = (key) => {
  fleetSort.value = { key, direction: fleetSort.value.key === key ? -fleetSort.value.direction : 1 }
}
const sortedFleetItems = computed(() => {
  if (!fleetSort.value.key) return displayedItems.value
  const valueFor = (item) => {
    const index = fleetRows.value.get(item.id)?.index ?? 0
    switch (fleetSort.value.key) {
      case 'plans': return vehicleMaintenances(item, index).length
      case 'status': return props.getStatusLabel(priorityMaintenance(item, index).status)
      case 'due': {
        const value = priorityMaintenance(item, index).date
        const date = parseDisplayDate(value)
        return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime()
      }
      case 'odometer': return Number(item.odometer || 0)
      default: return String(item.plate || '')
    }
  }
  return displayedItems.value.map((item) => ({ item, value: valueFor(item) })).sort((first, second) => {
    const a = first.value
    const b = second.value
    return fleetSort.value.direction * (typeof a === 'number' ? (a === b ? 0 : a < b ? -1 : 1) : a.localeCompare(b, 'es', { numeric: true }))
  }).map(({ item }) => item)
})
const getVehicleImage = (item) => {
  const name = String(item.assetName || "").toLowerCase()
  return /camion|truck|volvo|scania/.test(name) ? vehicleBlueTruck : vehicleBlueCar
}
defineExpose({
  getExportRows: (all = false) => (all ? props.maintenanceItems : sortedFleetItems.value).map((item) => {
    const index = fleetRows.value.get(item.id)?.index ?? 0
    return {
      plate: item.plate,
      id: item.id,
      name: item.assetName,
      company: item.companyName || props.activeCompanyLabel,
      odometer: item.odometer,
      hourMeter: item.hourMeterLabel || "-",
      plans: vehicleMaintenances(item, index).map(plan => ({
        name: plan.name,
        criterion: plan.criterion,
        interval: plan.interval || "-",
        alert: plan.alert || "-",
        currentReading: plan.currentReading || "-",
        lastReading: plan.lastReading,
        nextDue: plan.date,
        remaining: plan.detail,
        status: props.getStatusLabel(plan.status),
        statusCode: plan.status,
        order: plan.order?.id || "Sin OT",
        orderStatus: plan.order ? props.getOrderStatusLabel(plan.order.status) : "-",
      })),
    }
  }),
})
onMounted(() => {
  for (const source of [vehicleBlueCar, vehicleBlueTruck]) {
    const preview = new Image()
    preview.onload = async () => {
      try {
        await preview.decode()
      } catch {
        // A loaded image can still render when decoding is unsupported.
      }
      loadedVehicleImages.value = [...loadedVehicleImages.value, source]
    }
    preview.src = source
  }
})
const vehicleKind = (index) => (index % 2 ? "Camion" : "Vehiculo menor")
const dueDate = (index) => ["17/08/2026", "20/08/2026", "07/08/2026"][index % 3]
const parseDisplayDate = (value) => {
  const [day, month, year] = String(value).split("/").map(Number)
  return new Date(year, month - 1, day)
}
const dueDetail = (item, index) =>
  String(item.nextDueLabel || "")
    .replace(dueDate(index), "")
    .trim()
    .replace(/^[-·]\s*/, "")
const openOrderIndex = computed(() => buildFleetOrderIndex(props.workOrders))
const buildVehicleMaintenances = (item, index) => {
  const actualPlans = props.getVehicleMaintenancePlans(item)

  if (actualPlans.length) {
    return actualPlans.map((plan) => {
      const order = findFleetOpenOrder(openOrderIndex.value, item.id, plan.id, plan.name || plan.type)

      return {
        id: plan.id,
        interval: plan.intervalLabel || "-",
        alert: plan.alertLabel || "-",
        currentReading: plan.actualLabel || "-",
        name: plan.name || plan.type,
        status: plan.status,
        criterion:
          plan.readingSourceLabel === "Fecha/Hora"
            ? "Tiempo"
            : plan.readingSourceLabel || "Odometro",
        date: plan.nextLabel || "-",
        detail: plan.remainingLabel || plan.summaryLabel || "-",
        lastReading:
          plan.lastLabel && plan.lastLabel !== "Dato base" ? plan.lastLabel : "Sin ejecuciones",
        order,
        orderState: plan.orderState,
      }
    })
  }

  const names = [item.nextJob, ...props.maintenanceTypes].filter(
    (name, position, values) => name && values.indexOf(name) === position,
  )
  const declaredCount = Number(item.activeMaintenanceCount) || 0
  const count = Math.max(
    0,
    Math.min(item.status === "unconfigured" ? declaredCount : declaredCount || 1, names.length),
  )
  const dates = [
    [dueDate(index), "14/11/2026", "18/02/2027"],
    [dueDate(index), "03/12/2026", "22/03/2027"],
    [dueDate(index), "28/10/2026", "10/01/2027"],
  ][index % 3]

  return names.slice(0, count).map((name, maintenanceIndex) => {
    const normalizedName = String(name).toLowerCase()
    const criterion =
      normalizedName.includes("permiso") ||
      normalizedName.includes("tecnica") ||
      normalizedName.includes("bateria") ||
      normalizedName.includes("electrico") ||
      normalizedName.includes("luces") ||
      normalizedName.includes("seguridad")
        ? "Tiempo"
        : normalizedName.includes("combustible") ||
            normalizedName.includes("lubricacion") ||
            normalizedName.includes("transmision") ||
            normalizedName.includes("refrigeracion")
          ? "Horometro"
          : "Kilometraje"
    const status =
      maintenanceIndex === 0
        ? item.status
        : maintenanceIndex % 4 === 1
          ? "due"
          : maintenanceIndex % 4 === 2
            ? "overdue"
            : "current"
    const order = findFleetOpenOrder(openOrderIndex.value, item.id, null, normalizedName)

    return {
      id: maintenanceIndex === 0 ? `base-${item.id}` : `base-${item.id}-${maintenanceIndex + 1}`,
      name,
      status,
      criterion,
      date: dates[maintenanceIndex] || dates.at(-1),
      detail:
        maintenanceIndex === 0
          ? dueDetail(item, index) || "Proximo vencimiento"
          : status === "overdue"
            ? `Vencida hace ${5 + maintenanceIndex} dias`
            : status === "due"
              ? `Faltan ${15 + maintenanceIndex * 3} dias`
              : criterion === "Horometro"
                ? `${120 + maintenanceIndex * 35} h restantes`
                : criterion === "Kilometraje"
                  ? `${1200 + maintenanceIndex * 450} km restantes`
                  : `En ${60 + maintenanceIndex * 30} dias`,
      lastReading:
        criterion === "Horometro"
          ? item.hourMeterLabel
          : criterion === "Kilometraje"
            ? item.odometerLabel
            : "-",
      order,
    }
  })
}
const fleetRows = computed(() => {
  const priority = {
    "renewal-pending": 0,
    overdue: 1,
    due: 2,
    workshop: 3,
    current: 4,
    unconfigured: 5,
  }
  return new Map(props.maintenanceItems.map((item, index) => {
    const plans = buildVehicleMaintenances(item, index)
    const primary = plans.reduce((selected, plan) =>
      !selected || (priority[plan.status] ?? 5) < (priority[selected.status] ?? 5) ? plan : selected,
    null) || {
      id: "",
      name: "Sin planes configurados",
      status: "unconfigured",
      date: "-",
      detail: "Agrega el primer plan",
    }
    return [item.id, {
      index,
      plans,
      primary,
      pendingRenewal: plans.some((plan) => plan.orderState === "pending-renewal"),
      attentionCount: plans.filter((plan) => ["renewal-pending", "overdue", "due"].includes(plan.status)).length,
    }]
  }))
})
const vehicleMaintenances = (item) => fleetRows.value.get(item.id)?.plans || []
const priorityMaintenance = (item) => fleetRows.value.get(item.id)?.primary
const nextPlanAction = (plan) => {
  if (plan.orderState === "pending-renewal") {
    return { label: "Renovar plan", primary: true, type: "renew" }
  }
  if (plan.order) {
    return {
      label: ["in-progress", "waiting"].includes(plan.order.status) ? "Continuar OT" : "Ver OT",
      primary: ["in-progress", "waiting"].includes(plan.order.status),
      type: "order",
    }
  }
  if (plan.status === "unconfigured") {
    return { label: "Agregar plan", primary: true, type: "configure" }
  }
  if (["overdue", "due"].includes(plan.status)) {
    return { label: "Crear OT", primary: true, type: "create-order" }
  }
  return { label: "Sin acción requerida", primary: false, type: "none" }
}
const runPlanAction = (item, plan) => {
  const action = nextPlanAction(plan)

  if (action.type === "order") {
    emit("open-work-order", plan.order.id)
    return
  }
  if (action.type === "create-order") {
    emit("create-work-order", item.id, plan.id, plan.name)
    return
  }
  if (action.type === "configure") {
    emit("configure-maintenance", item.id)
    return
  }
  if (action.type === "renew") {
    emit("renew-maintenance", item.id, plan.id)
    return
  }
  if (action.type === "none") return
  emit("open-vehicle-maintenance-plans", item.id)
}
const attentionPlanCount = (item) => fleetRows.value.get(item.id)?.attentionCount || 0
const isVehicleExpanded = (itemId) => expandedVehicleIds.value.includes(itemId)
const toggleVehiclePlans = (itemId) => {
  expandedVehicleIds.value = isVehicleExpanded(itemId)
    ? expandedVehicleIds.value.filter((id) => id !== itemId)
    : [...expandedVehicleIds.value, itemId]
}
const selectedMaintenanceId = (item, index) =>
  selectedMaintenanceByVehicle.value[item.id] || vehicleMaintenances(item, index)[0]?.id || ""
const selectedMaintenance = (item, index) => {
  const options = vehicleMaintenances(item, index)
  return (
    options.find((option) => option.id === selectedMaintenanceId(item, index)) ||
    options[0] ||
    priorityMaintenance(item, index)
  )
}
const toggleMaintenanceMenu = (itemId) => {
  showColumnMenu.value = false
  activeMaintenanceMenu.value = activeMaintenanceMenu.value === itemId ? null : itemId
}
const selectMaintenance = (itemId, maintenanceId) => {
  selectedMaintenanceByVehicle.value[itemId] = maintenanceId
  activeMaintenanceMenu.value = null
}
const selectStatus = (status) => {
  activeStatuses.value = [status]
  emit("update:selected-status", status)
}
const clearLocalFilters = () => {
  activeStatuses.value = ["all"]
  dueDateFrom.value = ""
  dueDateTo.value = ""
  selectedCompany.value = "all"
  selectedVehicleType.value = "all"
  emit("clear-filters")
}
const fleetPage = ref(1)
const fleetPageSize = ref(20)
const tableScroll = ref(null)
const fleetPagination = computed(() => getFleetPage(sortedFleetItems.value, fleetPage.value, fleetPageSize.value))
const fleetPageNumbers = computed(() => {
  const { page, pageCount } = fleetPagination.value
  const start = Math.max(1, Math.min(page - 2, pageCount - 4))
  return Array.from({ length: Math.min(5, pageCount) }, (_, index) => start + index)
})
watch([sortedFleetItems, fleetPageSize], () => {
  fleetPage.value = 1
})
watch([fleetPage, fleetPageSize, sortedFleetItems], () => {
  if (tableScroll.value) tableScroll.value.scrollTop = 0
  activeMaintenanceMenu.value = null
}, { flush: "post" })
</script>

<style scoped>
.overview-layout {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: 275px minmax(0, 1fr);
  gap: 16px;
  margin: 0;
  padding: 12px 16px 16px 24px;
  background: #f5f8fc;
  font-family: inherit;
  font-size: 12px;
}
.overview-layout button,
.overview-layout input,
.overview-layout select,
.overview-layout table {
  font: inherit;
}
.filter-panel {
  min-height: 0;
  align-self: stretch;
  overflow: hidden;
  border: 1px solid #d8e0eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgb(16 35 114 / 5%);
}
.filter-panel header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #edf1f5;
  min-height: 64px;
  padding: 0 1rem;
  color: #102372;
}
.filter-panel h2 {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}
.filter-panel h2 :deep(svg) {
  width: 20px;
  height: 20px;
}
.filter-panel header button {
  height: 36px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  background: #fff;
  padding: 0 0.8rem;
  color: #102372;
  font-size: 12px;
  font-weight: 700;
}
.filter-panel h2 {
  font-size: 16px;
  font-weight: 800;
}
.filter-body {
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
}
.filter-body fieldset:first-of-type {
  margin-top: 0.4rem;
}
.filter-search,
.select-field select,
.date-range-field input {
  width: 100%;
  height: 2.25rem;
  border: 1px solid #cfd8e6;
  border-radius: 0.45rem;
  padding: 0 0.7rem;
  color: #102372;
  font-size: 12px;
  font-weight: 600;
}
.filter-search {
  position: relative;
  display: flex;
  align-items: center;
}
.filter-search > svg {
  position: absolute;
  left: 0.7rem;
  width: 16px;
  height: 16px;
  color: #526b94;
}
.filter-search input {
  width: 100%;
  height: 100%;
  border: 0;
  outline: 0;
  padding: 0 0.7rem 0 2.15rem;
  background: transparent;
  color: #102372;
}
.filter-body fieldset {
  display: grid;
  gap: 0.6rem;
}
.filter-body legend,
.select-field span,
.date-range-field label span {
  margin-bottom: 0.65rem;
  color: #29456f;
  font-size: 11px;
  font-weight: 800;
}
.filter-body fieldset button {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  justify-content: space-between;
  width: 100%;
  border-radius: 6px;
  padding: 0.25rem 0.4rem;
  color: #526b94;
  font-size: 12px;
  font-weight: 600;
}
.status-option-label {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}
.status-option-count {
  min-width: 24px;
  border-radius: 999px;
  background: #f0f3f8;
  padding: 0.15rem 0.4rem;
  color: #526b94;
  text-align: center;
  font-size: 11px;
  font-weight: 800;
}
.filter-body fieldset button.active .status-option-count {
  background: #dce6fb;
  color: #102372;
}
.filter-body fieldset button:hover {
  background: #f2f6fc;
  color: #102372;
}
.filter-body fieldset button.active {
  background: #eef3ff;
  color: #102372;
  font-weight: 800;
}
.filter-body fieldset i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.select-field {
  display: grid;
}
.date-range-field {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem !important;
}
.date-range-field legend {
  grid-column: 1 / -1;
}
.date-range-field label {
  display: grid;
  min-width: 0;
}
.date-range-field label span {
  margin-bottom: 0.35rem;
  color: #7184a3;
  font-size: 10px;
}
.date-range-field input {
  min-width: 0;
  padding: 0 0.45rem;
}
.clear-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  justify-self: start;
  color: #1677ff;
  font-size: 12px;
  font-weight: 700;
}
.clear-button svg {
  width: 15px;
  height: 15px;
}
.overview-main {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  gap: 12px;
  min-width: 0;
  min-height: 0;
  padding: 0;
}
.overview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  margin-bottom: 0.65rem;
  color: #526b94;
  font-size: 12px;
  font-weight: 600;
}
.overview-heading-copy,
.overview-heading-actions,
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.overview-heading strong {
  color: #102372;
  font-weight: 800;
}
.overview-heading button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  height: 2.1rem;
  border: 1px solid #cfd8e6;
  border-radius: 0.45rem;
  background: #fff;
  padding: 0 0.8rem;
  color: #102372;
  font-weight: 700;
}
.overview-heading button svg,
.maintenance-table header button svg {
  width: 15px;
  height: 15px;
}
.overview-heading button.primary {
  border-color: #ff6600;
  background: #ff6600;
  color: #fff;
}
.maintenance-table {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  margin-top: 0;
  overflow: hidden;
  border: 1px solid #d8e0eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: none;
}
.maintenance-table > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
}
.maintenance-table h2 {
  color: #102372;
  font-size: 16px;
  font-weight: 800;
}
.maintenance-table p {
  color: #60789f;
  font-size: 12px;
}
.maintenance-table header > div {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.maintenance-table header > div:first-child {
  display: block;
}
.table-controls {
  position: relative;
}
.maintenance-table header input {
  width: 230px;
  height: 2.1rem;
  border: 1px solid #cfd8e6;
  border-radius: 0.4rem;
  padding: 0 0.7rem;
  font-size: 12px;
}
.maintenance-table header button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.1rem;
  border: 1px solid #cfd8e6;
  border-radius: 0.4rem;
  padding: 0 0.8rem;
  color: #102372;
  font-size: 12px;
  font-weight: 700;
}
.columns-button .columns-chevron {
  width: 12px;
  height: 12px;
  margin-left: 0.1rem;
  transition: transform 150ms ease;
  transform: rotate(90deg);
}
.columns-button[aria-expanded="true"] .columns-chevron {
  transform: rotate(-90deg);
}
.columns-menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 0.45rem);
  right: 0;
  display: grid;
  width: 210px;
  gap: 0.2rem;
  border: 1px solid #d8e0eb;
  border-radius: 8px;
  background: #fff;
  padding: 0.5rem;
  box-shadow: 0 12px 30px rgb(15 35 90 / 16%);
}
.columns-menu > strong {
  padding: 0.35rem 0.5rem 0.45rem;
  color: #526b94;
  font-size: 11px;
  text-transform: uppercase;
}
.maintenance-table header .columns-menu button {
  display: flex;
  width: 100%;
  height: 34px;
  justify-content: flex-start;
  border: 0;
  border-radius: 6px;
  padding: 0 0.5rem;
  color: #29456f;
  font-weight: 600;
}
.maintenance-table header .columns-menu button:hover {
  background: #f3f6fb;
}
.maintenance-table header .columns-menu button.active {
  color: #102372;
  font-weight: 800;
}
.columns-menu button > span {
  display: grid;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  place-items: center;
  border: 1px solid #cfd8e6;
  border-radius: 5px;
  color: #1677ff;
}
.columns-menu button > span :deep(svg) {
  width: 13px;
  height: 13px;
}
.table-scroll {
  min-height: 0;
  max-height: calc(100dvh - 330px);
  overflow: auto;
  background: #fff;
}
.table-scroll > table > thead {
  position: sticky;
  top: 0;
  z-index: 2;
}
.fleet-sort-button {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  text-align: left;
  font: inherit;
  text-transform: inherit;
}
.fleet-sort-button :deep(svg) {
  width: 12px;
  height: 12px;
}
table {
  width: 100%;
  min-width: 1080px;
  border-collapse: collapse;
}
th {
  background: #f5f8fc;
  color: #526b94;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
th,
td {
  border: 1px solid #e5eaf1;
  padding: 1rem 0.75rem;
  text-align: left;
}
thead th {
  padding-top: 0.8rem;
  padding-bottom: 0.8rem;
}
tbody tr {
  height: 88px;
}
tbody td {
  padding-top: 0.8rem;
  padding-bottom: 0.8rem;
}
.col-vehicle {
  width: 18%;
}
.col-maintenance {
  width: 10%;
}
.col-interval {
  width: 22%;
}
.col-mileage {
  width: 21%;
}
.col-status {
  width: 13%;
}
.col-actions {
  width: 140px;
}
.actions-column {
  width: 140px;
  min-width: 140px;
  text-align: center;
}
td {
  color: #29456f;
  font-size: 12px;
}
td strong,
td small {
  display: block;
}
td strong {
  color: #102372;
  font-size: 13px;
  font-weight: 800;
}
td small {
  margin-top: 0.25rem;
  color: #7184a3;
}
.vehicle-cell,
.due-cell {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.vehicle-expand-button {
  display: inline-grid;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  place-items: center;
  border: 0;
  background: transparent;
  color: #102372;
}
.vehicle-expand-button :deep(svg) {
  width: 14px;
  height: 14px;
}
.plans-attention-count {
  display: block;
  margin-top: 3px;
  color: #d85a00;
  font-size: 10px;
  font-weight: 700;
}
.next-maintenance-cell {
  display: grid;
  gap: 2px;
}
.next-maintenance-cell strong {
  color: #102372;
}
.next-maintenance-cell span,
.next-maintenance-cell small {
  font-size: 10px;
}
.vehicle-row-expanded {
  background: #eef5ff;
}
.vehicle-plans-row > td {
  padding: 10px 12px 12px;
  background: #eef5ff;
}
.vehicle-plans-panel {
  overflow: hidden;
  border: 1px solid #cbd9eb;
  border-radius: 4px;
  background: #f8fbff;
}
.vehicle-plans-panel > header {
  display: flex;
  height: 32px;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
}
.vehicle-plans-panel h3 {
  margin: 0;
  color: #102372;
  font-size: 11px;
  font-weight: 900;
}
.plans-detail-button {
  display: inline-flex;
  height: 26px;
  align-items: center;
  gap: 5px;
  border: 1px solid #cbd9eb;
  border-radius: 4px;
  background: #fff;
  padding: 0 9px;
  color: #102372;
  font-size: 10px;
  font-weight: 800;
}
.plans-detail-button:hover {
  border-color: #8da9cf;
  background: #f3f7fd;
}
.plans-detail-button :deep(svg) {
  width: 13px;
  height: 13px;
}
.plan-action-button {
  height: 26px;
  border: 1px solid #c4d2e4;
  border-radius: 4px;
  background: #fff;
  padding: 0 9px;
  color: #102372;
  font-size: 11px;
  font-weight: 900;
}
.plan-action-button.primary {
  border-color: #102372;
  background: #102372;
  color: #fff;
}
.plan-no-action {
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
}
.vehicle-plans-table-wrap {
  margin: 0 6px 6px;
  overflow-x: auto;
  border: 1px solid #d9e3ef;
}
.vehicle-plans-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  table-layout: fixed;
}
.vehicle-plans-table thead,
.vehicle-plans-table thead tr {
  height: 25px !important;
}
.vehicle-plans-table th {
  border: 1px solid #dfe7f1;
  background: #edf3f9;
  height: 25px !important;
  padding: 4px 8px !important;
  color: #526b94;
  font-size: 9px;
  line-height: 1.25;
  text-align: left;
  text-transform: uppercase;
  vertical-align: middle;
}
.vehicle-plans-table tbody tr {
  height: 34px !important;
}
.vehicle-plans-table td {
  border: 1px solid #dfe7f1;
  background: #fff;
  height: 34px !important;
  padding: 4px 8px !important;
  font-size: 11px;
  line-height: 1.35;
}
.vehicle-plans-table td.text-rose-600 {
  color: #e11d48;
  font-weight: 800;
}
.vehicle-plans-table td.text-amber-600 {
  color: #ea580c;
  font-weight: 800;
}
.vehicle-plans-table td.text-blue-600 {
  color: #2563eb;
  font-weight: 800;
}
.vehicle-plans-table td.text-slate-500 {
  color: #102372;
  font-weight: 500;
}
.vehicle-plans-table th:nth-child(1) {
  width: 20%;
}
.vehicle-plans-table th:nth-child(2) {
  width: 10%;
}
.vehicle-plans-table th:nth-child(3) {
  width: 14%;
}
.vehicle-plans-table th:nth-child(4) {
  width: 17%;
}
.vehicle-plans-table th:nth-child(5) {
  width: 15%;
}
.vehicle-plans-table th:nth-child(6) {
  width: 11%;
}
.vehicle-plans-table th:nth-child(7) {
  width: 13%;
}
.vehicle-plans-table .status-pill {
  padding: 0.3rem 0.6rem;
  font-size: 10px;
}
.vehicle-plans-table .vehicle-plans-empty-row,
.vehicle-plans-table .vehicle-plans-empty-row td {
  height: 58px !important;
}
.vehicle-plans-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #526b94;
  font-size: 11px;
  font-weight: 700;
}
.plan-detail-link {
  border: 0;
  background: transparent;
  color: #102372;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.35;
  text-align: left;
}
.vehicle-cell > span {
  display: grid;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid #d8e0eb;
  border-radius: 0.5rem;
  background: #f5f8fc;
}
.vehicle-cell > div {
  display: grid;
  gap: 0.2rem;
}
.vehicle-cell b {
  color: #29456f;
  font-size: 12px;
}
.vehicle-cell img {
  object-fit: contain;
  max-width: 46px;
  max-height: 36px;
}
.vehicle-image-placeholder {
  width: 24px;
  height: 24px;
  color: #526b94;
}
.due-cell > .maintenance-symbol {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border-radius: 50%;
  background: #eef3ff;
  color: #1677ff;
}
.due-cell > .maintenance-symbol :deep(svg) {
  display: block;
  width: 20px;
  height: 20px;
}
.due-cell > div {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}
.maintenance-selector {
  position: relative;
  width: min(240px, 100%);
}
.maintenance-select-trigger {
  display: grid;
  width: 100%;
  height: 38px;
  grid-template-columns: minmax(0, 1fr) 16px;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #cfd9e8;
  border-radius: 6px;
  background: #fff;
  padding: 0 0.65rem 0 0.75rem;
  color: #102372;
  font-size: 13px;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
}
.maintenance-select-trigger > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.maintenance-select-trigger :deep(svg) {
  width: 16px;
  height: 16px;
  color: #526b94;
  transition: transform 150ms ease;
}
.maintenance-select-trigger[aria-expanded="true"] :deep(svg) {
  transform: rotate(180deg);
}
.maintenance-select-trigger:hover,
.maintenance-select-trigger:focus-visible {
  border-color: #1677ff;
  background: #f8fbff;
}
.maintenance-select-trigger:focus-visible {
  outline: 2px solid rgb(22 119 255 / 12%);
}
.maintenance-status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.status-dot-current {
  background: #10b981;
}
.status-dot-due {
  background: #f59e0b;
}
.status-dot-overdue {
  background: #f01446;
}
.status-dot-unconfigured {
  background: #94a3b8;
}
.maintenance-options {
  position: absolute;
  z-index: 30;
  top: calc(100% + 4px);
  left: 0;
  width: max(100%, 220px);
  overflow: hidden;
  border: 1px solid #d8e0eb;
  border-radius: 7px;
  background: #fff;
  padding: 0.3rem;
  box-shadow: 0 10px 24px rgb(15 35 90 / 16%);
}
.maintenance-options button {
  display: grid;
  width: 100%;
  min-height: 34px;
  grid-template-columns: 10px minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
  border: 0;
  border-radius: 5px;
  background: #fff;
  padding: 0.35rem 0.55rem;
  color: #29456f;
  font-weight: 700;
  text-align: left;
}
.maintenance-options button:hover,
.maintenance-options button.active {
  background: #f3f6fb;
  color: #102372;
}
.interval-cell {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.interval-cell > :deep(svg) {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  color: #1677ff;
}
.interval-cell > div {
  display: grid;
}
.mileage-cell {
  display: grid;
  align-items: center;
}
.mileage-cell > div {
  display: grid;
  gap: 0.15rem;
}
.status-pill {
  display: inline-flex !important;
  width: max-content;
  border-radius: 1rem;
  padding: 0.45rem 0.8rem;
  font-weight: 700;
}
.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}
.row-actions button {
  display: inline-grid;
  place-items: center;
  height: 32px;
  min-width: 32px;
  border: 1px solid #d8e0eb;
  border-radius: 0.4rem;
  background: #fff;
  color: #526b94;
  font-weight: 700;
}
.row-actions button svg,
.maintenance-table footer button svg {
  width: 15px;
  height: 15px;
}
.row-actions button.review-plans-button {
  display: inline-flex;
  width: 112px;
  height: 38px;
  min-width: 112px;
  align-items: center;
  justify-content: center;
  border-color: #c4d2e4;
  border-radius: 6px;
  background: #fff;
  color: #102372;
  line-height: 1;
}
tbody tr {
  transition: background 150ms ease;
}
tbody tr:hover {
  background: #f8faff;
}
.maintenance-table > footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  min-height: 56px;
  color: #526b94;
  font-size: 12px;
  font-weight: 600;
}
.maintenance-table footer > div {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  flex-wrap: wrap;
}
.maintenance-table > footer { flex-wrap: wrap; gap: 10px; }
.fleet-page-count { white-space: nowrap; padding: 0 4px; }
.fleet-empty-result { text-align: center; padding: 24px; color: #64748b; }
.maintenance-table footer button:disabled { opacity: 0.45; cursor: not-allowed; }
.maintenance-table footer button,
.maintenance-table footer select {
  height: 32px;
  border: 1px solid #d8e0eb;
  border-radius: 0.4rem;
  background: #fff;
  padding: 0 0.7rem;
  color: #526b94;
}
.maintenance-table footer button.active {
  background: #102372;
  color: #fff;
}
@media (max-width: 1200px) {
  .overview-layout {
    grid-template-columns: 250px minmax(0, 1fr);
    padding-left: 16px;
  }
  .overview-heading {
    align-items: flex-start;
  }
  .overview-heading > div:last-child {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>
