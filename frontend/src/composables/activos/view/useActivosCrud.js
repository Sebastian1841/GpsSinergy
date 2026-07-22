import { computed, ref, unref } from "vue"

import { getAssetTypeOption } from "../../../utils/activos/assetTypeOptions.js"

const fallbackDrivers = [
  "Carlos Ramírez",
  "María Gómez",
  "Juan Pérez",
  "Ana Torres",
  "Luis Hidalgo",
  "Felipe Soto",
]

const emptyValue = (value) => {
  if (value === "" || value === null || value === undefined) return "-"

  return value
}

const formatKm = (value) => {
  if (value === "" || value === null || value === undefined) return "-"

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return String(value)

  return `${numberValue.toLocaleString("es-CL")} km`
}

export function useActivosCrud({
  baseMockActivos,
  customActivos = ref([]),
  deletedActivoIds = ref([]),
  editedActivos = ref({}),
  getNormalizedActivos,
  getMapActivos,
  selectedId,
  statusFilter,
  activeSidebarSection,
  sectionSearch,
  openConfirmDialog,
  removeTerminalHistory,
  terminalActivo,
  closeTerminalModal,
  openFleetTerminalModal,
  refreshMapLayout,
  createActivo,
  updateActivo,
  removeActivo,
}) {
  const showActivoModal = ref(false)
  const showEditActivoModal = ref(false)
  const editingActivo = ref(null)

  const cloneFleetSnapshot = (snapshot = []) => {
    return snapshot.map((activo) => {
      return {
        ...activo,
      }
    })
  }

  const getBaseActivos = () => {
    return unref(baseMockActivos) || []
  }

  const rawActivos = computed(() => {
    const deletedIds = new Set(deletedActivoIds.value.map((id) => String(id)))

    return [...customActivos.value, ...getBaseActivos()]
      .filter((activo) => {
        return !deletedIds.has(String(activo.id))
      })
      .map((activo) => {
        const editedActivo = editedActivos.value[String(activo.id)]

        return editedActivo
          ? {
              ...activo,
              ...editedActivo,
            }
          : activo
      })
  })

  const baseNormalizedActivos = computed(() => {
    return rawActivos.value.map((activo, index) => {
      const estado = activo.estado || "offline"
      const isCustomAsset = activo.source === "custom"

      return {
        ...activo,

        vehiculo:
          activo.vehiculo || activo.nombrePantalla || activo.displayName || activo.name || "-",

        name: activo.name || activo.vehiculo || "-",

        nombrePantalla: activo.nombrePantalla || activo.displayName || activo.vehiculo || "-",

        conductor: isCustomAsset
          ? emptyValue(activo.conductor)
          : activo.conductor || fallbackDrivers[index % fallbackDrivers.length],

        velocidad:
          activo.velocidad ||
          (isCustomAsset
            ? "-"
            : estado === "moving"
              ? "62 km/h"
              : estado === "idle"
                ? "0 km/h"
                : "-"),

        combustible:
          activo.combustible ||
          activo.fuel ||
          (isCustomAsset ? "-" : estado === "offline" ? "-" : `${68 - index * 2}%`),

        odometro:
          activo.odometro ||
          activo.odometer ||
          (isCustomAsset ? "-" : `${(125430 + index * 1820).toLocaleString("es-CL")} km`),

        direccion: activo.direccion || activo.ubicacion || "Última ubicación registrada",

        ignicion:
          activo.ignicion ??
          activo.ignition ??
          activo.contacto ??
          (estado === "moving" || estado === "idle"),

        ignition:
          activo.ignition ??
          activo.ignicion ??
          activo.contacto ??
          (estado === "moving" || estado === "idle"),
        contacto:
          activo.contacto ??
          activo.ignition ??
          activo.ignicion ??
          (estado === "moving" || estado === "idle"),
        digitalInput1:
          activo.digitalInput1 ??
          activo.input1 ??
          (estado === "moving" || estado === "idle" ? 1 : 0),
        digitalInput2: activo.digitalInput2 ?? activo.input2 ?? 0,
        input1:
          activo.input1 ??
          activo.digitalInput1 ??
          (estado === "moving" || estado === "idle" ? 1 : 0),
        input2: activo.input2 ?? activo.digitalInput2 ?? 0,

        ibutton: isCustomAsset
          ? emptyValue(activo.ibutton)
          : activo.ibutton || `iButton # ${String(index + 1).padStart(3, "0")}`,

        imei:
          activo.imei ||
          activo.deviceId ||
          activo.identificador ||
          `86812345${String(index + 1).padStart(4, "0")}`,

        protocol: activo.protocol || "-",

        trackerModel: activo.trackerModel || "-",
        trackerModelLabel: activo.trackerModelLabel || "-",
        trackerManufacturer: activo.trackerManufacturer || "-",

        descripcion: activo.descripcion || activo.description || "-",

        fechaIngreso: activo.fechaIngreso || activo.entryDate || "-",
        fechaBaja: activo.fechaBaja || activo.deactivationDate || "-",
        fechaSuspension: activo.fechaSuspension || activo.suspensionDate || "-",

        horometroDiario: emptyValue(activo.horometroDiario ?? activo.dailyHourmeter),
        horometroTotal: emptyValue(activo.horometroTotal ?? activo.totalHourmeter),
      }
    })
  })

  const createActivoId = () => {
    return `asset-${Date.now()}`
  }

  const getCurrentTimeLabel = () => {
    return new Date().toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  const buildActivoDataFromForm = (form = {}, fallbackActivo = {}) => {
    const displayName =
      form.displayName ||
      form.vehiculo ||
      form.nombrePantalla ||
      form.name ||
      fallbackActivo.vehiculo ||
      fallbackActivo.nombrePantalla ||
      fallbackActivo.name ||
      "Activo sin nombre"

    const name = form.name || fallbackActivo.name || displayName

    const odometerFromForm = form.odometer ?? form.odometro
    const assetTypeOption = getAssetTypeOption(
      form.assetType ||
        form.tipoActivo ||
        form.mapIcon ||
        form.markerIcon ||
        form.iconType ||
        fallbackActivo.assetType ||
        fallbackActivo.tipoActivo ||
        fallbackActivo.mapIcon,
    )
    const mapIcon =
      form.mapIcon ||
      form.markerIcon ||
      form.iconType ||
      fallbackActivo.mapIcon ||
      fallbackActivo.markerIcon ||
      fallbackActivo.iconType ||
      assetTypeOption.mapIcon

    return {
      assetType: assetTypeOption.value,
      assetTypeLabel: assetTypeOption.label,
      tipoActivo: assetTypeOption.value,
      tipoActivoLabel: assetTypeOption.label,
      mapIcon,
      markerIcon: mapIcon,
      iconType: mapIcon,
      sucursalId: form.sucursalId || fallbackActivo.sucursalId || null,

      estado: form.estado || fallbackActivo.estado || "offline",

      vehiculo: displayName,
      name,
      nombrePantalla:
        form.displayName || form.nombrePantalla || fallbackActivo.nombrePantalla || displayName,

      trackerModel: form.trackerModel || fallbackActivo.trackerModel || "-",
      trackerModelLabel:
        form.trackerModelLabel || fallbackActivo.trackerModelLabel || form.trackerModel || "-",
      trackerManufacturer: form.trackerManufacturer || fallbackActivo.trackerManufacturer || "-",

      imei: form.imei || fallbackActivo.imei || "-",
      protocol: form.protocol || fallbackActivo.protocol || "tcp",

      descripcion: form.description || form.descripcion || fallbackActivo.descripcion || "-",

      fechaIngreso: form.entryDate || form.fechaIngreso || fallbackActivo.fechaIngreso || "-",

      fechaBaja: form.deactivationDate || form.fechaBaja || fallbackActivo.fechaBaja || "-",

      fechaSuspension:
        form.suspensionDate || form.fechaSuspension || fallbackActivo.fechaSuspension || "-",

      horometroDiario: emptyValue(
        form.dailyHourmeter ?? form.horometroDiario ?? fallbackActivo.horometroDiario,
      ),

      horometroTotal: emptyValue(
        form.totalHourmeter ?? form.horometroTotal ?? fallbackActivo.horometroTotal,
      ),

      odometro:
        form.odometer !== undefined && form.odometer !== null && form.odometer !== ""
          ? formatKm(form.odometer)
          : emptyValue(odometerFromForm ?? fallbackActivo.odometro),

      direccion:
        form.direccion ||
        form.ubicacion ||
        fallbackActivo.direccion ||
        "Última ubicación registrada",
    }
  }

  const openAddActivoModal = () => {
    activeSidebarSection.value = "activos"
    showEditActivoModal.value = false
    editingActivo.value = null
    showActivoModal.value = true
  }

  const handleAddActivo = async (form) => {
    const baseData = buildActivoDataFromForm(form, {
      estado: "offline",
      direccion: "Ubicación pendiente de reporte GPS",
    })

    const newActivo = {
      id: createActivoId(),
      source: "custom",

      ...baseData,

      datosUlt:
        baseData.fechaIngreso && baseData.fechaIngreso !== "-"
          ? baseData.fechaIngreso
          : getCurrentTimeLabel(),

      choque: "-",

      conductor: "-",
      velocidad: "-",
      combustible: "-",
      ibutton: "-",

      lat: -33.4489 + customActivos.value.length * 0.002,
      lng: -70.6693 + customActivos.value.length * 0.002,
    }

    if (createActivo) {
      createActivo(newActivo)
    } else {
      customActivos.value = [newActivo, ...customActivos.value]
    }

    sectionSearch.value = {
      ...sectionSearch.value,
      activos: "",
    }

    statusFilter.value = "all"
    activeSidebarSection.value = "activos"
    selectedId.value = newActivo.id

    showActivoModal.value = false
    editingActivo.value = null

    await refreshMapLayout(true)
  }

  const openEditActivoModal = (activo) => {
    if (!activo) return

    selectedId.value = activo.id
    showActivoModal.value = false
    editingActivo.value = activo
    showEditActivoModal.value = true
  }

  const handleUpdateActivo = async (payload) => {
    const id = payload?.id ?? editingActivo.value?.id

    if (id === null || id === undefined) return

    const normalizedActivos = getNormalizedActivos?.() || []

    const baseActivo =
      normalizedActivos.find((activo) => {
        return String(activo.id) === String(id)
      }) ||
      editingActivo.value ||
      {}

    const form = payload?.data || payload?.form || payload || {}

    const data = buildActivoDataFromForm(form, baseActivo)

    delete data.estado
    delete data.direccion

    if (updateActivo) {
      updateActivo(id, data)
    } else {
      editedActivos.value = {
        ...editedActivos.value,
        [String(id)]: data,
      }
    }

    selectedId.value = id
    showEditActivoModal.value = false
    editingActivo.value = null

    await refreshMapLayout(true)
  }

  const openTerminalModal = (activo) => {
    if (!activo) return

    selectedId.value = activo.id
    openFleetTerminalModal(activo)
  }

  const deleteActivo = async (activo) => {
    if (!activo?.id) return

    const activoName = activo.vehiculo || activo.name || activo.id

    const confirmed = await openConfirmDialog({
      title: "Eliminar activo",
      message: `¿Seguro que deseas eliminar "${activoName}"?`,
      detail: "El activo se quitará de la lista y del mapa en esta sesión.",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      variant: "danger",
    })

    if (!confirmed) return

    if (removeActivo) {
      removeActivo(activo.id)
    } else {
      customActivos.value = customActivos.value.filter((item) => {
        return String(item.id) !== String(activo.id)
      })

      if (!deletedActivoIds.value.some((id) => String(id) === String(activo.id))) {
        deletedActivoIds.value = [...deletedActivoIds.value, activo.id]
      }

      const nextEditedActivos = {
        ...editedActivos.value,
      }

      delete nextEditedActivos[String(activo.id)]

      editedActivos.value = nextEditedActivos
    }

    removeTerminalHistory(activo)

    if (String(selectedId.value) === String(activo.id)) {
      const mapActivos = getMapActivos?.() || []

      const nextActivo = mapActivos.find((item) => {
        return String(item.id) !== String(activo.id)
      })

      selectedId.value = nextActivo?.id || null
    }

    if (String(editingActivo.value?.id) === String(activo.id)) {
      showEditActivoModal.value = false
      editingActivo.value = null
    }

    if (String(terminalActivo.value?.id) === String(activo.id)) {
      closeTerminalModal()
    }

    await refreshMapLayout(true)
  }

  const handleDeviceAction = async ({ action, activo }) => {
    if (!activo) return

    selectedId.value = activo.id

    if (action === "edit-device") {
      openEditActivoModal(activo)
      return
    }

    if (action === "open-terminal") {
      openTerminalModal(activo)
      return
    }

    if (action === "delete-device") {
      await deleteActivo(activo)
    }
  }

  return {
    rawActivos,
    baseNormalizedActivos,
    showActivoModal,
    showEditActivoModal,
    editingActivo,

    cloneFleetSnapshot,
    openAddActivoModal,
    handleAddActivo,
    openEditActivoModal,
    handleUpdateActivo,
    openTerminalModal,
    deleteActivo,
    handleDeviceAction,
  }
}
