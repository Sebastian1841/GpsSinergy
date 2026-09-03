import { computed, ref, shallowRef, watch } from "vue"

import { getReportsForAsset } from "../activos/fleet/useTelemetryHistory.js"
import { useDebouncedValue } from "../ui/useDebouncedValue.js"
import {
  buildAssetReportRows,
  createReportColumns,
  getAssetLabel,
  getAssetSearchText,
  normalizeReportId,
  normalizeReportText,
  sortAssetReportRowsByVehicle,
  toDateInputValue,
} from "../../utils/reports/execution/assetReportExecutionUtils.js"
import {
  assetMatchesVehicleGroup,
  getAssetVehicleGroupIds,
  normalizeReportVehicleGroup,
} from "../../utils/reports/execution/assetReportVehicleGroupUtils.js"
import {
  ensureReportEventsForAssets,
  getReportEventsForAsset,
} from "./useGeneratedReportEvents.js"
import { useReportEventRules } from "./useReportEventRules.js"
import { normalizeReportTemplateEventRuleIds } from "./useReportTemplates.js"

const REPORT_ASSET_BATCH_SIZE = 20

const waitForReportBatch = () => {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, 0)
  })
}

export function useAssetReportExecution({
  template,
  assets,
  companies,
  geofences,
  groups,
}) {
  const { eventRulesById } = useReportEventRules()

  const today = new Date()
  const weekAgo = new Date(today)

  weekAgo.setDate(today.getDate() - 7)

  let reportExecutionRunId = 0

  const dateFrom = ref(toDateInputValue(weekAgo))
  const dateTo = ref(toDateInputValue(today))
  const assetSearch = ref("")
  const debouncedAssetSearch = useDebouncedValue(assetSearch, 120)

  const selectedVehicleGroupId = ref("all")
  const selectedAssetIds = ref([])
  const executedAt = ref(null)

  /*
   * El reporte es un snapshot.
   * Vue solo observa el reemplazo del arreglo y no cada propiedad
   * de miles de filas.
   */
  const reportRows = shallowRef([])

  const companyNameById = computed(() => {
    return new Map(
      (companies.value || []).map((company) => [
        normalizeReportId(company.id),
        company.name,
      ]),
    )
  })

  const reportColumns = computed(() => {
    return createReportColumns(template.value)
  })

  const activeEventRuleIds = computed(() => {
    return new Set(
      Array.from(eventRulesById.value.values())
        .filter((rule) => rule?.active !== false)
        .filter((rule) => String(rule?.id) !== "all")
        .map((rule) => String(rule.id)),
    )
  })

  const templateEventRuleIds = computed(() => {
    return normalizeReportTemplateEventRuleIds(
      template.value,
      activeEventRuleIds.value,
    )
  })

  /*
   * Los activos recibidos por este composable deben venir
   * previamente filtrados por permisos.
   *
   * Este composable solo aplica filtros de reporte.
   */
  const availableAssets = computed(() => {
    return assets.value || []
  })

  /*
   * Catálogo de grupos vehiculares.
   *
   * También incorpora grupos definidos directamente en los activos
   * mediante vehicleGroupId(s) / groupId(s).
   *
   * Nunca se infieren grupos desde sucursal, branch o etiquetas.
   */
  const availableGroups = computed(() => {
    const groupsById = new Map()

      ; (groups.value || []).forEach((group) => {
        const normalizedGroup = normalizeReportVehicleGroup(group)

        if (!normalizedGroup) return

        groupsById.set(normalizedGroup.id, normalizedGroup)
      })

    availableAssets.value.forEach((asset) => {
      getAssetVehicleGroupIds(asset).forEach((vehicleGroupId) => {
        if (groupsById.has(vehicleGroupId)) return

        groupsById.set(vehicleGroupId, {
          id: vehicleGroupId,
          name: `Grupo ${vehicleGroupId}`,
          active: true,
          inferredFromAssets: true,
        })
      })
    })

    return Array.from(groupsById.values())
  })

  const groupNameById = computed(() => {
    return new Map(
      availableGroups.value.map((group) => [
        normalizeReportId(group.id),
        group.name || "Grupo",
      ]),
    )
  })

  const getAssetVehicleGroupLabel = (asset = {}) => {
    const vehicleGroupIds = getAssetVehicleGroupIds(asset)

    if (!vehicleGroupIds.length) {
      return "Sin grupo"
    }

    return vehicleGroupIds
      .map((vehicleGroupId) => {
        return groupNameById.value.get(vehicleGroupId) || `Grupo ${vehicleGroupId}`
      })
      .join(" · ")
  }

  const groupAssetCountById = computed(() => {
    const countsById = new Map([
      ["all", availableAssets.value.length],
      ["unassigned", 0],
    ])

    availableAssets.value.forEach((asset) => {
      const vehicleGroupIds = getAssetVehicleGroupIds(asset)

      if (!vehicleGroupIds.length) {
        countsById.set(
          "unassigned",
          (countsById.get("unassigned") || 0) + 1,
        )

        return
      }

      vehicleGroupIds.forEach((vehicleGroupId) => {
        countsById.set(
          vehicleGroupId,
          (countsById.get(vehicleGroupId) || 0) + 1,
        )
      })
    })

    return countsById
  })

  const groupOptions = computed(() => {
    return [
      {
        id: "all",
        name: "Todos los grupos",
        assetCount: groupAssetCountById.value.get("all") || 0,
      },
      ...availableGroups.value
        .filter((group) => group.active !== false)
        .map((group) => ({
          ...group,
          assetCount:
            groupAssetCountById.value.get(normalizeReportId(group.id)) || 0,
        })),
      {
        id: "unassigned",
        name: "Sin grupo",
        assetCount: groupAssetCountById.value.get("unassigned") || 0,
      },
    ]
  })

  const availableAssetIdsSignature = computed(() => {
    return availableAssets.value
      .map((asset) => normalizeReportId(asset.id))
      .join("|")
  })

  const selectedAssetIdSet = computed(() => {
    return new Set(selectedAssetIds.value.map(normalizeReportId))
  })

  const groupFilteredAssets = computed(() => {
    if (selectedVehicleGroupId.value === "all") {
      return availableAssets.value
    }

    if (selectedVehicleGroupId.value === "unassigned") {
      return availableAssets.value.filter((asset) => {
        return !getAssetVehicleGroupIds(asset).length
      })
    }

    return availableAssets.value.filter((asset) => {
      return assetMatchesVehicleGroup(
        asset,
        selectedVehicleGroupId.value,
      )
    })
  })

  const groupAssetCount = computed(() => {
    return groupFilteredAssets.value.length
  })

  const selectedGroupLabel = computed(() => {
    const selectedGroup = groupOptions.value.find((group) => {
      return (
        normalizeReportId(group.id) ===
        normalizeReportId(selectedVehicleGroupId.value)
      )
    })

    return selectedGroup?.name || "Grupo"
  })

  const filteredAssets = computed(() => {
    const term = normalizeReportText(debouncedAssetSearch.value)

    if (!term) {
      return groupFilteredAssets.value
    }

    return groupFilteredAssets.value.filter((asset) => {
      const companyName = companyNameById.value.get(
        normalizeReportId(asset.companyId),
      )

      return getAssetSearchText(asset, companyName).includes(term)
    })
  })

  const selectedAssets = computed(() => {
    if (!selectedAssetIds.value.length) {
      return []
    }

    return groupFilteredAssets.value.filter((asset) => {
      return selectedAssetIdSet.value.has(
        normalizeReportId(asset.id),
      )
    })
  })

  const selectedAssetCount = computed(() => {
    return selectedAssets.value.length
  })

  const reportSummary = computed(() => {
    return reportRows.value.reduce(
      (summary, row) => {
        const status =
          row?.asset?.estado ||
          row?.asset?.status ||
          row?.report?.estado ||
          row?.report?.status ||
          ""

        summary.total += 1

        if (status === "moving") {
          summary.moving += 1
        } else if (status === "stopped") {
          summary.stopped += 1
        } else if (status === "offline") {
          summary.offline += 1
        }

        return summary
      },
      {
        total: 0,
        moving: 0,
        stopped: 0,
        offline: 0,
      },
    )
  })

  const hasReport = computed(() => {
    return reportRows.value.length > 0
  })

  const hasExecutedReport = computed(() => {
    return Boolean(executedAt.value)
  })

  const dateRangeError = computed(() => {
    if (!dateFrom.value || !dateTo.value) {
      return "Debes seleccionar fecha desde y fecha hasta."
    }

    if (dateFrom.value > dateTo.value) {
      return "La fecha desde no puede ser mayor que la fecha hasta."
    }

    return ""
  })

  const canExecuteReport = computed(() => {
    return Boolean(
      selectedAssets.value.length &&
      templateEventRuleIds.value.length &&
      !dateRangeError.value,
    )
  })

  const clearReportPreview = () => {
    reportExecutionRunId += 1
    executedAt.value = null
    reportRows.value = []
  }

  const resetExecution = () => {
    assetSearch.value = ""
    selectedVehicleGroupId.value = "all"

    selectedAssetIds.value = groupFilteredAssets.value.map((asset) => {
      return normalizeReportId(asset.id)
    })

    clearReportPreview()
  }

  const toggleAsset = (assetId) => {
    const normalizedAssetId = normalizeReportId(assetId)
    const nextIds = new Set(
      selectedAssetIds.value.map(normalizeReportId),
    )

    if (nextIds.has(normalizedAssetId)) {
      nextIds.delete(normalizedAssetId)
    } else {
      nextIds.add(normalizedAssetId)
    }

    selectedAssetIds.value = Array.from(nextIds)
  }

  const selectFilteredAssets = () => {
    const nextIds = new Set(
      selectedAssetIds.value.map(normalizeReportId),
    )

    filteredAssets.value.forEach((asset) => {
      nextIds.add(normalizeReportId(asset.id))
    })

    selectedAssetIds.value = Array.from(nextIds)
  }

  const clearSelectedAssets = () => {
    selectedAssetIds.value = []
  }

  const executeReport = async () => {
    if (!canExecuteReport.value) {
      clearReportPreview()
      return []
    }

    const currentRunId = reportExecutionRunId + 1
    reportExecutionRunId = currentRunId

    /*
     * Se capturan los valores actuales para que la ejecución
     * no dependa de cambios reactivos durante la construcción.
     */
    const selectedAssetsSnapshot = [...selectedAssets.value]
    const reportColumnsSnapshot = [...reportColumns.value]
    const companyNameByIdSnapshot = new Map(companyNameById.value)
    const eventRulesByIdSnapshot = new Map(eventRulesById.value)
    const geofencesSnapshot = [...(geofences?.value || [])]
    const templateEventRuleIdsSnapshot = templateEventRuleIds.value

    const templateSnapshot = {
      ...template.value,
      eventRuleIds: templateEventRuleIdsSnapshot,
      eventRuleId: templateEventRuleIdsSnapshot[0] || null,
    }

    const dateFromSnapshot = dateFrom.value
    const dateToSnapshot = dateTo.value
    const generatedRows = []

    for (
      let assetIndex = 0;
      assetIndex < selectedAssetsSnapshot.length;
      assetIndex += REPORT_ASSET_BATCH_SIZE
    ) {
      const assetBatch = selectedAssetsSnapshot.slice(
        assetIndex,
        assetIndex + REPORT_ASSET_BATCH_SIZE,
      )

      ensureReportEventsForAssets({
        assets: assetBatch,
        getReportsForAsset,
        eventRulesById: eventRulesByIdSnapshot,
        eventRuleIds: templateEventRuleIdsSnapshot,
      })

      generatedRows.push(
        ...buildAssetReportRows({
          selectedAssets: assetBatch,
          reportColumns: reportColumnsSnapshot,
          companyNameById: companyNameByIdSnapshot,
          dateFrom: dateFromSnapshot,
          dateTo: dateToSnapshot,
          getReportsForAsset,
          getReportEventsForAsset,
          template: templateSnapshot,
          eventRulesById: eventRulesByIdSnapshot,
          geofences: geofencesSnapshot,
        }),
      )

      if (
        assetIndex + REPORT_ASSET_BATCH_SIZE <
        selectedAssetsSnapshot.length
      ) {
        await waitForReportBatch()
      }
    }

    if (currentRunId !== reportExecutionRunId) {
      return []
    }

    reportRows.value =
      sortAssetReportRowsByVehicle(generatedRows)

    executedAt.value = new Date().toISOString()

    return reportRows.value
  }

  const exportExcel = async (
    charts = {},
    reportRowsOverride = null,
  ) => {
    if (!hasReport.value || dateRangeError.value) {
      return false
    }

    const { exportAssetReportExcel } =
      await import(
        "../../utils/reports/export/assetReportExportUtils.js"
      )

    const reportRowsSnapshot = Array.isArray(reportRowsOverride)
      ? reportRowsOverride
      : reportRows.value

    await exportAssetReportExcel({
      template: template.value,
      reportColumns: [...reportColumns.value],
      reportRows: reportRowsSnapshot,
      dateFrom: dateFrom.value,
      dateTo: dateTo.value,
      charts,
    })

    return true
  }

  const exportPdf = async (
    charts = {},
    reportRowsOverride = null,
  ) => {
    if (!hasReport.value || dateRangeError.value) {
      return false
    }

    const { exportAssetReportPdf } =
      await import(
        "../../utils/reports/export/assetReportExportUtils.js"
      )

    const reportRowsSnapshot = Array.isArray(reportRowsOverride)
      ? reportRowsOverride
      : reportRows.value

    await Promise.resolve(
      exportAssetReportPdf({
        template: template.value,
        reportColumns: [...reportColumns.value],
        reportRows: reportRowsSnapshot,
        dateFrom: dateFrom.value,
        dateTo: dateTo.value,
        charts,
      }),
    )

    return true
  }

  watch(
    template,
    () => {
      resetExecution()
    },
    {
      immediate: true,
    },
  )

  /*
   * Cambiar filtros invalida la vista previa existente,
   * pero no genera automáticamente un nuevo reporte.
   */
  watch(
    [
      dateFrom,
      dateTo,
      selectedVehicleGroupId,
      selectedAssetIds,
    ],
    () => {
      clearReportPreview()
    },
  )

  watch(availableAssetIdsSignature, () => {
    const availableAssetIds = new Set(
      availableAssets.value.map((asset) => {
        return normalizeReportId(asset.id)
      }),
    )

    const nextSelectedAssetIds =
      selectedAssetIds.value.filter((assetId) => {
        return availableAssetIds.has(
          normalizeReportId(assetId),
        )
      })

    if (
      nextSelectedAssetIds.length !==
      selectedAssetIds.value.length
    ) {
      selectedAssetIds.value = nextSelectedAssetIds
    }

    if (
      !selectedAssetIds.value.length &&
      availableAssets.value.length
    ) {
      selectedAssetIds.value =
        groupFilteredAssets.value.map((asset) => {
          return normalizeReportId(asset.id)
        })
    }
  })

  watch(selectedVehicleGroupId, () => {
    selectedAssetIds.value =
      groupFilteredAssets.value.map((asset) => {
        return normalizeReportId(asset.id)
      })
  })

  watch(
    groupOptions,
    (options) => {
      const selectedGroupExists = options.some((group) => {
        return (
          normalizeReportId(group.id) ===
          normalizeReportId(selectedVehicleGroupId.value)
        )
      })

      if (!selectedGroupExists) {
        selectedVehicleGroupId.value = "all"
      }
    },
    {
      immediate: true,
    },
  )

  return {
    dateFrom,
    dateTo,
    assetSearch,

    /*
     * Alias temporal para no romper ReportExecutionModal.vue.
     */
    selectedGroupId: selectedVehicleGroupId,
    selectedVehicleGroupId,

    selectedAssetIds,
    selectedAssetIdSet,
    groupOptions,
    groupNameById,
    groupAssetCount,
    selectedAssetCount,
    selectedGroupLabel,
    filteredAssets,
    reportColumns,
    reportRows,
    reportSummary,
    hasReport,
    hasExecutedReport,
    dateRangeError,
    canExecuteReport,

    getAssetLabel,
    toggleAsset,
    selectFilteredAssets,
    clearSelectedAssets,
    executeReport,
    exportExcel,
    exportPdf,
    resetExecution,

    /*
     * Alias temporal para mantener compatibilidad.
     */
    getAssetGroupLabel: getAssetVehicleGroupLabel,
    getAssetVehicleGroupLabel,
  }
}