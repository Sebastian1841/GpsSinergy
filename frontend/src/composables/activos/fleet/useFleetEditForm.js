import { computed, ref, watch } from "vue"

import {
  buildFleetEditPayload,
  createEmptyFleetEditForm,
  createFleetEditFormFromActivo,
  fleetAssetFormSteps,
  fleetTrackerModelOptions,
} from "../../../utils/activos/fleetAssetFormUtils.js"
import { useFleetFormWizard } from "./useFleetFormWizard.js"

export function useFleetEditForm({ props, emit }) {
  const steps = fleetAssetFormSteps
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
