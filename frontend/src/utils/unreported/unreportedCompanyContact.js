export const resolveUnreportedCompanyContact = (companies, companyName) => {
  const matches = companies.filter((company) => company.name === companyName)
  if (matches.length !== 1) return { name: "", phone: "", href: "" }
  const company = matches[0]
  const name = String(company.contactName || "").trim()
  const phone = String(company.contactPhone || "").trim()
  const number = phone.replace(/[\s().-]/g, "")
  const href = /^\+?\d{6,15}$/.test(number) ? `tel:${number}` : ""
  return { name, phone, href }
}
