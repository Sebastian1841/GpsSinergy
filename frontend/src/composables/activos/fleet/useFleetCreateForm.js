import { computed, ref, watch } from "vue"

import {
  buildFleetCreatePayload,
  createEmptyFleetCreateForm,
  fleetAssetTypeOptions,
  fleetCreateFormSteps,
  fleetTrackerModelOptions,
} from "../../../utils/activos/fleetAssetFormUtils.js"
import { getAssetTypeMapIcon, getAssetTypeOption } from "../../../utils/activos/assetTypeOptions.js"
import { getOperationalProfile } from "../../../utils/activos/operationalProfileOptions.js"
import { useFleetFormWizard } from "./useFleetFormWizard.js"

export function useFleetCreateForm({ props, emit }) {
  const steps = fleetCreateFormSteps
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

  const createFormState = () => {
    const emptyForm = createEmptyFleetCreateForm()

    return {
      ...emptyForm,
      assetTagIds: Array.isArray(emptyForm.assetTagIds) ? [...emptyForm.assetTagIds] : [],
    }
  }

  const form = ref(createFormState())

  const selectedTrackerModel = computed(() => {
    return trackerModelOptions.find((option) => option.value === form.value.trackerModel) || null
  })

  const selectedTrackerModelLabel = computed(() => {
    if (!selectedTrackerModel.value) return ""

    return `${selectedTrackerModel.value.manufacturer} ${selectedTrackerModel.value.label}`
  })

  const selectedAssetType = computed(() => {
    return getAssetTypeOption(form.value.assetType || form.value.mapIcon)
  })

  const selectedOperationalProfile = computed(() => {
    return getOperationalProfile(selectedAssetType.value?.value)
  })

  const activeAssetTagOptions = computed(() => {
    return (props.assetTags || []).filter((tag) => tag.active !== false)
  })

  const selectedAssetTagIds = computed(() => {
    if (!Array.isArray(form.value.assetTagIds)) return []

    return form.value.assetTagIds.map((tagId) => String(tagId))
  })

  const selectedAssetTags = computed(() => {
    const selectedIds = new Set(selectedAssetTagIds.value)

    return activeAssetTagOptions.value.filter((tag) => {
      return selectedIds.has(String(tag.id))
    })
  })

  const selectedAssetTagNames = computed(() => {
    return selectedAssetTags.value.map((tag) => tag.name)
  })

  const selectedAssetTagLabel = computed(() => {
    if (!selectedAssetTagNames.value.length) {
      return "Sin etiquetas"
    }

    return selectedAssetTagNames.value.join(" · ")
  })

  const isAssetStepValid = computed(() => {
    return Boolean(form.value.name.trim() && form.value.displayName.trim())
  })

  const isDeviceStepValid = computed(() => {
    return Boolean(form.value.trackerModel && form.value.imei.trim())
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
      label: "Perfil",
      value: selectedOperationalProfile.value?.label,
    },
    {
      label: "Etiquetas",
      value: selectedAssetTagLabel.value,
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
      value: form.value.protocol?.toUpperCase() || "",
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
    form.value = createFormState()
  }

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) resetModal()
    },
  )

  watch(
    () => form.value.trackerModel,
    (trackerModel) => {
      if (!trackerModel) {
        form.value.imei = ""
      }
    },
  )

  watch(
    activeAssetTagOptions,
    (tags) => {
      if (!Array.isArray(form.value.assetTagIds)) {
        form.value.assetTagIds = []
        return
      }

      const validTagIds = new Set(tags.map((tag) => String(tag.id)))

      form.value.assetTagIds = form.value.assetTagIds.filter((tagId) => {
        return validTagIds.has(String(tagId))
      })
    },
    {
      deep: true,
    },
  )

  const isStepCompleted = (index) => {
    if (index === 0) {
      return isAssetStepValid.value
    }

    if (index === 1) {
      return selectedAssetTagIds.value.length > 0
    }

    if (index === 2) {
      return isDeviceStepValid.value
    }

    if (index === 3) {
      return Boolean(
        form.value.entryDate || form.value.deactivationDate || form.value.suspensionDate,
      )
    }

    if (index === 4) {
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
    return buildFleetCreatePayload({
      form: form.value,
      selectedTrackerModel: selectedTrackerModel.value,
      selectedTrackerModelLabel: selectedTrackerModelLabel.value,
    })
  }

  const submitForm = () => {
    if (!canSaveActivo.value) return

    emit("add-activo", buildPayload())
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
    selectedOperationalProfile,

    activeAssetTagOptions,
    selectedAssetTagIds,
    selectedAssetTags,
    selectedAssetTagNames,
    selectedAssetTagLabel,

    canSaveActivo,
    requiredStatus,
    summaryItems,

    isStepCompleted,
    closeModal,
    selectAssetType,
    submitForm,
  }
}
