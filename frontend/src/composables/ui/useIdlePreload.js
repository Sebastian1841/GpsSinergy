export const preloadWhenIdle = (loaders = [], { timeout = 2500, delay = 800 } = {}) => {
  if (typeof window === "undefined" || !Array.isArray(loaders) || !loaders.length) return

  const preload = () => {
    const preloadJobs = loaders
      .map((load) => {
        if (typeof load !== "function") return null

        try {
          return load()
        } catch {
          return null
        }
      })
      .filter(Boolean)

    if (preloadJobs.length) {
      void Promise.allSettled(preloadJobs)
    }
  }

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(preload, { timeout })
    return
  }

  window.setTimeout(preload, delay)
}
