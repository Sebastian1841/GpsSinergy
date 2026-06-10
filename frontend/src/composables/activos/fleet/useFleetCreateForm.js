import { computed, ref, watch } from "vue"

import {
  buildFleetCreatePayload,
  createEmptyFleetCreateForm,
  fleetCreateFormSteps,
  fleetTrackerModelOptions,
} from "../../../utils/activos/fleetAssetFormUtils.js"
import { useFleetFormWizard } from "./useFleetFormWizard.js"

export function useFleetCreateForm({ props, emit }) {
  const steps = fleetCreateFormSteps
  const trackerModelOptions = fleetTrackerModelOptions

  const {
    currentStep,
    currentStepConfig,
    progressWidth,
    goToStep,
    nextStep,
    previousStep,
    resetWizard,
  } = useFleetFormWizard(steps)

  const form = ref(createEmptyFleetCreateForm())

  const selectedTrackerModel = computed(() => {
    return trackerModelOptions.find((option) => option.value === form.value.trackerModel) || null
  })

  const selectedTrackerModelLabel = computed(() => {
    if (!selectedTrackerModel.value) return ""

    return `${selectedTrackerModel.value.manufacturer} ${selectedTrackerModel.value.label}`
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
    form.value = createEmptyFleetCreateForm()
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
    currentStep,
    currentStepConfig,
    progressWidth,
    goToStep,
    nextStep,
    previousStep,
    form,
    selectedTrackerModel,
    selectedTrackerModelLabel,
    canSaveActivo,
    requiredStatus,
    summaryItems,
    isStepCompleted,
    closeModal,
    submitForm,
  }
}
