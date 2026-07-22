import { computed, ref, watch } from "vue"

import {
  buildFleetEditPayload,
  createEmptyFleetEditForm,
  createFleetEditFormFromActivo,
  fleetAssetFormSteps,
  fleetAssetTypeOptions,
  fleetTrackerModelOptions,
} from "../../../utils/activos/fleetAssetFormUtils.js"
import { getAssetTypeMapIcon, getAssetTypeOption } from "../../../utils/activos/assetTypeOptions.js"
import { useFleetFormWizard } from "./useFleetFormWizard.js"

export function useFleetEditForm({ props, emit }) {
  const steps = fleetAssetFormSteps
  const trackerModelOptions = fleetTrackerModelOptions
  const assetTypeOptions = fleetAssetTypeOptions

  const {
    currentStep,
    currentStepConfig,
    progressWidth,
    goToStep,
    nextStep,
    previousStep,
    resetWizard,
  } = useFleetFormWizard(steps)

  const form = ref(createEmptyFleetEditForm())

  const selectedTrackerModel = computed(() => {
    return trackerModelOptions.find((option) => option.value === form.value.trackerModel) || null
  })

  const selectedTrackerModelLabel = computed(() => {
    if (selectedTrackerModel.value) {
      return `${selectedTrackerModel.value.manufacturer} ${selectedTrackerModel.value.label}`
    }

    return form.value.trackerModelLabel || ""
  })

  const selectedAssetType = computed(() => {
    return getAssetTypeOption(form.value.assetType || form.value.mapIcon)
  })

  const groupOptions = computed(() => {
    return (props.groups || []).filter((group) => {
      return group.active !== false || String(group.id) === String(form.value.sucursalId)
    })
  })

  const selectedGroupLabel = computed(() => {
    if (!form.value.sucursalId) return "Sin grupo"

    return (
      (props.groups || []).find((group) => String(group.id) === String(form.value.sucursalId))
        ?.name || "Sin grupo"
    )
  })

  const isAssetStepValid = computed(() => {
    return Boolean(form.value.name.trim() && form.value.displayName.trim())
  })

  const isDeviceStepValid = computed(() => {
    return Boolean(form.value.imei.trim())
  })

  const canSaveActivo = computed(() => {
    return Boolean(isAssetStepValid.value && isDeviceStepValid.value)
  })

  const requiredStatus = computed(() => [
    {
      label: "Activo",
      done: isAssetStepValid.value,
    },
    {
      label: "Dispositivo",
      done: isDeviceStepValid.value,
    },
  ])

  const summaryItems = computed(() => [
    {
      label: "Activo",
      value: form.value.displayName,
    },
    {
      label: "Tipo",
      value: selectedAssetType.value?.label,
    },
    {
      label: "Grupo",
      value: selectedGroupLabel.value,
    },
    {
      label: "Modelo",
      value: selectedTrackerModelLabel.value,
    },
    {
      label: "IMEI",
      value: form.value.imei,
    },
    {
      label: "Protocolo",
      value: form.value.protocol.toUpperCase(),
    },
    {
      label: "Ingreso",
      value: form.value.entryDate,
    },
    {
      label: "Odómetro",
      value: form.value.odometer,
    },
  ])

  const resetModal = () => {
    resetWizard()

    if (props.activo) {
      form.value = createFleetEditFormFromActivo(props.activo, trackerModelOptions)
      return
    }

    form.value = createEmptyFleetEditForm()
  }

  watch(
    () => [props.modelValue, props.activo],
    () => {
      if (props.modelValue) {
        resetModal()
      }
    },
    {
      immediate: true,
    },
  )

  watch(groupOptions, () => {
    if (!form.value.sucursalId) return

    const groupExists = (props.groups || []).some((group) => {
      return String(group.id) === String(form.value.sucursalId)
    })

    if (!groupExists) {
      form.value.sucursalId = ""
    }
  })

  const isStepCompleted = (index) => {
    if (index === 0) return isAssetStepValid.value
    if (index === 1) return isDeviceStepValid.value
    if (index === 2) {
      return Boolean(
        form.value.entryDate || form.value.deactivationDate || form.value.suspensionDate,
      )
    }
    if (index === 3) {
      return Boolean(form.value.dailyHourmeter || form.value.totalHourmeter || form.value.odometer)
    }

    return false
  }

  const closeModal = () => {
    emit("update:modelValue", false)
  }

  const selectAssetType = (assetType) => {
    const assetTypeOption = getAssetTypeOption(assetType)

    form.value.assetType = assetTypeOption.value
    form.value.assetTypeLabel = assetTypeOption.label
    form.value.mapIcon = getAssetTypeMapIcon(assetTypeOption.value)
  }

  const buildPayload = () => {
    return buildFleetEditPayload({
      form: form.value,
      activo: props.activo,
      selectedTrackerModel: selectedTrackerModel.value,
      selectedTrackerModelLabel: selectedTrackerModelLabel.value,
    })
  }

  const submitForm = () => {
    if (!canSaveActivo.value || !props.activo) return

    emit("update-activo", {
      id: props.activo.id,
      data: buildPayload(),
    })

    closeModal()
  }

  return {
    steps,
    trackerModelOptions,
    assetTypeOptions,
    currentStep,
    currentStepConfig,
    progressWidth,
    goToStep,
    nextStep,
    previousStep,
    form,
    selectedTrackerModel,
    selectedTrackerModelLabel,
    selectedAssetType,
    groupOptions,
    canSaveActivo,
    requiredStatus,
    summaryItems,
    isStepCompleted,
    closeModal,
    selectAssetType,
    submitForm,
  }
}
