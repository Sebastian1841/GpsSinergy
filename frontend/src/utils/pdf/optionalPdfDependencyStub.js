const createUnavailableDependencyError = () => {
  return new Error("Optional jsPDF HTML rendering dependencies are not bundled in this app.")
}

export const sanitize = (value) => value

export default function unavailableOptionalPdfDependency() {
  throw createUnavailableDependencyError()
}
