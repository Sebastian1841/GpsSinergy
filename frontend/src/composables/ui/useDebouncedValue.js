import { onBeforeUnmount, ref, watch } from "vue"

export function useDebouncedValue(source, delay = 180) {
  const debouncedValue = ref(source.value)
  let timeoutId = null

  const clearDebounce = () => {
    if (!timeoutId) return

    clearTimeout(timeoutId)
    timeoutId = null
  }

  watch(
    source,
    (value) => {
      clearDebounce()

      timeoutId = setTimeout(() => {
        debouncedValue.value = value
        timeoutId = null
      }, delay)
    },
    {
      immediate: true,
    },
  )

  onBeforeUnmount(() => {
    clearDebounce()
  })

  return debouncedValue
}
