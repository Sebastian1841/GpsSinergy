export const formatCompanyRut = (value) => {
  const clean = String(value ?? "")
    .toUpperCase()
    .replace(/[^0-9K]/g, "")
    .replace(/K(?!$)/g, "")
    .slice(0, 9)
  if (clean.length < 2) return clean === "K" ? "" : clean
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${body}-${clean.at(-1)}`
}
