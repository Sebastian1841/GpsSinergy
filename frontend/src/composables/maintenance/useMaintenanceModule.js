import { computed, onScopeDispose, ref, watch } from "vue"
import { readMaintenanceHours } from '../../utils/maintenance/maintenanceTelemetryReading.js'
import { maintenanceTargetDate } from '../../utils/maintenance/maintenanceDateTarget.js'
import { validateMaintenanceOrderStep } from '../../utils/maintenance/maintenanceOrderWizard.js'
import { getReportsForAsset } from '../activos/fleet/useTelemetryHistory.js'
import { maintenanceDay, findMaintenanceHistoricalReading } from '../../utils/maintenance/maintenanceHistoricalReading.js'
import { deleteMaintenanceEvidence, putMaintenanceEvidence } from "../../services/maintenance/maintenanceEvidenceStorage.js"
import { removeUnreferencedMaintenanceEvidence } from "../../services/maintenance/maintenanceEvidenceSession.js"
import { createMaintenanceStatePersistence } from "../../services/maintenance/maintenanceStatePersistence.js"
import { createMaintenanceStateStorage } from "../../services/maintenance/maintenanceStateStorage.js"
import { applyMaintenanceOrderCosts, groupMaintenanceOrderCosts } from "../../utils/maintenance/maintenanceOrderCosts.js"
import { buildMaintenancePlanIndex, findMaintenancePlansForVehicle } from "../../utils/maintenance/maintenancePlanIndex.js"
import { migrateMaintenanceReadingSource } from "../../utils/maintenance/maintenanceReadingSourceMigration.js"
import { toOrderPlanningDate, validateOrderPlanning } from "../../utils/maintenance/maintenanceOrderPlanning.js"
import { baseMaintenanceOrderId, migrateLegacyMaintenanceOrders, getLegacyMaintenanceOrderReview } from "../../utils/maintenance/maintenanceOrderIdentity.js"

import {
  createMaintenanceDemoAssets,
  ENABLE_MAINTENANCE_DEMO_DATA,
  MAINTENANCE_DEMO_TYPES,
  MAINTENANCE_DEMO_BASE_ORDER_LIMIT,
  MAINTENANCE_DEMO_TYPE_READING_SOURCES,
} from "../../fixtures/maintenanceDemoData.js"

import {
  DEFAULT_MAINTENANCE_TYPE_READING_SOURCES,
  DEFAULT_MAINTENANCE_TYPES,
  MAINTENANCE_MODAL_COPY_BY_TYPE,
  MAINTENANCE_READING_SOURCES,
  MAINTENANCE_STATUS_FILTERS,
  MAINTENANCE_TABS,
  MAINTENANCE_TEMPLATES,
  MAINTENANCE_TYPE_CRITERION_OPTIONS,
  MAINTENANCE_WEEK_DAYS,
  WORK_ORDER_PRIORITY_OPTIONS,
  WORK_ORDER_STATUS_FILTERS,
} from "../../utils/maintenance/maintenanceModuleConfig.js"
import {
  addDays,
  formatCurrency,
  formatDateLabel,
  formatMaintenanceIntervalLabel,
  formatNumber,
  getAssetName,
  getAssetPlate,
  getDateInputDaysAgo,
  getInitials,
  getReadingUnit,
  normalizeText,
  parseNumber,
} from "../../utils/maintenance/maintenanceFormatUtils.js"
import {
  getMaintenancePlanPillClass,
  getMaintenancePlanStatusClass,
  getMaintenancePlanStatusMessage,
  getMaintenanceSummaryMetricCardClass,
  getOrderStatusClass,
  getOrderStatusIcon,
  getOrderStatusIconClass,
  getOrderStatusLabel,
  getPriorityClass,
  getStatusClass,
  getStatusIconClass,
  getStatusLabel,
  getStatusTextClass,
  getSummaryMetricIcon,
  getTaskStatusClass,
  getWorkOrderSummaryMetricClass,
} from "../../utils/maintenance/maintenanceUiUtils.js"
import { useMaintenanceCompanyScope } from "./useMaintenanceCompanyScope.js"
import { useMaintenanceDerivedData } from "./useMaintenanceDerivedData.js"
import {
  useMaintenanceOrderFilters,
  useMaintenanceOverviewFilters,
} from "./useMaintenanceFilters.js"
import { useMaintenanceRouteTarget } from "./useMaintenanceRouteTarget.js"

export const useMaintenanceModule = ({ assets, companies, route }) => {
  const storageKey = "maintenance-module-state-v1"
  const stateStorage = createMaintenanceStateStorage({
    storage: typeof localStorage === "undefined" ? null : localStorage,
    key: storageKey,
  })
  const readStoredState = stateStorage.read
  const storedState = readStoredState()
  const currentTime = ref(new Date())
  const clockTimer = typeof window === "undefined" ? null : window.setInterval(() => {
    currentTime.value = new Date()
  }, 60000)
  const activeTab = ref("overview")
  const searchTerm = ref("")
  const orderSearchTerm = ref("")
  const selectedStatus = ref("all")
  const selectedType = ref("all")
  const selectedWorkshop = ref("all")
  const selectedOrderStatus = ref("all")
  const selectedOrderPriority = ref("all")
  const selectedOrderWorkshop = ref("all")
  const selectedVehicleId = ref("")
  const workOrderCreationContext = ref(null)
  const fleetPlanFocus = ref(null)
  const selectedOrderId = ref("")
  const maintenanceFeedbackMessage = ref("")
  const maintenanceFeedbackAction = ref(null)
  watch(maintenanceFeedbackMessage, () => { maintenanceFeedbackAction.value = null }, { flush: "sync" })
  const closedPlanRenewal = ref(null)
  const activeMaintenanceModal = ref("")
  const modalDraft = ref({})
  const modalActionMessage = ref("")
  const maintenanceTypeReturnModal = ref("")
  const preferredMaintenanceType = ref("")
  const manualMaintenancePlans = ref((storedState.manualMaintenancePlans || []).map(plan => migrateMaintenanceReadingSource(plan, { plan: true })))
  const extraWorkOrders = ref((storedState.extraWorkOrders || []).map(order => migrateMaintenanceReadingSource(order)))
  const workOrderOverrides = ref(Object.fromEntries(Object.entries(storedState.workOrderOverrides || {}).map(([id, order]) => [id, migrateMaintenanceReadingSource(order)])))
  const extraCostRows = ref(storedState.extraCostRows || [])
  const maintenancePlanOrderStates = ref(storedState.maintenancePlanOrderStates || {})

  const readMaintenanceState = () => ({
    extraCostRows: extraCostRows.value,
    extraWorkOrders: extraWorkOrders.value,
    maintenancePlanOrderStates: maintenancePlanOrderStates.value,
    manualMaintenancePlans: manualMaintenancePlans.value,
    workOrderOverrides: workOrderOverrides.value,
  })
  const statePersistence = createMaintenanceStatePersistence({
    readState: readMaintenanceState,
    writeSections: stateStorage.writeSections,
    putEvidence: putMaintenanceEvidence,
    onError: (error) => {
      maintenanceFeedbackMessage.value =
        error?.message?.includes("otra ventana")
          ? "No se guardaron los cambios: hay un conflicto con otra ventana. Conserva tus cambios pendientes y recarga para revisar la ultima version."
          : "No fue posible guardar los cambios o documentos. La copia anterior se conserva; revisa el almacenamiento del navegador."
    },
  })
  const cleanupMaintenanceEvidence = async (ids) => {
    // Flush committed OT metadata before deciding which session files are unused.
    statePersistence.schedule()
    await statePersistence.flush()
    try {
      await removeUnreferencedMaintenanceEvidence(ids, {
        readStates: () => [readMaintenanceState(), readStoredState()],
        deleteFile: deleteMaintenanceEvidence,
      })
    } catch (error) {
      maintenanceFeedbackMessage.value = "No fue posible limpiar uno de los adjuntos descartados."
      throw error
    }
  }
  watch(
    [
      manualMaintenancePlans,
      extraWorkOrders,
      workOrderOverrides,
      extraCostRows,
      maintenancePlanOrderStates,
    ],
    statePersistence.schedule,
    { immediate: true },
  )
  const flushStoredState = () => {
    statePersistence.schedule()
    void statePersistence.flush()
  }
  const flushWhenHidden = () => {
    if (document.visibilityState === "hidden") flushStoredState()
  }
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flushStoredState)
    document.addEventListener("visibilitychange", flushWhenHidden)
  }
  onScopeDispose(() => {
    if (clockTimer !== null) window.clearInterval(clockTimer)
    flushStoredState()
    if (typeof window !== "undefined") {
      window.removeEventListener("pagehide", flushStoredState)
      document.removeEventListener("visibilitychange", flushWhenHidden)
    }
  })

  const tabs = MAINTENANCE_TABS
  const maintenanceTypes = ref([
    ...DEFAULT_MAINTENANCE_TYPES,
    ...(ENABLE_MAINTENANCE_DEMO_DATA ? MAINTENANCE_DEMO_TYPES : []),
  ])
  const maintenanceReadingSources = MAINTENANCE_READING_SOURCES
  const maintenanceTypeReadingSources = ref({
    ...DEFAULT_MAINTENANCE_TYPE_READING_SOURCES,
    ...(ENABLE_MAINTENANCE_DEMO_DATA ? MAINTENANCE_DEMO_TYPE_READING_SOURCES : {}),
  })
  const maintenanceTypeOrigins = ref(Object.fromEntries(maintenanceTypes.value.map((type) => [type, "factory"])))
  const maintenanceTypeCriterionOptions = MAINTENANCE_TYPE_CRITERION_OPTIONS
  const maintenanceTemplates = MAINTENANCE_TEMPLATES
  const statusFilters = MAINTENANCE_STATUS_FILTERS
  const orderStatusFilters = WORK_ORDER_STATUS_FILTERS
  const orderPriorityOptions = WORK_ORDER_PRIORITY_OPTIONS
  const weekDays = MAINTENANCE_WEEK_DAYS

  const { activeCompanyLabel, getCompanyName, routeCompanyId, scopedAssets } =
    useMaintenanceCompanyScope({
      assets,
      companies,
      route,
    })

  const getMaintenanceStatus = (index) => {
    return ["current", "due", "overdue", "current", "unconfigured", "due"][index % 6]
  }

  const getMaintenanceType = (index) => {
    return maintenanceTypes.value[index % maintenanceTypes.value.length]
  }

  const getDefaultMaintenanceType = () => {
    return maintenanceTypes.value[0] || "Mantencion"
  }

  const getWorkshop = (index) => {
    return ["Mecanica Vivar", "Frenos del Sur", "ElectroCam", "Neumaticos Chile"][index % 4]
  }

  const getNextJob = (type, index) => {
    return type || maintenanceTypes.value[index % maintenanceTypes.value.length]
  }

  const getNextDueLabel = (status, index) => {
    if (status === "overdue") return `Vencida hace ${8 + index} dias`
    if (status === "unconfigured") return "Sin mantenciones configuradas"
    if (status === "workshop") return "En taller desde 15/08/2026"
    if (status === "due") return `${2 + index} dias restantes`

    return `17/08/2026 (${1200 + index * 250} km)`
  }

  const getMaintenanceTemplateById = (templateId) => {
    if (!templateId) return null

    return maintenanceTemplates.find((template) => template.id === templateId) || null
  }

  const getMaintenanceTemplatesByType = (type) => {
    if (!type) return maintenanceTemplates

    return maintenanceTemplates.filter((template) => {
      return normalizeText(template.name) === normalizeText(type)
    })
  }

  const getVehicleCurrentReading = (vehicle, source) => {
    if (source === "Horometro") return vehicle?.hourMeterHours ?? null
    if (source === "Odometro") return vehicle?.odometer ?? null

    return 0
  }

  const getMaintenanceReadingAtDate = (vehicleId, day, source) => {
    const asset = scopedAssets.value.find((item) => String(item.id) === String(vehicleId))
    if (!asset || !day || day > maintenanceDay()) return null
    if (day === maintenanceDay()) {
      const vehicle = maintenanceItems.value.find((item) => String(item.id) === String(vehicleId))
      const value = getVehicleCurrentReading(vehicle, source)
      return value == null ? null : { value, at: null }
    }
    return findMaintenanceHistoricalReading(getReportsForAsset(asset), day, source)
  }

  const buildReadingState = ({ actual, alert, interval, last, source }) => {
    const next = last + interval
    if (actual == null || !Number.isFinite(Number(actual))) return {
      actualLabel: "Sin lectura disponible", lastLabel: `${formatNumber(last)} ${getReadingUnit(source)}`,
      nextLabel: `${formatNumber(next)} ${getReadingUnit(source)}`, remainingLabel: "Sin lectura disponible",
      status: "no-reading", summaryLabel: "Sin lectura disponible",
    }
    const remaining = next - actual
    const unit = getReadingUnit(source)
    const status = remaining <= 0 ? "overdue" : remaining <= alert ? "due" : "current"
    const summaryLabel =
      remaining <= 0
        ? `Vencida hace ${formatNumber(Math.abs(remaining))} ${unit}`
        : `${formatNumber(remaining)} ${unit} restantes`

    return {
      actualLabel: `${formatNumber(actual)} ${unit}`,
      lastLabel: `${formatNumber(last)} ${unit}`,
      nextLabel: `${formatNumber(next)} ${unit}`,
      remainingLabel: summaryLabel,
      status,
      summaryLabel,
    }
  }

  const buildDateState = ({ alert, interval, lastDate }) => {
    const dueDate = addDays(lastDate, interval)

    if (!dueDate) {
      return {
        actualLabel: formatDateLabel(currentTime.value),
        lastLabel: "Sin fecha",
        nextLabel: "Sin fecha",
        remainingLabel: "Sin fecha",
        status: "unconfigured",
        summaryLabel: "Sin fecha configurada",
      }
    }

    const today = currentTime.value
    const remaining = Math.ceil((dueDate - today) / 86400000)
    const status = remaining <= 0 ? "overdue" : remaining <= alert ? "due" : "current"
    const summaryLabel =
      remaining <= 0 ? `Vencida hace ${Math.abs(remaining)} dias` : `${remaining} dias restantes`

    return {
      actualLabel: formatDateLabel(today),
      lastLabel: formatDateLabel(lastDate),
      nextLabel: formatDateLabel(dueDate),
      remainingLabel: summaryLabel,
      status,
      summaryLabel,
    }
  }

  const buildRenewedBasePlanState = (plan, vehicle, closingReading) => {
    const source = plan?.readingSourceLabel || "Odometro"
    const interval = parseNumber(plan?.intervalValue || plan?.intervalLabel)
    const completedAt = new Date().toISOString()
    const calculatedState =
      source === "Fecha/Hora"
        ? buildDateState({
            alert: 0,
            interval: interval || 365,
            lastDate: completedAt.slice(0, 10),
          })
        : buildReadingState({
              actual: parseNumber(closingReading) || getVehicleCurrentReading(vehicle, source),
              alert: 0,
              interval: interval || (source === "Horometro" ? 450 : 10000),
              last: parseNumber(closingReading) || getVehicleCurrentReading(vehicle, source),
              source,
            })

    return {
      ...calculatedState,
      completedAt,
      status: "completed",
      summaryLabel: "Mantencion realizada; intervalo renovado",
    }
  }

  const calculateMaintenancePlanState = (draft, vehicle) => {
    const source = draft.readingSourceLabel
    const interval = parseNumber(draft.intervalValue)
    const alert = parseNumber(draft.alertValue)
    if (!interval || interval <= 0 || String(draft.lastReading ?? '').trim() === '') {
      return {
        actualLabel: source === 'Fecha/Hora' ? formatDateLabel(currentTime.value)
          : getVehicleCurrentReading(vehicle, source) == null ? 'Sin lectura disponible'
            : `${formatNumber(getVehicleCurrentReading(vehicle, source))} ${getReadingUnit(source)}`,
        lastLabel: 'Sin referencia', nextLabel: 'Sin configurar',
        remainingLabel: 'Falta configurar el plan', status: 'unconfigured',
        summaryLabel: 'Falta configurar el plan',
      }
    }

    if (source === "Fecha/Hora") {
      return buildDateState({
        alert,
        interval,
        lastDate: draft.lastReading,
      })
    }

    return buildReadingState({
      actual: getVehicleCurrentReading(vehicle, source),
      alert,
      interval,
      last: parseNumber(draft.lastReading),
      source,
    })
  }

  const planMatchesVehicle = (plan, vehicle) => {
    if (!plan || !vehicle) return false

    if (plan.vehicleId && vehicle.id && String(plan.vehicleId) === String(vehicle.id)) {
      return true
    }

    const planCompanyId = String(plan.companyId || "")
    const vehicleCompanyId = String(vehicle.companyId || routeCompanyId.value || "")
    const planPlate = normalizeText(plan.plate)
    const vehiclePlate = normalizeText(vehicle.plate)

    return (
      Boolean(planCompanyId && vehicleCompanyId && planPlate && vehiclePlate) &&
      planCompanyId === vehicleCompanyId &&
      planPlate === vehiclePlate
    )
  }

  const manualPlanIndex = computed(() => buildMaintenancePlanIndex(manualMaintenancePlans.value))
  const getManualMaintenancePlans = (vehicle) =>
    findMaintenancePlansForVehicle(manualPlanIndex.value, vehicle, routeCompanyId.value)

  const getManualMaintenancePlan = (vehicle) => getManualMaintenancePlans(vehicle)[0] || null

  const getManualMaintenanceCount = (vehicle) => {
    return getManualMaintenancePlans(vehicle).length
  }

  const getMaintenanceReadingSource = (index, hasHourMeter) => {
    if (!hasHourMeter) return "Odometro"

    return MAINTENANCE_READING_SOURCES[index % MAINTENANCE_READING_SOURCES.length]
  }

  const getMaintenanceIntervalLabel = (source, index) => {
    if (source === "Horometro") return `${450 + index * 50} hrs`
    if (source === "Fecha/Hora") return `${30 + index * 15} dias`

    return `${2000 + index * 500} km`
  }

  const buildMaintenanceItem = (asset, index) => {
    const assetName = getAssetName(asset)
    const plate = getAssetPlate(asset)
    const companyId = asset.companyId || routeCompanyId.value
    const id = String(asset.id || plate || `asset-${index}`)
    const vehicleScope = {
      companyId,
      id,
      plate,
    }
    const storedManualPlan = getManualMaintenancePlan(vehicleScope)
    const manualPlanCount = getManualMaintenanceCount(vehicleScope)
    const baseStatus = 'unconfigured'
    const baseType = getMaintenanceType(index)
    const rawOdometer = asset.odometro ?? asset.odometer
    const odometer = rawOdometer == null || String(rawOdometer).trim() === "" ? null : parseNumber(rawOdometer)
    const hasHourMeter = index % 5 !== 4
    const hourMeterHours = readMaintenanceHours(asset)
    const manualPlan = storedManualPlan ? {
      ...storedManualPlan,
      ...calculateMaintenancePlanState(storedManualPlan, { odometer, hourMeterHours }),
    } : null
    const baseReadingSourceLabel = getMaintenanceReadingSource(index, hasHourMeter)
    const baseIntervalLabel = getMaintenanceIntervalLabel(baseReadingSourceLabel, index)
    const baseNextDueLabel = getNextDueLabel(baseStatus, index)
    const baseNextJob = getNextJob(baseType, index)
    const storedStatus = manualPlan?.status === "workshop" ? "due" : manualPlan?.status
    const status = storedStatus || baseStatus
    const type = manualPlan?.type || baseType
    const readingSourceLabel = manualPlan?.readingSourceLabel || baseReadingSourceLabel
    const intervalLabel = manualPlan?.intervalLabel || baseIntervalLabel
    const isDemo = Boolean(asset.maintenanceDemo)
    const baseMaintenanceCount = 0

    return {
      id,
      activeMaintenanceCount: baseMaintenanceCount + manualPlanCount,
      assetName,
      baseIntervalLabel,
      baseMaintenanceCount,
      baseMaintenanceName: baseNextJob,
      baseMaintenanceType: baseType,
      baseNextDueLabel,
      baseReadingSourceLabel,
      baseStatus,
      companyId,
      companyName: getCompanyName(companyId),
      isDemo,
      hourMeterHours,
      hourMeterLabel: hourMeterHours === null ? "-" : `${formatNumber(hourMeterHours)} hrs`,
      initials: getInitials(plate || assetName),
      intervalLabel,
      nextDueLabel: manualPlan?.summaryLabel || 'Sin planes configurados',
      nextJob: manualPlan?.name || 'Sin planes configurados',
      odometer,
      odometerLabel: odometer == null ? "Sin lectura disponible" : `${formatNumber(odometer)} km`,
      plate,
      readingSourceLabel,
      responsible: ["Juan Vivar", "Mario Torres", "Luis Araya"][index % 3],
      status,
      type,
      vin: `VIN${String(index + 1001).padStart(4, "0")}SG`,
      workshop: getWorkshop(index),
      year: 2020 + (index % 5),
    }
  }

  const getFallbackMaintenanceItems = () => {
    return [
      buildMaintenanceItem(
        {
          id: "fallback-1",
          companyId: routeCompanyId.value,
          patente: "RLSX67",
          vehiculo: "Camion Volvo FMX 440",
          odometro: "126.092 km",
        },
        0,
      ),
      buildMaintenanceItem(
        {
          id: "fallback-2",
          companyId: routeCompanyId.value,
          patente: "SKXB53",
          vehiculo: "Camion Scania P 410",
          odometro: "88.672 km",
        },
        1,
      ),
    ]
  }

  const maintenanceItems = computed(() => {
    const sourceAssets = ENABLE_MAINTENANCE_DEMO_DATA
      ? [
          ...scopedAssets.value,
          ...createMaintenanceDemoAssets(
            routeCompanyId.value || scopedAssets.value[0]?.companyId,
            Math.max(0, 10 - scopedAssets.value.length),
          ),
        ]
      : scopedAssets.value
    const items = sourceAssets
      .slice(0, ENABLE_MAINTENANCE_DEMO_DATA ? 48 : 12)
      .map(buildMaintenanceItem)

    if (routeCompanyId.value) return items

    return items.length ? items : getFallbackMaintenanceItems()
  })

  const {
    applyMetricFilter,
    clearFilters,
    filteredMaintenanceItems,
    hasHourMeterData,
    maintenanceSummaryMetrics,
    overviewMaintenanceItems,
    workshopOptions,
  } = useMaintenanceOverviewFilters({
    maintenancePlanOrderStates,
    manualMaintenancePlans,
    maintenanceItems,
    searchTerm,
    selectedStatus,
    selectedType,
    selectedWorkshop,
  })

  const selectedVehicle = computed(() => {
    return (
      maintenanceItems.value.find((item) => String(item.id) === String(selectedVehicleId.value)) ||
      filteredMaintenanceItems.value[0] ||
      maintenanceItems.value[0] ||
      getFallbackMaintenanceItems()[0]
    )
  })


  const getVehicleMaintenancePlans = (vehicle) => {
    if (!vehicle) return []

    const manualPlans = getManualMaintenancePlans(vehicle)
    const currentManualPlans = manualPlans.map((plan) => ({
      ...plan,
      ...calculateMaintenancePlanState(plan, vehicle),
    }))
    return currentManualPlans.map((plan) => {
      const storedOrderState = maintenancePlanOrderStates.value[plan.id]
      const orderState =
        typeof storedOrderState === "string" ? storedOrderState : storedOrderState?.status
      const planStatus = plan.status === "workshop" ? "due" : plan.status
      if (!orderState) return { ...plan, status: planStatus }

      return {
        ...plan,
        ...(typeof storedOrderState === "object" ? storedOrderState : {}),
        orderState,
        ...(orderState === "pending-renewal"
          ? {
              lastLabel: storedOrderState.lastReading || plan.lastLabel,
              nextLabel: "Pendiente de renovacion",
              remainingLabel: "Confirma el siguiente ciclo",
            }
          : {}),
        status:
          orderState === "completed"
            ? "current"
            : orderState === "pending-renewal"
              ? "renewal-pending"
              : planStatus,
        summaryLabel:
          orderState === "active"
            ? "Con OT activa"
            : orderState === "pending-renewal"
              ? "OT cerrada; confirma la renovacion del plan"
              : "Mantencion realizada; intervalo renovado",
      }
    })
  }

  const selectedVehicleMaintenancePlans = computed(() => {
    return getVehicleMaintenancePlans(selectedVehicle.value)
  })

  const modalVehicleMaintenancePlans = computed(() => {
    const vehicleId = modalDraft.value.vehicleId || selectedVehicle.value?.id
    const vehicle =
      maintenanceItems.value.find((item) => item.id === vehicleId) || selectedVehicle.value

    if (!vehicle) return []

    return getVehicleMaintenancePlans(vehicle)
  })

  const getMaintenancePlanDetails = (plan) => {
    return [
      { label: "Intervalo", value: plan.intervalLabel || "-" },
      { label: "Ultimo", value: plan.lastLabel || "-" },
      { label: "Umbral", value: plan.nextLabel || "-" },
      { label: "Actual", value: plan.actualLabel || "-" },
      { label: "Faltante", value: plan.remainingLabel || "-" },
      { label: "Alerta", value: plan.alertLabel || "-" },
    ]
  }

  const getOrderStatusFromMaintenance = (status, index) => {
    if (status === "workshop") return "in-progress"
    if (status === "overdue") return "waiting"
    if (status === "current") return index % 2 === 0 ? "finished" : "scheduled"
    if (status === "unconfigured") return "cancelled"

    return "scheduled"
  }

  const getDemoWorkOrderStatus = (item, index) => {
    if (!item.isDemo) return getOrderStatusFromMaintenance(item.status, index)

    const demoNumber = Number(String(item.id).match(/\d+$/)?.[0]) || 0
    if (demoNumber % 9 === 0) return "finished"
    if (demoNumber % 6 === 0) return "in-progress"
    return "scheduled"
  }

  const buildWorkOrderFromMaintenanceItem = (item, index) => ({
    companyId: item.companyId,
    description:
      "Cambio de aceite de motor, revision de filtros y control general antes de cerrar la mantencion.",
    id: baseMaintenanceOrderId(item),
    estimatedCost: formatCurrency(140000 + index * 58500),
    demoLaborCost: item.isDemo ? 85000 + (index % 6) * 28000 : 0,
    demoPartsCost: item.isDemo ? 120000 + (index % 5) * 42000 : 0,
    demoOtherCost: item.isDemo ? 18000 + (index % 4) * 9000 : 0,
    intervalLabel: item.intervalLabel,
    job: item.nextJob,
    maintenancePlanId: `base-${item.id}`,
    odometerLabel: item.odometerLabel,
    owner: item.responsible,
    plate: item.plate,
    priority: item.status === "overdue" ? "Alta" : item.status === "due" ? "Media" : "Baja",
    readingSourceLabel: item.readingSourceLabel,
    scheduledDate: ["02/08/2026", "04/08/2026", "07/08/2026", "09/08/2026", "12/08/2026"][
      index % 5
    ],
    scheduledTime: ["08:30", "09:00", "11:30", "10:00", "13:00"][index % 5],
    status: getDemoWorkOrderStatus(item, index),
    closedAt:
      item.isDemo && getDemoWorkOrderStatus(item, index) === "finished"
        ? new Date(
            2026,
            4 + ((Number(String(item.id).match(/\d+$/)?.[0]) / 9) % 6),
            8 + (index % 18),
            10,
            30,
          ).toISOString()
        : undefined,
    tasks: ["Drenar aceite de motor", "Reemplazar filtro de aceite", "Revisar nivel de frenos"],
    type: item.type,
    vehicleId: item.id,
    workshop: item.workshop,
  })

  const applyWorkOrderOverride = (order) => {
    return {
      ...order,
      ...(workOrderOverrides.value[order.id] || {}),
      id: order.id,
      vehicleId: order.vehicleId,
      companyId: order.companyId,
    }
  }

  const migratedOrders = migrateLegacyMaintenanceOrders(storedState, maintenanceItems.value)
  workOrderOverrides.value = migratedOrders.workOrderOverrides
  extraCostRows.value = migratedOrders.extraCostRows
  maintenancePlanOrderStates.value = migratedOrders.maintenancePlanOrderStates
  const legacyOrderReviewRows = computed(() => getLegacyMaintenanceOrderReview(readMaintenanceState(), routeCompanyId.value))

  const derivedWorkOrders = computed(() =>
    maintenanceItems.value
      .filter((item) => {
        const orderId = baseMaintenanceOrderId(item)
        const hasStoredOrder = workOrderOverrides.value[orderId] || extraCostRows.value.some((row) => row.orderId === orderId)
        return Boolean(hasStoredOrder)
      })
      .slice(0, ENABLE_MAINTENANCE_DEMO_DATA ? MAINTENANCE_DEMO_BASE_ORDER_LIMIT : undefined)
      .map(buildWorkOrderFromMaintenanceItem),
  )
  const ordersWithOverrides = computed(() =>
    [...extraWorkOrders.value, ...derivedWorkOrders.value]
      .map(applyWorkOrderOverride),
  )
  const costsByOrder = computed(() => groupMaintenanceOrderCosts(extraCostRows.value))
  const workOrders = computed(() =>
    ordersWithOverrides.value.map((order) => applyMaintenanceOrderCosts(order, costsByOrder.value)),
  )

  const findOpenOrderForMaintenancePlan = (vehicleId, maintenancePlanId) => {
    return workOrders.value.find((order) => {
      return (
        String(order.vehicleId) === String(vehicleId) &&
        order.maintenancePlanId === maintenancePlanId &&
        !["finished", "cancelled"].includes(order.status)
      )
    })
  }

  const {
    applyOrderMetricFilter,
    clearOrderFilters,
    filteredWorkOrders,
    visibleWorkOrders,
    workOrderWorkshopOptions,
  } = useMaintenanceOrderFilters({
    orderSearchTerm,
    selectedOrderPriority,
    selectedOrderStatus,
    selectedOrderWorkshop,
    workOrders,
  })

  const selectedOrder = computed(() => {
    return (
      workOrders.value.find((order) => order.id === selectedOrderId.value) ||
      filteredWorkOrders.value[0] ||
      workOrders.value[0]
    )
  })

  const selectedOrderVehicle = computed(() => {
    return (
      maintenanceItems.value.find((item) => item.id === selectedOrder.value?.vehicleId) ||
      selectedVehicle.value
    )
  })

  const selectedOrderDetails = computed(() => [
    { label: "Origen", value: selectedOrder.value?.maintenancePlanId ? "Mantencion" : "Manual" },
    {
      label: "Fecha limite de ejecucion",
      value: selectedOrder.value?.scheduledDate || "-",
    },
    { label: "Hora", value: selectedOrder.value?.scheduledTime || "-" },
    { label: "Taller", value: selectedOrder.value?.workshop || "-" },
    { label: "Responsable", value: selectedOrder.value?.owner || "-" },
    { label: "Prioridad", value: selectedOrder.value?.priority || "-" },
    { label: "Costo", value: selectedOrder.value?.estimatedCost || "-" },
    { label: "Lectura", value: selectedOrder.value?.readingSourceLabel || "-" },
    { label: "Intervalo", value: selectedOrder.value?.intervalLabel || "-" },
    { label: "Tipo", value: selectedOrder.value?.type || "-" },
  ])

  const selectedOrderTaskRows = computed(() => {
    const order = selectedOrder.value

    if (!order) return []

    return order.tasks.map((task, index) => {
      const isFinished = order.status === "finished"
      const isInProgress = order.status === "in-progress"

      if (isFinished || (isInProgress && index === 0)) {
        return {
          done: true,
          label: task,
          status: "Completada",
        }
      }

      if (isInProgress && index === 1) {
        return {
          done: false,
          label: task,
          status: "En proceso",
        }
      }

      return {
        done: false,
        label: task,
        status: "Pendiente",
      }
    })
  })

  const {
    calendarDays,
    costFormFields,
    costSummary,
    currentSummaryMetrics,
    displayCostRows,
    lifecycleSteps,
    maintenanceHistory,
    orderSummaryMetrics,
    upcomingOrders,
  } = useMaintenanceDerivedData({
    activeTab,
    extraCostRows,
    maintenanceSummaryMetrics,
    selectedVehicle,
    workOrders,
  })

  const modalCopyByType = MAINTENANCE_MODAL_COPY_BY_TYPE

  const currentModalCopy = computed(() => {
    return (
      modalCopyByType[activeMaintenanceModal.value] || {
        action: "Aplicar",
        description: "Completa la informacion solicitada para continuar.",
        kicker: "Mantenciones",
        title: "Accion",
      }
    )
  })

  const modalKicker = computed(() => currentModalCopy.value.kicker)
  const modalTitle = computed(() => currentModalCopy.value.title)
  const modalDescription = computed(() => currentModalCopy.value.description)
  const modalPrimaryAction = computed(() => currentModalCopy.value.action)

  const getVehicleById = (vehicleId) => {
    return (
      maintenanceItems.value.find((vehicle) => String(vehicle.id) === String(vehicleId)) ||
      selectedVehicle.value ||
      maintenanceItems.value[0]
    )
  }

  const getSelectedOrderDraft = () => {
    const order = selectedOrder.value
    const vehicle = getVehicleById(order?.vehicleId || selectedVehicle.value?.id)

    return {
      ...order,
      description: order?.description || "",
      estimatedCost: order?.estimatedCost || formatCurrency(0),
      intervalLabel: order?.intervalLabel || vehicle?.intervalLabel || "Sin configurar",
      job: order?.job || "Cambio de aceite y filtros",
      maintenancePlanId: order?.maintenancePlanId || "",
      orderId: order?.id || "",
      plate: order?.plate || vehicle?.plate || "Sin patente",
      owner: order?.owner || vehicle?.responsible || "Tecnico asignado",
      priority: order?.priority || "Media",
      readingSourceLabel:
        order?.readingSourceLabel || vehicle?.readingSourceLabel || "Odometro",
      scheduledDate: order?.scheduledDate || "15/08/2026",
      scheduledTime: order?.scheduledTime || "09:00",
      status: order?.status || "scheduled",
      type: order?.type || getDefaultMaintenanceType(),
      vehicleId: order?.vehicleId || vehicle?.id || "",
      workshop: order?.workshop || vehicle?.workshop || "Taller asignado",
    }
  }

  const isMaintenanceTemplateUsed = (vehicleId, templateName) => {
    if (!vehicleId || !templateName) return false

    const vehicle = maintenanceItems.value.find((item) => String(item.id) === String(vehicleId))
    if (!vehicle) return false
    const ignoredPlanId = activeMaintenanceModal.value === "edit-maintenance"
      ? modalDraft.value?.planId || ""
      : ""

    return getVehicleMaintenancePlans(vehicle).some((plan) => {
      if (ignoredPlanId && plan.id === ignoredPlanId) return false

      return (
        planMatchesVehicle(plan, vehicle) &&
        (normalizeText(plan.name) === normalizeText(templateName) ||
          normalizeText(plan.type) === normalizeText(templateName))
      )
    })
  }

  const normalizeMaintenanceReadingSource = (readingSourceLabel) => {
    return maintenanceTypeCriterionOptions.some((criterion) => {
      return criterion.value === readingSourceLabel
    })
      ? readingSourceLabel
      : "Odometro"
  }

  const getMaintenanceTypeReadingSource = (type) => {
    return maintenanceTypeReadingSources.value[type] || "Odometro"
  }

  const getMaintenanceTypeCriterionLabel = (readingSourceLabel) => {
    return (
      maintenanceTypeCriterionOptions.find((criterion) => {
        return criterion.value === readingSourceLabel
      })?.label || "Por odometro"
    )
  }

  const addMaintenanceType = (typeName, readingSourceLabel = "Odometro") => {
    const trimmedType = String(typeName || "").trim()

    if (!trimmedType) {
      return {
        created: false,
        type: "",
      }
    }

    const existingType = maintenanceTypes.value.find((type) => {
      return normalizeText(type) === normalizeText(trimmedType)
    })

    if (existingType) {
      return {
        created: false,
        type: existingType,
      }
    }

    maintenanceTypes.value = [...maintenanceTypes.value, trimmedType]
    maintenanceTypeOrigins.value = { ...maintenanceTypeOrigins.value, [trimmedType]: "custom" }
    maintenanceTypeReadingSources.value = {
      ...maintenanceTypeReadingSources.value,
      [trimmedType]: normalizeMaintenanceReadingSource(readingSourceLabel),
    }

    return {
      created: true,
      type: trimmedType,
    }
  }

  const updateMaintenanceType = ({ currentName, name, readingSourceLabel }) => {
    const trimmedName = String(name || "").trim()
    if (!currentName || !trimmedName) return

    const duplicate = maintenanceTypes.value.some(
      (type) => type !== currentName && normalizeText(type) === normalizeText(trimmedName),
    )
    if (duplicate) {
      modalActionMessage.value = `El tipo ${trimmedName} ya existe.`
      return
    }

    maintenanceTypes.value = maintenanceTypes.value.map((type) =>
      type === currentName ? trimmedName : type,
    )
    const nextSources = { ...maintenanceTypeReadingSources.value }
    delete nextSources[currentName]
    nextSources[trimmedName] = normalizeMaintenanceReadingSource(readingSourceLabel)
    maintenanceTypeReadingSources.value = nextSources
    const nextOrigins = { ...maintenanceTypeOrigins.value }
    delete nextOrigins[currentName]
    nextOrigins[trimmedName] = maintenanceTypeOrigins.value[currentName] || "custom"
    maintenanceTypeOrigins.value = nextOrigins
    manualMaintenancePlans.value = manualMaintenancePlans.value.map((plan) => ({
      ...plan,
      name: plan.name === currentName ? trimmedName : plan.name,
      type: plan.type === currentName ? trimmedName : plan.type,
    }))
    modalActionMessage.value = `Tipo ${trimmedName} actualizado.`
  }

  const deleteMaintenanceType = (typeName) => {
    maintenanceTypes.value = maintenanceTypes.value.filter((type) => type !== typeName)
    const nextSources = { ...maintenanceTypeReadingSources.value }
    delete nextSources[typeName]
    maintenanceTypeReadingSources.value = nextSources
    const nextOrigins = { ...maintenanceTypeOrigins.value }
    delete nextOrigins[typeName]
    maintenanceTypeOrigins.value = nextOrigins
    modalActionMessage.value = `Tipo ${typeName} eliminado.`
  }

  const getFirstAvailableTemplate = (vehicleId, type = "") => {
    const templates = getMaintenanceTemplatesByType(type)

    return (
      templates.find((template) => !isMaintenanceTemplateUsed(vehicleId, template.name)) ||
      templates[0] ||
      null
    )
  }

  const buildMaintenanceDraftFromTemplate = (template, vehicle, typeOverride = "") => {
    const maintenanceName =
      typeOverride || template?.name || maintenanceTypes.value[0] || "Mantencion"
    const sourceLabel = getMaintenanceTypeReadingSource(maintenanceName)
    const isDateBased = sourceLabel === "Fecha/Hora"
    const lastReading = isDateBased
      ? maintenanceDay()
      : getVehicleCurrentReading(vehicle, sourceLabel) ?? ""

    return {
      alertValue: String(template?.warning || ""),
      email: "",
      intervalValue: "",
      lastReading: String(lastReading),
      startDate: maintenanceDay(),
      referenceReadingAt: null,
      name: maintenanceName,
      readingSourceLabel: sourceLabel,
      status: "due",
      templateId: template?.id || "",
      type: maintenanceName,
      vehicleId: vehicle?.id || "",
      whatsapp: "",
    }
  }

  const syncMaintenanceTypeDraft = () => {
    const vehicle = maintenanceItems.value.find((item) => String(item.id) === String(modalDraft.value.vehicleId))
    const selectedType = modalDraft.value.type || maintenanceTypes.value[0]
    const template = getFirstAvailableTemplate(modalDraft.value.vehicleId, selectedType)

    modalDraft.value = {
      ...modalDraft.value,
      ...buildMaintenanceDraftFromTemplate(template, vehicle, selectedType),
      name: selectedType,
      readingSourceLabel: getMaintenanceTypeReadingSource(selectedType),
      templateId: template?.id || "",
      type: selectedType,
      vehicleId: modalDraft.value.vehicleId || vehicle?.id || "",
    }
  }

  const getMaintenanceTemplateForPlan = (plan) => {
    return (
      maintenanceTemplates.find((template) => template.id === plan?.templateId) ||
      maintenanceTemplates.find((template) => {
        return (
          normalizeText(template.name) === normalizeText(plan?.name) &&
          template.sourceLabel === plan?.readingSourceLabel
        )
      }) ||
      maintenanceTemplates.find((template) => template.sourceLabel === plan?.readingSourceLabel) ||
      maintenanceTemplates[0]
    )
  }

  const getDraftReadingValueFromPlan = (plan, vehicle, template) => {
    if (plan?.lastReading !== undefined && plan.lastReading !== null) {
      return String(plan.lastReading)
    }

    if (plan?.readingSourceLabel === "Fecha/Hora") {
      const interval = Number(plan?.intervalValue || template?.interval || 30)

      return getDateInputDaysAgo(Math.max(interval, 1))
    }

    const parsedLastLabel = parseNumber(plan?.lastLabel)

    if (parsedLastLabel > 0) return String(parsedLastLabel)

    const currentReading = getVehicleCurrentReading(vehicle, plan?.readingSourceLabel)
    const interval = parseNumber(plan?.intervalValue || plan?.intervalLabel || template?.interval)

    return String(Math.max(currentReading - interval, 0))
  }

  const getMaintenanceDraftFromPlan = (plan) => {
    const vehicle = getVehicleById(plan?.vehicleId || selectedVehicle.value?.id)
    const template = getMaintenanceTemplateForPlan(plan)

    return {
      alertValue: String(
        (plan?.alertValue ?? parseNumber(plan?.alertLabel)) || template?.warning || "",
      ),
      email: plan?.email || "",
      intervalValue: String(
        plan?.source === 'base' ? '' : (plan?.intervalValue ?? parseNumber(plan?.intervalLabel)) || template?.interval || "",
      ),
      lastReading: plan?.source === 'base'
        ? plan.readingSourceLabel === 'Fecha/Hora' ? maintenanceDay() : String(getVehicleCurrentReading(vehicle, plan.readingSourceLabel) ?? '')
        : getDraftReadingValueFromPlan(plan, vehicle, template),
      startDate: plan?.startDate || '',
      referenceReadingAt: plan?.referenceReadingAt || null,
      name: plan?.name || template?.name || "Mantencion preventiva",
      planId: plan?.source === "manual" ? plan.id : "",
      sourcePlanId: plan?.id || "",
      readingSourceLabel: plan?.readingSourceLabel || template?.sourceLabel || "Odometro",
      status: plan?.status || "due",
      templateId: plan?.templateId || template?.id || "",
      type: plan?.type || template?.name || maintenanceTypes.value[0],
      vehicleId: vehicle?.id || plan?.vehicleId || "",
      whatsapp: plan?.whatsapp || "",
    }
  }

  const syncMaintenanceVehicleDraft = () => {
    const vehicle = maintenanceItems.value.find((item) => String(item.id) === String(modalDraft.value.vehicleId))
    const previousType = modalDraft.value.type || maintenanceTypes.value[0]
    const selectedType = isMaintenanceTemplateUsed(vehicle?.id, previousType)
      ? maintenanceTypes.value.find((type) => !isMaintenanceTemplateUsed(vehicle?.id, type)) || ""
      : previousType
    const template =
      getFirstAvailableTemplate(vehicle?.id, selectedType)

    modalDraft.value = {
      ...buildMaintenanceDraftFromTemplate(template, vehicle, selectedType),
      manualReading: Boolean(modalDraft.value.manualReading),
      name: selectedType,
      type: selectedType,
      notes: modalDraft.value.notes || "",
      readingSourceLabel: getMaintenanceTypeReadingSource(selectedType),
      vehicleId: vehicle?.id || "",
    }
  }

  const syncOrderMaintenancePlanDraft = () => {
    const plan = modalVehicleMaintenancePlans.value.find((currentPlan) => {
      return currentPlan.id === modalDraft.value.maintenancePlanId
    })

    if (!plan) {
      syncOrderVehicleDraft()
      return
    }

    modalDraft.value = {
      ...modalDraft.value,
      description: `OT creada para ejecutar ${plan.name}. ${plan.summaryLabel}.`,
      intervalLabel: plan.intervalLabel,
      job: plan.name,
      readingSourceLabel: plan.readingSourceLabel,
      type: plan.type,
    }
  }

  const syncOrderVehicleDraft = () => {
    const vehicle = getVehicleById(modalDraft.value.vehicleId)
    const plan = getVehicleMaintenancePlans(vehicle)[0] || null

    modalDraft.value = {
      ...modalDraft.value,
      description: plan
        ? `OT creada para ejecutar ${plan.name}. ${plan.summaryLabel}.`
        : "Orden de trabajo creada manualmente.",
      intervalLabel: plan?.intervalLabel || vehicle?.intervalLabel || "Sin configurar",
      job: plan?.name || vehicle?.nextJob || "Trabajo de mantencion",
      maintenancePlanId: plan?.id || "",
      owner: vehicle?.responsible || "Tecnico asignado",
      readingSourceLabel: plan?.readingSourceLabel || vehicle?.readingSourceLabel || "Odometro",
      type: plan?.type || vehicle?.type || getDefaultMaintenanceType(),
      vehicleId: vehicle?.id || "",
      workshop: vehicle?.workshop || "Taller asignado",
    }
  }

  const createDefaultModalDraft = (type, planVehicle = null) => {
    const vehicle = selectedVehicle.value || maintenanceItems.value[0]
    const orderDraft = getSelectedOrderDraft()

    if (type === "maintenance") {
      const typeOverride = preferredMaintenanceType.value
      return {
        ...buildMaintenanceDraftFromTemplate(
          getFirstAvailableTemplate(planVehicle?.id, typeOverride),
          planVehicle,
          typeOverride,
        ),
        manualReading: false,
        notes: "",
        vehicleId: planVehicle?.id || "",
      }
    }

    if (type === "maintenance-type") {
      return {
        name: "",
        readingSourceLabel: "Odometro",
      }
    }

    if (type === "create-order") {
      const plan = getVehicleMaintenancePlans(vehicle)[0] || null

      return {
        description: plan
          ? `OT creada para ejecutar ${plan.name}. ${plan.summaryLabel}.`
          : "Orden de trabajo creada manualmente.",
        estimatedCost: "$ 0",
        estimatedLabor: "0",
        estimatedOther: "0",
        estimatedParts: "0",
        internalReference: getNextWorkOrderId(),
        intervalLabel: plan?.intervalLabel || vehicle?.intervalLabel || "Sin configurar",
        job: plan?.name || vehicle?.nextJob || "Trabajo de mantencion",
        maintenancePlanId: plan?.id || "",
        orderId: getNextWorkOrderId(),
        owner: vehicle?.responsible || "Tecnico asignado",
        priority: "Media",
        plannedStartDate: new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(new Date()),
        readingSourceLabel:
          plan?.readingSourceLabel || vehicle?.readingSourceLabel || "Odometro",
        scheduledDate: "",
        scheduledTime: "09:00",
        type: plan?.type || vehicle?.type || getDefaultMaintenanceType(),
        observations: "",
        status: "scheduled",
        vehicleId: vehicle?.id || "",
        workshop: vehicle?.workshop || "Taller asignado",
      }
    }

    if (type === "cancel-order") {
      return {
        cancelReason: "Orden cancelada por reprogramacion operativa.",
        notify: "Aviso interno",
        orderId: orderDraft.orderId,
      }
    }

    if (type === "close-order") {
      return {
        assetName: orderDraft.type || "",
        closedBy: orderDraft.owner || "Usuario actual",
        closingReading: orderDraft.odometerLabel || orderDraft.openingReading || "",
        evidence: [...(orderDraft.evidence || [])],
        invoice: `FAC-${String(13000 + extraCostRows.value.length).padStart(5, "0")}`,
        nextCycle: "Generar proxima mantencion automaticamente",
        observations: "Cierre registrado desde el prototipo visual.",
        orderId: orderDraft.orderId,
        job: orderDraft.job,
        plate: orderDraft.plate,
        parts: "Filtro de aceite, aceite motor y revision general",
        laborCost: orderDraft.laborCost || orderDraft.estimatedLabor || formatCurrency(0),
        partsCost: orderDraft.partsCost || orderDraft.estimatedParts || formatCurrency(0),
        otherCost: orderDraft.otherCost || orderDraft.estimatedOther || formatCurrency(0),
        totalCost: String(parseNumber(orderDraft.estimatedCost)),
        workPerformed: orderDraft.job,
      }
    }

    if (type === "cost") {
      return {
        date: "2026-08-24",
        invoice: `F-${String(12600 + extraCostRows.value.length).padStart(5, "0")}`,
        labor: "$ 0",
        other: "$ 0",
        parts: "$ 0",
        orderId: orderDraft.orderId,
        observations: "",
        plate: orderDraft.plate,
        job: orderDraft.job,
        total: "$ 0",
        type: "Mantencion preventiva",
        status: orderDraft.status,
        vehicleId: orderDraft.vehicleId || vehicle?.id || "",
        workshop: orderDraft.workshop || vehicle?.workshop || "Taller asignado",
      }
    }

    if (type === "export") {
      return {
        format: "Excel",
        includeCosts: "Incluir costos",
        includeDocuments: "Resumen",
        range: "Vista actual",
      }
    }

    if (type === "reprogram-order") {
      return { ...orderDraft,
        scheduledDate: toOrderPlanningDate(orderDraft.scheduledDate),
        plannedStartDate: toOrderPlanningDate(orderDraft.plannedStartDate),
      }
    }
    return orderDraft
  }

  const setMaintenanceFeedback = (message, action = null) => {
    maintenanceFeedbackMessage.value = message
    maintenanceFeedbackAction.value = action
    modalActionMessage.value = message
  }

  const openMaintenanceModal = (type, returnTo = "") => {
    if (type === 'create-order') workOrderCreationContext.value = null
    if (type === 'maintenance-detail') {
      openVehicleMaintenancePlans(selectedVehicleId.value)
      return
    }
    modalActionMessage.value = ""
    maintenanceTypeReturnModal.value = returnTo
    modalDraft.value = createDefaultModalDraft(type, returnTo === "maintenance-detail" ? selectedVehicle.value : null)
    if (type === "maintenance" && returnTo === "maintenance-detail") {
      modalDraft.value.vehicleId = selectedVehicle.value?.id || ""
    }
    activeMaintenanceModal.value = type
  }

  const returnToMaintenanceDetail = (message = "") => {
    modalDraft.value = {}
    maintenanceTypeReturnModal.value = ""
    activeMaintenanceModal.value = ""
    activeTab.value = "overview"
    fleetPlanFocus.value = { vehicleId: selectedVehicleId.value }
    modalActionMessage.value = message
  }

  const isBaseMaintenancePlan = (plan) => {
    return plan?.source === "base" || String(plan?.id || "").startsWith("base-")
  }

  const openEditMaintenancePlan = (plan) => {
    modalActionMessage.value = ""
    modalDraft.value = {
      ...getMaintenanceDraftFromPlan(plan),
      editMode: true,
      originalType: plan?.type || plan?.name || "",
      returnToDetail: false,
    }
    activeMaintenanceModal.value = "maintenance"
  }

  const openRenewMaintenance = (vehicleId, planId) => {
    const vehicle = getVehicleById(vehicleId)
    const plan = getVehicleMaintenancePlans(vehicle).find(
      (currentPlan) => String(currentPlan.id) === String(planId),
    )
    const pendingState = maintenancePlanOrderStates.value[planId]
    if (!plan || typeof pendingState !== "object" || pendingState.status !== "pending-renewal") {
      setMaintenanceFeedback("Esta mantencion no tiene una renovacion pendiente.")
      return
    }

    selectedVehicleId.value = vehicle.id
    modalDraft.value = {
      lastReading: pendingState.lastReading || pendingState.proposedState?.lastLabel || "-",
      intervalLabel: plan.intervalLabel,
      name: plan.name,
      nextLabel:
        pendingState.proposedPlan?.nextLabel || pendingState.proposedState?.nextLabel || "-",
      orderId: pendingState.orderId,
      planId,
      vehicleId: vehicle.id,
    }
    activeMaintenanceModal.value = "renew-maintenance"
    closedPlanRenewal.value = null
  }

  const editBeforeRenewal = () => {
    const planId = modalDraft.value.planId
    const vehicle = getVehicleById(modalDraft.value.vehicleId)
    const plan = getVehicleMaintenancePlans(vehicle).find(
      (currentPlan) => String(currentPlan.id) === String(planId),
    )
    const pendingState = maintenancePlanOrderStates.value[planId]
    if (!plan || typeof pendingState !== "object") return

    modalDraft.value = {
      ...getMaintenanceDraftFromPlan(plan),
      editMode: true,
      lastReading:
        pendingState.proposedPlan?.lastReading ||
        pendingState.lastReading ||
        getDraftReadingValueFromPlan(plan, vehicle, getMaintenanceTemplateForPlan(plan)),
      sourcePlanId: plan.id,
      originalType: plan?.type || plan?.name || "",
      returnToDetail: false,
    }
    activeMaintenanceModal.value = "maintenance"
  }

  const openDeleteMaintenancePlan = (plan) => {
    if (isBaseMaintenancePlan(plan)) {
      modalActionMessage.value =
        "La mantencion base viene del vehiculo. Editala para crear una configuracion propia antes de eliminarla."
      return
    }

    modalActionMessage.value = ""
    modalDraft.value = {
      name: plan?.name || "Mantencion",
      planId: plan?.id || "",
      plate: plan?.plate || selectedVehicle.value?.plate || "",
      vehicleId: plan?.vehicleId || selectedVehicle.value?.id || "",
    }
    activeMaintenanceModal.value = "delete-maintenance"
  }

  const closeMaintenanceModal = () => {
    if (maintenanceTypeReturnModal.value === "order-detail" && activeMaintenanceModal.value !== "order-detail") {
      openMaintenanceModal("order-detail")
      return
    }
    if (
      activeMaintenanceModal.value === "maintenance-type" &&
      maintenanceTypeReturnModal.value === "maintenance-detail"
    ) {
      returnToMaintenanceDetail()
      return
    }
    if (
      activeMaintenanceModal.value === "maintenance-type" &&
      maintenanceTypeReturnModal.value === "maintenance"
    ) {
      openMaintenanceModal("maintenance")
      return
    }

    activeMaintenanceModal.value = ""
    modalDraft.value = {}
    maintenanceTypeReturnModal.value = ""
    modalActionMessage.value = ""
  }

  const getNextWorkOrderId = () => {
    return `OT-${String(900 + extraWorkOrders.value.length + 1).padStart(3, "0")}`
  }

  const normalizeCurrencyLabel = (value) => {
    const label = String(value || "").trim()
    const numericValue = parseNumber(label)

    if (!label || numericValue <= 0) return formatCurrency(0)
    if (label.includes("$")) return label

    return formatCurrency(numericValue)
  }

  const getCostTypeClass = (type) => {
    const normalizedType = normalizeText(type)

    if (normalizedType.includes("preventiva")) return "bg-emerald-50 text-emerald-700"
    if (normalizedType.includes("repuesto")) return "bg-orange-50 text-[#ff6600]"
    if (normalizedType.includes("reparacion")) return "bg-blue-50 text-blue-700"

    return "bg-slate-100 text-slate-600"
  }

  const updateWorkOrder = (orderId, patch) => {
    const hasExtraOrder = extraWorkOrders.value.some((order) => order.id === orderId)

    if (hasExtraOrder) {
      extraWorkOrders.value = extraWorkOrders.value.map((order) => {
        return order.id === orderId
          ? {
              ...order,
              ...patch,
            }
          : order
      })
      return
    }

    workOrderOverrides.value = {
      ...workOrderOverrides.value,
      [orderId]: {
        ...(workOrderOverrides.value[orderId] || {}),
        ...patch,
        vehicleId: workOrders.value.find((order) => order.id === orderId)?.vehicleId,
      },
    }
  }

  const addCostRow = ({
    date,
    invoice,
    labor,
    observations,
    orderId,
    other,
    parts,
    total,
    type,
    vehicleId,
    workshop,
  }) => {
    extraCostRows.value = [
      {
        id: `cost-extra-${extraCostRows.value.length + 1}`,
        className: getCostTypeClass(type),
        date: date || "Sin fecha",
        invoice: invoice || "Sin factura",
        labor: normalizeCurrencyLabel(labor),
        observations: observations || "",
        orderId: orderId || "",
        other: normalizeCurrencyLabel(other),
        parts: normalizeCurrencyLabel(parts),
        total: normalizeCurrencyLabel(total),
        type: type || "Costo registrado",
        vehicleId: vehicleId || "",
        workshop: workshop || "Sin taller",
      },
      ...extraCostRows.value,
    ]
  }

  const getOrderStatusFromPlanStatus = (status) => {
    if (status === "overdue") return "waiting"
    if (status === "workshop") return "in-progress"

    return "scheduled"
  }

  const addWorkOrderFromMaintenancePlan = (plan) => {
    const vehicle = getVehicleById(plan.vehicleId)
    const existingOrder = findOpenOrderForMaintenancePlan(plan.vehicleId, plan.id)
    if (existingOrder) return { existing: true, order: existingOrder }

    const newOrder = {
      companyId: plan.companyId || vehicle?.companyId || routeCompanyId.value,
      description: `${plan.name}. Origen: mantencion ${plan.readingSourceLabel}. ${plan.summaryLabel}.`,
      estimatedCost: formatCurrency(plan.status === "overdue" ? 320000 : 245000),
      id: getNextWorkOrderId(),
      intervalLabel: plan.intervalLabel,
      job: plan.name,
      maintenancePlanId: plan.id,
      odometerLabel: vehicle?.odometerLabel || plan.actualLabel || "-",
      owner: vehicle?.responsible || "Tecnico asignado",
      plate: plan.plate || vehicle?.plate || "Sin patente",
      priority: plan.status === "overdue" ? "Alta" : plan.status === "due" ? "Media" : "Baja",
      readingSourceLabel: plan.readingSourceLabel,
      scheduledDate: "15/08/2026",
      scheduledTime: "09:00",
      status: getOrderStatusFromPlanStatus(plan.status),
      tasks: ["Revisar lectura actual", plan.name, "Registrar costo y evidencia"],
      type: plan.type,
      vehicleId: plan.vehicleId,
      workshop: vehicle?.workshop || "Taller asignado",
    }

    extraWorkOrders.value = [newOrder, ...extraWorkOrders.value]
    maintenancePlanOrderStates.value = {
      ...maintenancePlanOrderStates.value,
      [plan.id]:
        typeof maintenancePlanOrderStates.value[plan.id] === "object"
          ? { ...maintenancePlanOrderStates.value[plan.id], status: "active" }
          : "active",
    }
    selectedOrderId.value = newOrder.id
    selectedVehicleId.value = newOrder.vehicleId
    selectedOrderStatus.value = "all"

    return { existing: false, order: newOrder }
  }

  const createWorkOrderFromMaintenancePlan = (plan) => {
    const result = addWorkOrderFromMaintenancePlan(plan)
    const newOrder = result.order

    activeTab.value = "orders"
    clearOrderFilters()
    setMaintenanceFeedback(
      result.existing
        ? `La mantencion ${plan.name} ya tiene la orden abierta ${newOrder.id}.`
        : `Orden ${newOrder.id} creada desde ${plan.name}.`,
    )
    closeMaintenanceModal()
  }

  const getNextMaintenancePlanId = () => {
    return `maint-extra-${Date.now()}-${manualMaintenancePlans.value.length + 1}`
  }

  const buildMaintenancePlanFromDraft = (draft, existingPlan = null) => {
    const vehicle = getVehicleById(draft.vehicleId)
    const calculatedState = calculateMaintenancePlanState(draft, vehicle)
    const intervalLabel = formatMaintenanceIntervalLabel(
      draft.readingSourceLabel,
      draft.intervalValue,
    )
    const alertLabel = `${formatNumber(parseNumber(draft.alertValue))} ${getReadingUnit(draft.readingSourceLabel)} antes`

    return {
      id: existingPlan?.id || draft.planId || getNextMaintenancePlanId(),
      actualLabel: calculatedState.actualLabel,
      alertLabel,
      alertValue: draft.alertValue,
      companyId: vehicle?.companyId || routeCompanyId.value,
      email: draft.email,
      intervalLabel,
      intervalValue: draft.intervalValue,
      lastLabel: calculatedState.lastLabel,
      lastReading: draft.lastReading,
      startDate: draft.startDate || '',
      referenceReadingAt: draft.referenceReadingAt || null,
      name: draft.name,
      nextLabel: calculatedState.nextLabel,
      plate: vehicle?.plate || "",
      readingSourceLabel: draft.readingSourceLabel,
      remainingLabel: calculatedState.remainingLabel,
      source: "manual",
      status: calculatedState.status,
      summaryLabel: calculatedState.summaryLabel,
      templateId: draft.templateId,
      type: draft.type,
      vehicleId: draft.vehicleId,
      whatsapp: draft.whatsapp,
      manualReading: Boolean(draft.manualReading),
      notes: draft.notes || "",
    }
  }

  const submitMaintenanceModal = () => {
    const draft = modalDraft.value

    if (activeMaintenanceModal.value === "maintenance-type") {
      const typeName = String(draft.name || "").trim()

      if (!typeName) {
        modalActionMessage.value = "Ingresa un nombre para el tipo de mantencion."
        return
      }

      const result = addMaintenanceType(typeName, draft.readingSourceLabel)

      if (!result.created) {
        modalActionMessage.value = `El tipo ${result.type} ya existe. Puedes seleccionarlo al crear una mantencion.`
        return
      }

      const feedbackMessage = `Tipo ${result.type} creado con criterio ${getMaintenanceTypeCriterionLabel(
        getMaintenanceTypeReadingSource(result.type),
      ).toLowerCase()}.`
      preferredMaintenanceType.value = result.type
      maintenanceFeedbackMessage.value = feedbackMessage

      if (maintenanceTypeReturnModal.value === "maintenance-detail") {
        returnToMaintenanceDetail(feedbackMessage)
        return
      }
      if (maintenanceTypeReturnModal.value === "maintenance") {
        openMaintenanceModal("maintenance")
        return
      }

      modalActionMessage.value = feedbackMessage
      return
    }

    if (activeMaintenanceModal.value === "maintenance") {
      const vehicle = maintenanceItems.value.find((item) => String(item.id) === String(draft.vehicleId))
      const isEditingPlan = Boolean(draft.editMode || draft.planId || draft.sourcePlanId)

      if (!vehicle) {
        modalActionMessage.value = "Selecciona un activo para guardar el plan."
        return
      }
      if (!String(draft.name || '').trim() || !String(draft.type || '').trim() ||
        !maintenanceReadingSources.includes(draft.readingSourceLabel) ||
        String(draft.alertValue ?? '').trim() === '' || !Number.isFinite(Number(draft.alertValue)) || Number(draft.alertValue) < 0) {
        modalActionMessage.value = 'Completa el tipo, criterio y aviso previo para guardar el plan.'
        return
      }

      const existingPlan = manualMaintenancePlans.value.find((plan) => plan.id === draft.planId)
      if (draft.readingSourceLabel === 'Fecha/Hora' && !maintenanceTargetDate(draft.lastReading, draft.intervalValue)) {
        modalActionMessage.value = 'Ingresa una fecha de proxima mantencion posterior al inicio del plan.'
        return
      }
      if (draft.readingSourceLabel !== 'Fecha/Hora' && String(draft.intervalValue ?? '').trim() === '') {
        modalActionMessage.value = draft.readingSourceLabel === 'Horometro' ? 'Ingresa las horas de la proxima mantencion.' : 'Ingresa el kilometraje de la proxima mantencion.'
        return
      }
      if (draft.startDate && draft.startDate > maintenanceDay()) {
        modalActionMessage.value = "La fecha de inicio no puede ser futura."
        return
      }

      if (["Odometro", "Horometro"].includes(draft.readingSourceLabel) &&
        (!(Number(draft.intervalValue) > 0) || !Number.isFinite(Number(draft.intervalValue)) ||
          String(draft.lastReading ?? "").trim() === "" || Number(draft.lastReading) < 0 || !Number.isFinite(Number(draft.lastReading)) ||
          String(draft.alertValue ?? "").trim() === "" || Number(draft.alertValue) < 0 || !Number.isFinite(Number(draft.alertValue)))) {
        modalActionMessage.value = "Ingresa la lectura del ultimo servicio, un intervalo mayor que cero y un aviso no negativo."
        return
      }

      if (!isEditingPlan && isMaintenanceTemplateUsed(draft.vehicleId, draft.type || draft.name)) {
        modalActionMessage.value = `El vehiculo ${vehicle.plate} ya tiene configurada la mantencion ${draft.type || draft.name}.`
        return
      }

      const maintenancePlan = buildMaintenancePlanFromDraft(draft, existingPlan)

      if (existingPlan) {
        manualMaintenancePlans.value = manualMaintenancePlans.value.map((plan) => {
          return plan.id === existingPlan.id ? maintenancePlan : plan
        })
      } else {
        manualMaintenancePlans.value = [maintenancePlan, ...manualMaintenancePlans.value]
      }

      selectedVehicleId.value = draft.vehicleId
      selectedStatus.value = "all"

      activeTab.value = "overview"
      maintenanceFeedbackMessage.value = isEditingPlan
        ? `Mantencion actualizada para ${vehicle?.plate || "vehiculo seleccionado"}.`
        : `Mantencion configurada para ${vehicle?.plate || "vehiculo seleccionado"}. Crea una OT desde el detalle cuando requiera ejecucion.`

      if (isEditingPlan) {
        if (draft.sourcePlanId) {
          const nextStates = { ...maintenancePlanOrderStates.value }
          delete nextStates[draft.sourcePlanId]
          maintenancePlanOrderStates.value = nextStates
        }
        if (draft.returnToDetail) {
          returnToMaintenanceDetail(maintenanceFeedbackMessage.value)
        } else {
          setMaintenanceFeedback(maintenanceFeedbackMessage.value)
          closeMaintenanceModal()
        }
      } else if (maintenanceTypeReturnModal.value === "maintenance-detail") {
        returnToMaintenanceDetail(maintenanceFeedbackMessage.value)
      } else {
        setMaintenanceFeedback(maintenanceFeedbackMessage.value)
        closeMaintenanceModal()
      }

      return
    }

    if (activeMaintenanceModal.value === "delete-maintenance") {
      const deletedPlanName = draft.name || "Mantencion"

      manualMaintenancePlans.value = manualMaintenancePlans.value.filter((plan) => {
        return plan.id !== draft.planId
      })
      selectedVehicleId.value = draft.vehicleId || selectedVehicle.value?.id || ""
      maintenanceFeedbackMessage.value = `${deletedPlanName} eliminada del vehiculo.`
      returnToMaintenanceDetail(maintenanceFeedbackMessage.value)
      return
    }

    if (activeMaintenanceModal.value === "renew-maintenance") {
      const pendingState = maintenancePlanOrderStates.value[draft.planId]
      if (typeof pendingState !== "object" || pendingState.status !== "pending-renewal") return

      if (pendingState.proposedPlan) {
        manualMaintenancePlans.value = manualMaintenancePlans.value.map((plan) =>
          plan.id === draft.planId ? pendingState.proposedPlan : plan,
        )
        const nextStates = { ...maintenancePlanOrderStates.value }
        delete nextStates[draft.planId]
        maintenancePlanOrderStates.value = nextStates
      } else {
        maintenancePlanOrderStates.value = {
          ...maintenancePlanOrderStates.value,
          [draft.planId]: pendingState.proposedState,
        }
      }
      setMaintenanceFeedback(`${draft.name} renovada. Proximo vencimiento: ${draft.nextLabel}.`, {
        type: "plan", vehicleId: draft.vehicleId, label: "Ver planes del vehiculo",
      })
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "create-order") {
      const wizardError = validateMaintenanceOrderStep(draft, 3)
      if (wizardError) { modalActionMessage.value = wizardError; return }
      const context = workOrderCreationContext.value
      if (context && (String(context.vehicleId) !== String(draft.vehicleId) || String(context.planId) !== String(draft.maintenancePlanId))) {
        modalActionMessage.value = 'El vehiculo y el plan deben coincidir con la fila seleccionada.'
        return
      }
      const vehicle = getVehicleById(draft.vehicleId)
      const maintenancePlan = getVehicleMaintenancePlans(vehicle).find(
        (plan) => plan.id === draft.maintenancePlanId,
      )

      if (!vehicle || !maintenancePlan) {
        modalActionMessage.value = "Selecciona un vehiculo con una mantencion configurada."
        return
      }

      if (
        !String(draft.job || "").trim() ||
        !draft.plannedStartDate ||
        !String(draft.owner || "").trim() ||
        !String(draft.workshop || "").trim()
      ) {
        modalActionMessage.value =
          "Completa el titulo, la fecha planificada, el responsable y el taller."
        return
      }

      const existingOrder = findOpenOrderForMaintenancePlan(vehicle.id, maintenancePlan.id)
      if (existingOrder) {
        modalActionMessage.value = `Esta mantencion ya tiene la orden abierta ${existingOrder.id}.`
        return
      }

      const estimatedTotal =
        parseNumber(draft.estimatedLabor) +
        parseNumber(draft.estimatedParts) +
        parseNumber(draft.estimatedOther)
      const newOrder = {
        ...draft,
        audit: [
          { action: "OT creada", at: new Date().toISOString(), user: "Usuario actual" },
          {
            action: "Programada",
            at: new Date().toISOString(),
            detail: `Fecha planificada: ${draft.plannedStartDate}.`,
            user: "Usuario actual",
          },
        ],
        companyId: vehicle?.companyId || routeCompanyId.value,
        createdAt: new Date().toISOString(),
        estimatedCost: formatCurrency(estimatedTotal),
        estimatedLabor: formatCurrency(parseNumber(draft.estimatedLabor)),
        estimatedOther: formatCurrency(parseNumber(draft.estimatedOther)),
        estimatedParts: formatCurrency(parseNumber(draft.estimatedParts)),
        id: draft.orderId || getNextWorkOrderId(),
        odometerLabel: vehicle?.odometerLabel || "-",
        internalReference: draft.internalReference || "",
        observations: draft.observations || "",
        plate: vehicle?.plate || "Sin patente",
        plannedStartDate: draft.plannedStartDate,
        status: draft.status || "scheduled",
        tasks: ["Revisar trabajo", draft.job, "Registrar evidencia"],
      }
      extraWorkOrders.value = [newOrder, ...extraWorkOrders.value]
      maintenancePlanOrderStates.value = {
        ...maintenancePlanOrderStates.value,
        [maintenancePlan.id]:
          typeof maintenancePlanOrderStates.value[maintenancePlan.id] === "object"
            ? { ...maintenancePlanOrderStates.value[maintenancePlan.id], status: "active" }
            : "active",
      }
      selectedOrderId.value = newOrder.id
      selectedVehicleId.value = vehicle.id
      clearOrderFilters()
      activeTab.value = "orders"
      setMaintenanceFeedback(`Orden ${newOrder.id} creada.`, {
        type: "order", orderId: newOrder.id, label: "Ver OT creada",
      })
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "edit-order") {
      const vehicle = getVehicleById(draft.vehicleId)

      updateWorkOrder(draft.orderId, {
        companyId: vehicle?.companyId || routeCompanyId.value,
        description: draft.description,
        estimatedCost: normalizeCurrencyLabel(draft.estimatedCost),
        intervalLabel: draft.intervalLabel || vehicle?.intervalLabel || "Sin configurar",
        job: draft.job,
        maintenancePlanId: draft.maintenancePlanId || "",
        owner: draft.owner,
        plate: vehicle?.plate || "Sin patente",
        priority: draft.priority,
        readingSourceLabel:
          draft.readingSourceLabel || vehicle?.readingSourceLabel || "Odometro",
        scheduledDate: draft.scheduledDate,
        scheduledTime: draft.scheduledTime,
        type: draft.type,
        vehicleId: draft.vehicleId,
        workshop: draft.workshop,
      })

      selectedOrderId.value = draft.orderId
      selectedVehicleId.value = draft.vehicleId
      setMaintenanceFeedback(`Orden ${draft.orderId} actualizada.`)
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "reprogram-order") {
      const order = selectedOrder.value
      if (!order || ["finished", "cancelled"].includes(order.status)) {
        modalActionMessage.value = "Solo se puede editar la planificacion de una OT abierta."
        return
      }
      const error = validateOrderPlanning(draft)
      if (error) {
        modalActionMessage.value = error
        return
      }
      updateWorkOrder(draft.orderId, {
        audit: [
          ...(order?.audit || []),
          {
            action: "Planificacion actualizada",
            at: new Date().toISOString(),
            detail: `Inicio: ${draft.plannedStartDate || 'Sin fecha'}. Fecha limite: ${draft.scheduledDate}. Responsable: ${draft.owner}. Taller: ${draft.workshop}. Prioridad: ${draft.priority}.`,
            user: draft.owner,
          },
        ],
        owner: draft.owner,
        priority: draft.priority,
        plannedStartDate: draft.plannedStartDate,
        scheduledDate: draft.scheduledDate,
        scheduledTime: draft.scheduledTime,
        workshop: draft.workshop,
      })

      selectedOrderStatus.value = "all"
      setMaintenanceFeedback(`Planificacion de ${draft.orderId} actualizada.`)
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "assign-order") {
      const order = selectedOrder.value
      const vehicle = getVehicleById(order?.vehicleId)
      const waitingReason = String(draft.waitingReason || "").trim()

      if (draft.status === "waiting" && !waitingReason) {
        modalActionMessage.value = "Ingresa el motivo por el que la orden queda en espera."
        return
      }

      updateWorkOrder(draft.orderId, {
        audit: [
          ...(order?.audit || []),
          {
            action: draft.status === "waiting" ? "OT puesta en espera" : draft.transitionLabel === "Reanudar trabajo" ? "Trabajo reanudado" : "Trabajo iniciado",
            at: new Date().toISOString(),
            detail:
              draft.status === "waiting" ? waitingReason : `Trabajo iniciado por ${draft.owner}.`,
            user: draft.owner,
          },
        ],
        openingReading:
          draft.status === "in-progress"
            ? vehicle?.odometerLabel || vehicle?.hourMeterLabel || "Sin lectura"
            : order?.openingReading,
        owner: draft.owner,
        priority: draft.priority,
        startedAt:
          draft.status === "in-progress"
            ? order?.startedAt || new Date().toISOString()
            : order?.startedAt,
        status: draft.status,
        waitingReason: draft.status === "waiting" ? waitingReason : "",
        workshop: draft.workshop,
      })

      selectedOrderStatus.value = "all"
      setMaintenanceFeedback(draft.transitionLabel
        ? `Orden ${draft.orderId} ${draft.status === "waiting" ? "puesta en espera" : draft.transitionLabel === "Reanudar trabajo" ? "reanudada" : "iniciada"}.`
        : `Orden ${draft.orderId} asignada.`)
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "cancel-order") {
      const order = selectedOrder.value
      updateWorkOrder(draft.orderId, {
        audit: [
          ...(order?.audit || []),
          {
            action: "OT cancelada",
            at: new Date().toISOString(),
            detail: draft.cancelReason,
            user: "Usuario actual",
          },
        ],
        cancellationReason: draft.cancelReason,
        cancelledAt: new Date().toISOString(),
        cancelledBy: "Usuario actual",
        status: "cancelled",
      })

      if (order?.maintenancePlanId) {
        const nextStates = { ...maintenancePlanOrderStates.value }
        const previousState = nextStates[order.maintenancePlanId]
        if (typeof previousState === "object" && previousState.completedAt) {
          nextStates[order.maintenancePlanId] = { ...previousState, status: "completed" }
        } else {
          delete nextStates[order.maintenancePlanId]
        }
        maintenancePlanOrderStates.value = nextStates
      }

      selectedOrderStatus.value = "all"
      setMaintenanceFeedback(`Orden ${draft.orderId} cancelada.`)
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "close-order") {
      const order = selectedOrder.value
      const workPerformed = String(draft.workPerformed || "").trim()
      const closedBy = String(draft.closedBy || "").trim()
      const closingReading = String(draft.closingReading || "").trim()

      if (!workPerformed || !closedBy || !closingReading) {
        modalActionMessage.value =
          "Completa el trabajo realizado, el responsable del cierre y la lectura final."
        return
      }

      updateWorkOrder(draft.orderId, {
        audit: [
          ...(order?.audit || []),
          {
            action: "OT cerrada",
            at: new Date().toISOString(),
            detail: workPerformed,
            user: closedBy,
          },
        ],
        closedAt: new Date().toISOString(),
        closedBy,
        closingReading,
        description: `${workPerformed}. ${draft.observations}`,
        evidence: [...(draft.evidence || [])],
        status: "finished",
        tasks: ["Trabajo realizado", "Costo registrado", "Factura asociada"],
        workPerformed,
      })

      if (order?.maintenancePlanId) {
        const manualPlan = manualMaintenancePlans.value.find(
          (plan) => plan.id === order.maintenancePlanId,
        )
        if (manualPlan) {
          const vehicle = getVehicleById(order.vehicleId)
          const lastReading =
            manualPlan.readingSourceLabel === "Fecha/Hora"
              ? new Date().toISOString().slice(0, 10)
              : closingReading ||
                String(getVehicleCurrentReading(vehicle, manualPlan.readingSourceLabel))
          const renewedPlan = buildMaintenancePlanFromDraft(
            { ...manualPlan, lastReading },
            manualPlan,
          )
          maintenancePlanOrderStates.value = {
            ...maintenancePlanOrderStates.value,
            [order.maintenancePlanId]: {
              completedAt: new Date().toISOString(),
              lastReading: renewedPlan.lastLabel,
              orderId: order.id,
              proposedPlan: renewedPlan,
              status: "pending-renewal",
            },
          }
        } else {
          const vehicle = getVehicleById(order.vehicleId)
          const basePlan = getVehicleMaintenancePlans(vehicle).find(
            (plan) => plan.id === order.maintenancePlanId,
          )
          const renewedState = buildRenewedBasePlanState(basePlan, vehicle, closingReading)
          maintenancePlanOrderStates.value = {
            ...maintenancePlanOrderStates.value,
            [order.maintenancePlanId]: {
              completedAt: renewedState.completedAt,
              lastReading: renewedState.lastLabel,
              orderId: order.id,
              proposedState: renewedState,
              status: "pending-renewal",
            },
          }
        }
      }

      addCostRow({
        date: new Date().toISOString(),
        invoice: draft.invoice,
        labor: draft.laborCost,
        orderId: order?.id,
        other: draft.otherCost,
        parts: draft.partsCost,
        total: draft.totalCost,
        type: "Mantencion preventiva",
        vehicleId: order?.vehicleId,
        workshop: order?.workshop || selectedVehicle.value?.workshop,
      })

      selectedOrderStatus.value = "all"
      activeTab.value = "orders"
      const pendingRenewal = maintenancePlanOrderStates.value[order?.maintenancePlanId]
      closedPlanRenewal.value =
        pendingRenewal?.status === "pending-renewal"
          ? { vehicleId: order.vehicleId, planId: order.maintenancePlanId }
          : null
      setMaintenanceFeedback(
        closedPlanRenewal.value
          ? `${draft.orderId} cerrada. Ejecucion registrada; el siguiente ciclo esta pendiente de renovacion.`
          : `${draft.orderId} cerrada correctamente.`,
        closedPlanRenewal.value
          ? { type: "renew", ...closedPlanRenewal.value, label: "Revisar renovacion" }
          : { type: "order", orderId: draft.orderId, label: "Ver OT cerrada" },
      )
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "cost") {
      const total = parseNumber(draft.labor) + parseNumber(draft.parts) + parseNumber(draft.other)
      addCostRow({ ...draft, total: formatCurrency(total) })
      activeTab.value = "orders"
      setMaintenanceFeedback(`Costo registrado en la orden ${draft.orderId}.`)
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "export") {
      setMaintenanceFeedback(
        `Exportacion preparada: ${draft.format}, ${draft.range}, ${draft.includeCosts}.`,
      )
      closeMaintenanceModal()
    }
  }

  const getSummaryMetricCardClass = (metric) => {
    return getMaintenanceSummaryMetricCardClass(metric, selectedStatus.value)
  }

  const getOrderSummaryMetricClass = (metric) => {
    return getWorkOrderSummaryMetricClass(metric, selectedOrderStatus.value)
  }

  const selectWorkOrder = (orderId) => {
    selectedOrderId.value = orderId

    const order = workOrders.value.find((currentOrder) => currentOrder.id === orderId)

    if (order?.vehicleId) {
      selectedVehicleId.value = order.vehicleId
    }
  }

  const openWorkOrderActionModal = (orderId, modalType, requestedStatus = "", returnTo = "") => {
    selectWorkOrder(orderId)
    openMaintenanceModal(modalType, returnTo)
    if (modalType === "assign-order" && requestedStatus) {
      modalDraft.value.status = requestedStatus
      modalDraft.value.transitionLabel = requestedStatus === "waiting"
        ? "Poner en espera"
        : selectedOrder.value?.status === "waiting" ? "Reanudar trabajo" : "Iniciar trabajo"
    }
  }

  const openWorkOrderCostModal = (orderId, returnTo = "") => {
    selectWorkOrder(orderId)
    openMaintenanceModal("cost", returnTo)
  }

  const openCreateWorkOrder = (vehicleId, maintenancePlanId = "", maintenancePlanName = "") => {
    const existingOrder = maintenancePlanId
      ? findOpenOrderForMaintenancePlan(vehicleId, maintenancePlanId)
      : null
    if (existingOrder) {
      openWorkOrderActionModal(existingOrder.id, "order-detail")
      return
    }
    const requestedVehicle = vehicleId
      ? maintenanceItems.value.find((vehicle) => String(vehicle.id) === String(vehicleId))
      : null
    const currentVehicle =
      selectedVehicle.value && getVehicleMaintenancePlans(selectedVehicle.value).length > 0
        ? selectedVehicle.value
        : null
    const fallbackVehicle = maintenanceItems.value.find(
      (vehicle) => getVehicleMaintenancePlans(vehicle).length > 0,
    )
    selectedVehicleId.value =
      requestedVehicle?.id || currentVehicle?.id || fallbackVehicle?.id || ""
    openMaintenanceModal("create-order")

    // The row that launches the action is always the active asset in the form.
    modalDraft.value.vehicleId = selectedVehicleId.value

    if (maintenancePlanId || maintenancePlanName) {
      const vehiclePlans = getVehicleMaintenancePlans(requestedVehicle || selectedVehicle.value)
      const planById = vehiclePlans.find((plan) => String(plan.id) === String(maintenancePlanId))
      const selectedPlan =
        planById &&
        (!maintenancePlanName ||
          normalizeText(planById.name || planById.type) === normalizeText(maintenancePlanName))
          ? planById
          : vehiclePlans.find(
              (plan) =>
                normalizeText(plan.name || plan.type) === normalizeText(maintenancePlanName),
            )
      if (selectedPlan) {
        workOrderCreationContext.value = { vehicleId: selectedVehicleId.value, planId: selectedPlan.id }
        modalDraft.value = {
          ...modalDraft.value,
          description: `OT creada para ejecutar ${selectedPlan.name}. ${selectedPlan.summaryLabel}.`,
          intervalLabel: selectedPlan.intervalLabel,
          job: selectedPlan.name,
          maintenancePlanId: selectedPlan.id,
          readingSourceLabel: selectedPlan.readingSourceLabel,
          type: selectedPlan.type,
        }
      }
    }
  }

  const openWorkOrderVehicleMaintenancePlans = (orderId) => {
    selectWorkOrder(orderId)

    const order = workOrders.value.find((currentOrder) => currentOrder.id === orderId)

    if (!order?.vehicleId) return

    openVehicleMaintenancePlans(order.vehicleId)
  }

  const openVehicleMaintenancePlans = (vehicleId, planId = "") => {
    const vehicle = maintenanceItems.value.find((item) => String(item.id) === String(vehicleId))

    if (!vehicle) {
      setMaintenanceFeedback("No fue posible encontrar el vehiculo seleccionado.")
      return
    }

    if (planId && !getVehicleMaintenancePlans(vehicle).some((plan) => String(plan.id) === String(planId))) {
      setMaintenanceFeedback("No fue posible encontrar el plan seleccionado para este vehiculo.")
      return
    }

    selectedVehicleId.value = vehicle.id
    modalActionMessage.value = ""
    maintenanceTypeReturnModal.value = ""
    modalDraft.value = {}
    activeMaintenanceModal.value = ""
    activeTab.value = 'overview'
    fleetPlanFocus.value = { vehicleId: vehicle.id }
    if (planId) {
      const plan = getVehicleMaintenancePlans(vehicle).find((item) => String(item.id) === String(planId))
      openEditMaintenancePlan(plan)
    }
  }

  useMaintenanceRouteTarget({
    activeTab,
    maintenanceItems,
    openMaintenanceModal,
    route,
    selectedVehicleId,
  })

  const openVehicleCosts = (vehicleId) => {
    selectedVehicleId.value = vehicleId
    activeTab.value = "costs"
  }

  return {
    activeTab,
    activeCompanyLabel,
    activeMaintenanceModal,
    applyMetricFilter,
    applyOrderMetricFilter,
    calendarDays,
    clearFilters,
    clearOrderFilters,
    closeMaintenanceModal,
    cleanupMaintenanceEvidence,
    costFormFields,
    costSummary,
    createWorkOrderFromMaintenancePlan,
    deleteMaintenanceType,
    editBeforeRenewal,
    currentSummaryMetrics,
    displayCostRows,
    filteredMaintenanceItems,
    filteredWorkOrders,
    getMaintenancePlanDetails,
    getVehicleMaintenancePlans,
    getMaintenancePlanPillClass,
    getMaintenancePlanStatusClass,
    getMaintenancePlanStatusMessage,
    getOrderStatusClass,
    getOrderStatusIcon,
    getOrderStatusIconClass,
    getOrderStatusLabel,
    getOrderSummaryMetricClass,
    getPriorityClass,
    getStatusClass,
    getStatusIconClass,
    getStatusLabel,
    getStatusTextClass,
    getSummaryMetricCardClass,
    getSummaryMetricIcon,
    getTaskStatusClass,
    hasHourMeterData,
    isBaseMaintenancePlan,
    isMaintenanceTemplateUsed,
    getMaintenanceReadingAtDate,
    lifecycleSteps,
    maintenanceFeedbackMessage,
    legacyOrderReviewRows,
    maintenanceFeedbackAction,
    closedPlanRenewal,
    maintenanceHistory,
    maintenanceItems,
    maintenanceReadingSources,
    maintenanceSummaryMetrics,
    maintenanceTypeCriterionOptions,
    maintenanceTypes,
    maintenanceTypeOrigins,
    maintenanceTypeReadingSources,
    modalActionMessage,
    modalDescription,
    modalDraft,
    modalKicker,
    modalPrimaryAction,
    modalTitle,
    modalVehicleMaintenancePlans,
    openDeleteMaintenancePlan,
    openCreateWorkOrder,
    workOrderCreationContext,
    openEditMaintenancePlan,
    openMaintenanceModal,
    openRenewMaintenance,
    openWorkOrderCostModal,
    openVehicleCosts,
    openVehicleMaintenancePlans,
    fleetPlanFocus,
    openWorkOrderActionModal,
    openWorkOrderVehicleMaintenancePlans,
    orderPriorityOptions,
    orderSearchTerm,
    orderStatusFilters,
    orderSummaryMetrics,
    overviewMaintenanceItems,
    searchTerm,
    selectWorkOrder,
    selectedOrder,
    selectedOrderDetails,
    selectedOrderPriority,
    selectedOrderStatus,
    selectedOrderTaskRows,
    selectedOrderVehicle,
    selectedOrderWorkshop,
    selectedStatus,
    selectedType,
    selectedVehicle,
    selectedVehicleMaintenancePlans,
    selectedWorkshop,
    statusFilters,
    submitMaintenanceModal,
    updateMaintenanceType,
    syncMaintenanceTypeDraft,
    syncMaintenanceVehicleDraft,
    syncOrderMaintenancePlanDraft,
    syncOrderVehicleDraft,
    tabs,
    upcomingOrders,
    visibleWorkOrders,
    weekDays,
    workOrders,
    workOrderWorkshopOptions,
    workshopOptions,
  }
}
