import { reactive } from "vue"

const DEFAULT_CONFIRM_OPTIONS = {
  title: "Confirmar acción",
  message: "¿Seguro que deseas continuar?",
  detail: "",
  confirmLabel: "Confirmar",
  cancelLabel: "Cancelar",
  variant: "danger",
}

export function useConfirmDialog() {
  const confirmDialog = reactive({
    isOpen: false,
    title: DEFAULT_CONFIRM_OPTIONS.title,
    message: DEFAULT_CONFIRM_OPTIONS.message,
    detail: DEFAULT_CONFIRM_OPTIONS.detail,
    confirmLabel: DEFAULT_CONFIRM_OPTIONS.confirmLabel,
    cancelLabel: DEFAULT_CONFIRM_OPTIONS.cancelLabel,
    variant: DEFAULT_CONFIRM_OPTIONS.variant,
  })

  let resolver = null

  const resetConfirmDialog = () => {
    confirmDialog.isOpen = false
    confirmDialog.title = DEFAULT_CONFIRM_OPTIONS.title
    confirmDialog.message = DEFAULT_CONFIRM_OPTIONS.message
    confirmDialog.detail = DEFAULT_CONFIRM_OPTIONS.detail
    confirmDialog.confirmLabel = DEFAULT_CONFIRM_OPTIONS.confirmLabel
    confirmDialog.cancelLabel = DEFAULT_CONFIRM_OPTIONS.cancelLabel
    confirmDialog.variant = DEFAULT_CONFIRM_OPTIONS.variant
    resolver = null
  }

  const openConfirmDialog = (options = {}) => {
    if (resolver) {
      resolver(false)
    }

    Object.assign(confirmDialog, {
      ...DEFAULT_CONFIRM_OPTIONS,
      ...options,
      isOpen: true,
    })

    return new Promise((resolve) => {
      resolver = resolve
    })
  }

  const confirmAction = () => {
    if (resolver) {
      resolver(true)
    }

    resetConfirmDialog()
  }

  const cancelAction = () => {
    if (resolver) {
      resolver(false)
    }

    resetConfirmDialog()
  }

  return {
    confirmDialog,
    openConfirmDialog,
    confirmAction,
    cancelAction,
  }
}
