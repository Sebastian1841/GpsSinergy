import { computed, ref } from "vue"

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
  const selectedOrderId = ref("")
  const maintenanceFeedbackMessage = ref("")
  const activeMaintenanceModal = ref("")
  const modalDraft = ref({})
  const modalActionMessage = ref("")
  const maintenanceTypeReturnModal = ref("")
  const preferredMaintenanceType = ref("")
  const manualMaintenancePlans = ref([])
  const extraWorkOrders = ref([])
  const workOrderOverrides = ref({})
  const extraCostRows = ref([])

  const tabs = MAINTENANCE_TABS
  const maintenanceTypes = ref([...DEFAULT_MAINTENANCE_TYPES])
  const maintenanceReadingSources = MAINTENANCE_READING_SOURCES
  const maintenanceTypeReadingSources = ref({
    ...DEFAULT_MAINTENANCE_TYPE_READING_SOURCES,
  })
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
    return ["current", "due", "overdue", "workshop", "unconfigured", "due"][index % 6]
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
    if (source === "Horometro") return Number(vehicle?.hourMeterHours || 0)
    if (source === "Odometro") return Number(vehicle?.odometer || 0)

    return 0
  }

  const buildReadingState = ({ actual, alert, interval, last, source }) => {
    const next = last + interval
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
        actualLabel: formatDateLabel(new Date()),
        lastLabel: "Sin fecha",
        nextLabel: "Sin fecha",
        remainingLabel: "Sin fecha",
        status: "unconfigured",
        summaryLabel: "Sin fecha configurada",
      }
    }

    const today = new Date()
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

  const calculateMaintenancePlanState = (draft, vehicle) => {
    const source = draft.readingSourceLabel
    const interval = parseNumber(draft.intervalValue)
    const alert = parseNumber(draft.alertValue)

    if (source === "Valor manual") {
      return {
        actualLabel: "Manual",
        lastLabel: draft.lastReading || "Manual",
        nextLabel: "Manual",
        remainingLabel: draft.alertBefore || "Estado manual",
        status: draft.status || "due",
        summaryLabel: draft.alertBefore || "Estado manual",
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

  const getManualMaintenancePlan = (vehicle) => {
    return manualMaintenancePlans.value.find((plan) => planMatchesVehicle(plan, vehicle)) || null
  }

  const getManualMaintenanceCount = (vehicle) => {
    return manualMaintenancePlans.value.filter((plan) => planMatchesVehicle(plan, vehicle)).length
  }

  const getMaintenanceReadingSource = (index, hasHourMeter) => {
    if (!hasHourMeter) return "Odometro"

    return ["Odometro", "Horometro", "Fecha/Hora", "Valor manual"][index % 4]
  }

  const getMaintenanceIntervalLabel = (source, index) => {
    if (source === "Horometro") return `${450 + index * 50} hrs`
    if (source === "Fecha/Hora") return `${30 + index * 15} dias`
    if (source === "Valor manual") return "Valor manual"

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
    const manualPlan = getManualMaintenancePlan(vehicleScope)
    const manualPlanCount = getManualMaintenanceCount(vehicleScope)
    const status = manualPlan?.status || getMaintenanceStatus(index)
    const type = manualPlan?.type || getMaintenanceType(index)
    const odometer = parseNumber(asset.odometro) || 82000 + index * 18670
    const hasHourMeter = index % 5 !== 4
    const hourMeterHours = hasHourMeter ? 6200 + index * 847 : null
    const readingSourceLabel =
      manualPlan?.readingSourceLabel || getMaintenanceReadingSource(index, hasHourMeter)
    const intervalLabel =
      manualPlan?.intervalLabel || getMaintenanceIntervalLabel(readingSourceLabel, index)

    return {
      id,
      activeMaintenanceCount:
        status === "unconfigured" && manualPlanCount === 0 ? 0 : 1 + (index % 2) + manualPlanCount,
      assetName,
      companyId,
      companyName: getCompanyName(companyId),
      hourMeterHours,
      hourMeterLabel: hourMeterHours === null ? "-" : `${formatNumber(hourMeterHours)} hrs`,
      initials: getInitials(plate || assetName),
      intervalLabel,
      nextDueLabel: manualPlan?.summaryLabel || getNextDueLabel(status, index),
      nextJob: manualPlan?.name || getNextJob(type, index),
      odometer,
      odometerLabel: `${formatNumber(odometer)} km`,
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
    const items = scopedAssets.value.slice(0, 12).map(buildMaintenanceItem)

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
    maintenanceItems,
    searchTerm,
    selectedStatus,
    selectedType,
    selectedWorkshop,
  })

  const selectedVehicle = computed(() => {
    return (
      maintenanceItems.value.find((item) => item.id === selectedVehicleId.value) ||
      filteredMaintenanceItems.value[0] ||
      maintenanceItems.value[0] ||
      getFallbackMaintenanceItems()[0]
    )
  })

  const buildBaseMaintenancePlan = (vehicle) => {
    return {
      actualLabel:
        vehicle?.readingSourceLabel === "Horometro"
          ? vehicle.hourMeterLabel
          : vehicle.odometerLabel,
      alertLabel: "Estimado desde la flota",
      companyId: vehicle?.companyId || routeCompanyId.value,
      id: `base-${vehicle?.id || "vehicle"}`,
      intervalLabel: vehicle?.intervalLabel || "-",
      lastLabel: "Dato base",
      name: vehicle?.nextJob || getDefaultMaintenanceType(),
      nextLabel: vehicle?.nextDueLabel || "-",
      plate: vehicle?.plate || "",
      readingSourceLabel: vehicle?.readingSourceLabel || "Odometro",
      remainingLabel: vehicle?.nextDueLabel || "-",
      source: "base",
      status: vehicle?.status || "due",
      summaryLabel: vehicle?.nextDueLabel || "-",
      type: vehicle?.type || getDefaultMaintenanceType(),
      vehicleId: vehicle?.id || "",
    }
  }

  const selectedVehicleMaintenancePlans = computed(() => {
    const vehicle = selectedVehicle.value
    const plans = manualMaintenancePlans.value.filter((plan) => planMatchesVehicle(plan, vehicle))

    return plans.length ? plans : [buildBaseMaintenancePlan(vehicle)]
  })

  const modalVehicleMaintenancePlans = computed(() => {
    const vehicleId = modalDraft.value.vehicleId || selectedVehicle.value?.id
    const vehicle =
      maintenanceItems.value.find((item) => item.id === vehicleId) || selectedVehicle.value

    if (!vehicle) return []

    const plans = manualMaintenancePlans.value.filter((plan) => planMatchesVehicle(plan, vehicle))

    return plans.length ? plans : [buildBaseMaintenancePlan(vehicle)]
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

  const buildWorkOrderFromMaintenanceItem = (item, index) => ({
    companyId: item.companyId,
    description:
      "Cambio de aceite de motor, revision de filtros y control general antes de cerrar la mantencion.",
    id: `OT-${String(250 + index).padStart(3, "0")}`,
    estimatedCost: formatCurrency(140000 + index * 58500),
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
    status: getOrderStatusFromMaintenance(item.status, index),
    tasks: ["Drenar aceite de motor", "Reemplazar filtro de aceite", "Revisar nivel de frenos"],
    type: item.type,
    vehicleId: item.id,
    workshop: item.workshop,
  })

  const applyWorkOrderOverride = (order) => {
    return {
      ...order,
      ...(workOrderOverrides.value[order.id] || {}),
    }
  }

  const workOrders = computed(() => {
    const derivedOrders = maintenanceItems.value
      .filter((item) => !getManualMaintenancePlan(item))
      .map(buildWorkOrderFromMaintenanceItem)
      .map(applyWorkOrderOverride)

    return [...extraWorkOrders.value.map(applyWorkOrderOverride), ...derivedOrders]
  })

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
    { label: "Fecha", value: selectedOrder.value?.scheduledDate || "-" },
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
      maintenanceItems.value.find((vehicle) => vehicle.id === vehicleId) ||
      selectedVehicle.value ||
      maintenanceItems.value[0]
    )
  }

  const getSelectedOrderDraft = () => {
    const order = selectedOrder.value
    const vehicle = getVehicleById(order?.vehicleId || selectedVehicle.value?.id)

    return {
      description: order?.description || "",
      estimatedCost: order?.estimatedCost || formatCurrency(0),
      intervalLabel: order?.intervalLabel || vehicle?.intervalLabel || "Valor manual",
      job: order?.job || "Cambio de aceite y filtros",
      maintenancePlanId: order?.maintenancePlanId || "",
      orderId: order?.id || "",
      owner: order?.owner || vehicle?.responsible || "Tecnico asignado",
      priority: order?.priority || "Media",
      readingSourceLabel:
        order?.readingSourceLabel || vehicle?.readingSourceLabel || "Valor manual",
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

    const vehicle = getVehicleById(vehicleId)
    const ignoredPlanId = modalDraft.value?.planId || ""

    return manualMaintenancePlans.value.some((plan) => {
      if (ignoredPlanId && plan.id === ignoredPlanId) return false

      return (
        planMatchesVehicle(plan, vehicle) &&
        normalizeText(plan.name) === normalizeText(templateName)
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
    maintenanceTypeReadingSources.value = {
      ...maintenanceTypeReadingSources.value,
      [trimmedType]: normalizeMaintenanceReadingSource(readingSourceLabel),
    }

    return {
      created: true,
      type: trimmedType,
    }
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
    const currentReading = getVehicleCurrentReading(vehicle, sourceLabel)
    const lastReading = isDateBased
      ? getDateInputDaysAgo(
          Math.max(Number(template?.interval || 30) - Number(template?.warning || 5), 1),
        )
      : Math.max(
          currentReading - Number(template?.interval || 0) + Number(template?.warning || 0),
          0,
        )

    return {
      alertValue: String(template?.warning || ""),
      email: "",
      intervalValue: String(template?.interval || ""),
      lastReading: String(lastReading),
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
    const vehicle = getVehicleById(modalDraft.value.vehicleId)
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
        (plan?.intervalValue ?? parseNumber(plan?.intervalLabel)) || template?.interval || "",
      ),
      lastReading: getDraftReadingValueFromPlan(plan, vehicle, template),
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
    const vehicle = getVehicleById(modalDraft.value.vehicleId)
    const selectedType = modalDraft.value.type || maintenanceTypes.value[0]
    const template =
      getMaintenanceTemplateById(modalDraft.value.templateId) ||
      getFirstAvailableTemplate(vehicle?.id, selectedType)

    modalDraft.value = {
      ...buildMaintenanceDraftFromTemplate(template, vehicle, selectedType),
      name: selectedType,
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

    modalDraft.value = {
      ...modalDraft.value,
      description:
        "OT manual creada para una ejecucion concreta. Puedes asociarla a una mantencion origen si corresponde.",
      intervalLabel: vehicle?.intervalLabel || "Valor manual",
      job: vehicle?.nextJob || "Trabajo de mantencion",
      maintenancePlanId: "",
      owner: vehicle?.responsible || "Tecnico asignado",
      readingSourceLabel: vehicle?.readingSourceLabel || "Valor manual",
      type: vehicle?.type || getDefaultMaintenanceType(),
      vehicleId: vehicle?.id || "",
      workshop: vehicle?.workshop || "Taller asignado",
    }
  }

  const createDefaultModalDraft = (type) => {
    const vehicle = selectedVehicle.value || maintenanceItems.value[0]
    const orderDraft = getSelectedOrderDraft()

    if (type === "maintenance") {
      const typeOverride = preferredMaintenanceType.value

      return buildMaintenanceDraftFromTemplate(
        getFirstAvailableTemplate(vehicle?.id, typeOverride),
        vehicle,
        typeOverride,
      )
    }

    if (type === "maintenance-type") {
      return {
        name: "",
        readingSourceLabel: "Odometro",
      }
    }

    if (type === "order") {
      return {
        description:
          "OT manual creada para una ejecucion concreta. Puedes asociarla a una mantencion origen si corresponde.",
        estimatedCost: formatCurrency(245000),
        intervalLabel: vehicle?.intervalLabel || "Valor manual",
        job: vehicle?.nextJob || "Cambio de aceite y filtros",
        maintenancePlanId: "",
        owner: vehicle?.responsible || "Tecnico asignado",
        priority: vehicle?.status === "overdue" ? "Alta" : "Media",
        readingSourceLabel: vehicle?.readingSourceLabel || "Valor manual",
        scheduledDate: "15/08/2026",
        scheduledTime: "09:00",
        type: vehicle?.type || getDefaultMaintenanceType(),
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
        invoice: `FAC-${String(13000 + extraCostRows.value.length).padStart(5, "0")}`,
        nextCycle: "Generar proxima mantencion automaticamente",
        observations: "Cierre registrado desde el prototipo visual.",
        orderId: orderDraft.orderId,
        parts: "Filtro de aceite, aceite motor y revision general",
        totalCost: orderDraft.estimatedCost,
        workPerformed: orderDraft.job,
      }
    }

    if (type === "cost") {
      return {
        date: "24/08/2026",
        invoice: `F-${String(12600 + extraCostRows.value.length).padStart(5, "0")}`,
        parts: "$ 0",
        total: "$ 0",
        type: "Mantencion preventiva",
        vehicleId: vehicle?.id || "",
        workshop: vehicle?.workshop || "Taller asignado",
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

    return orderDraft
  }

  const setMaintenanceFeedback = (message) => {
    maintenanceFeedbackMessage.value = message
    modalActionMessage.value = message
  }

  const openMaintenanceModal = (type, returnTo = "") => {
    modalActionMessage.value = ""
    maintenanceTypeReturnModal.value = type === "maintenance-type" ? returnTo : ""
    modalDraft.value = createDefaultModalDraft(type)
    activeMaintenanceModal.value = type
  }

  const returnToMaintenanceDetail = (message = "") => {
    modalDraft.value = {}
    maintenanceTypeReturnModal.value = ""
    activeMaintenanceModal.value = "maintenance-detail"
    modalActionMessage.value = message
  }

  const isBaseMaintenancePlan = (plan) => {
    return plan?.source === "base" || String(plan?.id || "").startsWith("base-")
  }

  const openEditMaintenancePlan = (plan) => {
    modalActionMessage.value = ""
    modalDraft.value = getMaintenanceDraftFromPlan(plan)
    activeMaintenanceModal.value = "edit-maintenance"
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
    if (
      activeMaintenanceModal.value === "maintenance-type" &&
      maintenanceTypeReturnModal.value === "maintenance-detail"
    ) {
      returnToMaintenanceDetail()
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
      },
    }
  }

  const addCostRow = ({ date, invoice, total, type, workshop }) => {
    extraCostRows.value = [
      {
        id: `cost-extra-${extraCostRows.value.length + 1}`,
        className: getCostTypeClass(type),
        date: date || "Sin fecha",
        invoice: invoice || "Sin factura",
        total: normalizeCurrencyLabel(total),
        type: type || "Costo registrado",
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
    selectedOrderId.value = newOrder.id
    selectedVehicleId.value = newOrder.vehicleId
    selectedOrderStatus.value = "all"

    return newOrder
  }

  const createWorkOrderFromMaintenancePlan = (plan) => {
    const newOrder = addWorkOrderFromMaintenancePlan(plan)

    activeTab.value = "orders"
    setMaintenanceFeedback(`Orden ${newOrder.id} creada desde ${plan.name}.`)
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
    const alertLabel =
      draft.readingSourceLabel === "Valor manual"
        ? draft.alertBefore || "Manual"
        : `${formatNumber(parseNumber(draft.alertValue))} ${getReadingUnit(draft.readingSourceLabel)} antes`

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

      closeMaintenanceModal()
      return
    }

    if (
      activeMaintenanceModal.value === "maintenance" ||
      activeMaintenanceModal.value === "edit-maintenance"
    ) {
      const vehicle = getVehicleById(draft.vehicleId)
      const existingPlan = manualMaintenancePlans.value.find((plan) => plan.id === draft.planId)
      const maintenancePlan = buildMaintenancePlanFromDraft(draft, existingPlan)

      if (existingPlan) {
        manualMaintenancePlans.value = manualMaintenancePlans.value.map((plan) => {
          return plan.id === existingPlan.id ? maintenancePlan : plan
        })
      } else {
        manualMaintenancePlans.value = [maintenancePlan, ...manualMaintenancePlans.value]
      }

      selectedVehicleId.value = draft.vehicleId
      selectedStatus.value = maintenancePlan.status || "all"

      activeTab.value = "overview"
      maintenanceFeedbackMessage.value =
        activeMaintenanceModal.value === "edit-maintenance"
          ? `Mantencion actualizada para ${vehicle?.plate || "vehiculo seleccionado"}.`
          : `Mantencion configurada para ${vehicle?.plate || "vehiculo seleccionado"}. Crea una OT desde el detalle cuando requiera ejecucion.`

      if (activeMaintenanceModal.value === "edit-maintenance") {
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

    if (activeMaintenanceModal.value === "maintenance-detail") {
      activeTab.value = "orders"
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "order") {
      const vehicle = getVehicleById(draft.vehicleId)
      const newOrder = {
        companyId: vehicle?.companyId || routeCompanyId.value,
        description: draft.description || "OT creada sin mantencion asociada.",
        estimatedCost: normalizeCurrencyLabel(draft.estimatedCost),
        id: getNextWorkOrderId(),
        intervalLabel: draft.intervalLabel || vehicle?.intervalLabel || "Valor manual",
        job: draft.job,
        maintenancePlanId: draft.maintenancePlanId || "",
        odometerLabel: vehicle?.odometerLabel || "-",
        owner: draft.owner,
        plate: vehicle?.plate || "Sin patente",
        priority: draft.priority,
        readingSourceLabel:
          draft.readingSourceLabel || vehicle?.readingSourceLabel || "Valor manual",
        scheduledDate: draft.scheduledDate,
        scheduledTime: draft.scheduledTime,
        status: "scheduled",
        tasks: ["Recepcionar vehiculo", draft.job, "Registrar cierre y evidencia"],
        type: draft.type,
        vehicleId: draft.vehicleId,
        workshop: draft.workshop,
      }

      extraWorkOrders.value = [newOrder, ...extraWorkOrders.value]
      selectedOrderId.value = newOrder.id
      selectedVehicleId.value = newOrder.vehicleId
      selectedOrderStatus.value = "all"
      activeTab.value = "orders"
      setMaintenanceFeedback(`Orden ${newOrder.id} creada para ${newOrder.plate}.`)
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "edit-order") {
      const vehicle = getVehicleById(draft.vehicleId)

      updateWorkOrder(draft.orderId, {
        companyId: vehicle?.companyId || routeCompanyId.value,
        description: draft.description,
        estimatedCost: normalizeCurrencyLabel(draft.estimatedCost),
        intervalLabel: draft.intervalLabel || vehicle?.intervalLabel || "Valor manual",
        job: draft.job,
        maintenancePlanId: draft.maintenancePlanId || "",
        owner: draft.owner,
        plate: vehicle?.plate || "Sin patente",
        priority: draft.priority,
        readingSourceLabel:
          draft.readingSourceLabel || vehicle?.readingSourceLabel || "Valor manual",
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
      updateWorkOrder(draft.orderId, {
        owner: draft.owner,
        scheduledDate: draft.scheduledDate,
        scheduledTime: draft.scheduledTime,
        status: "scheduled",
        workshop: draft.workshop,
      })

      selectedOrderStatus.value = "all"
      setMaintenanceFeedback(`Orden ${draft.orderId} reprogramada.`)
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "assign-order") {
      updateWorkOrder(draft.orderId, {
        owner: draft.owner,
        priority: draft.priority,
        status: draft.status,
        workshop: draft.workshop,
      })

      selectedOrderStatus.value = "all"
      setMaintenanceFeedback(`Orden ${draft.orderId} asignada.`)
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "cancel-order") {
      updateWorkOrder(draft.orderId, {
        description: draft.cancelReason,
        status: "cancelled",
      })

      selectedOrderStatus.value = "all"
      setMaintenanceFeedback(`Orden ${draft.orderId} cancelada.`)
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "close-order") {
      const order = selectedOrder.value

      updateWorkOrder(draft.orderId, {
        description: `${draft.workPerformed}. ${draft.observations}`,
        estimatedCost: normalizeCurrencyLabel(draft.totalCost),
        status: "finished",
        tasks: ["Trabajo realizado", "Costo registrado", "Factura asociada"],
      })

      addCostRow({
        date: "30/08/2026",
        invoice: draft.invoice,
        total: draft.totalCost,
        type: "Mantencion preventiva",
        workshop: order?.workshop || selectedVehicle.value?.workshop,
      })

      selectedOrderStatus.value = "all"
      activeTab.value = "orders"
      setMaintenanceFeedback(`Cierre registrado para ${draft.orderId}.`)
      closeMaintenanceModal()
      return
    }

    if (activeMaintenanceModal.value === "cost") {
      addCostRow(draft)
      activeTab.value = "costs"
      setMaintenanceFeedback("Costo agregado al historial financiero del vehiculo.")
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

  const openWorkOrderActionModal = (orderId, modalType) => {
    selectWorkOrder(orderId)
    openMaintenanceModal(modalType)
  }

  const openWorkOrderVehicleMaintenancePlans = (orderId) => {
    selectWorkOrder(orderId)

    const order = workOrders.value.find((currentOrder) => currentOrder.id === orderId)

    if (!order?.vehicleId) return

    openVehicleMaintenancePlans(order.vehicleId)
  }

  const openVehicleMaintenancePlans = (vehicleId) => {
    selectedVehicleId.value = vehicleId
    openMaintenanceModal("maintenance-detail")
  }

  useMaintenanceRouteTarget({
    activeTab,
    maintenanceItems,
    openMaintenanceModal,
    route,
    selectedVehicleId,
  })

  const selectVehicle = (vehicleId) => {
    selectedVehicleId.value = vehicleId
    activeTab.value = "history"
  }

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
    costFormFields,
    costSummary,
    createWorkOrderFromMaintenancePlan,
    currentSummaryMetrics,
    displayCostRows,
    filteredMaintenanceItems,
    filteredWorkOrders,
    getMaintenancePlanDetails,
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
    lifecycleSteps,
    maintenanceFeedbackMessage,
    maintenanceHistory,
    maintenanceItems,
    maintenanceReadingSources,
    maintenanceSummaryMetrics,
    maintenanceTypeCriterionOptions,
    maintenanceTypes,
    modalActionMessage,
    modalDescription,
    modalDraft,
    modalKicker,
    modalPrimaryAction,
    modalTitle,
    modalVehicleMaintenancePlans,
    openDeleteMaintenancePlan,
    openEditMaintenancePlan,
    openMaintenanceModal,
    openVehicleCosts,
    openVehicleMaintenancePlans,
    openWorkOrderActionModal,
    openWorkOrderVehicleMaintenancePlans,
    orderPriorityOptions,
    orderSearchTerm,
    orderStatusFilters,
    orderSummaryMetrics,
    overviewMaintenanceItems,
    searchTerm,
    selectVehicle,
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
    syncMaintenanceTypeDraft,
    syncMaintenanceVehicleDraft,
    syncOrderMaintenancePlanDraft,
    syncOrderVehicleDraft,
    tabs,
    upcomingOrders,
    visibleWorkOrders,
    weekDays,
    workOrderWorkshopOptions,
    workshopOptions,
  }
}
