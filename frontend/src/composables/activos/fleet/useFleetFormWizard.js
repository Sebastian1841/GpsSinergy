import { computed, ref } from "vue"

export function useFleetFormWizard(steps) {
  const currentStep = ref(0)

  const currentStepConfig = computed(() => steps[currentStep.value] || steps[0])

  const progressWidth = computed(() => {
    return `${((currentStep.value + 1) / steps.length) * 100}%`
  })

  const goToStep = (index) => {
    currentStep.value = Math.min(Math.max(Number(index), 0), steps.length - 1)
  }

  const nextStep = () => {
    currentStep.value = Math.min(currentStep.value + 1, steps.length - 1)
  }

  const previousStep = () => {
    currentStep.value = Math.max(currentStep.value - 1, 0)
  }

  const resetWizard = () => {
    currentStep.value = 0
  }

  return {
    currentStep,
    currentStepConfig,
    progressWidth,
    goToStep,
    nextStep,
    previousStep,
    resetWizard,
  }
}
