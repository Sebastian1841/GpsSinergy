export const resolveUnreportedCompanyContact = (companies, identity) => {
  const matches = companies.filter((company) =>
    typeof identity === "object" && identity !== null
      ? identity.companyId != null && String(company.id) === String(identity.companyId)
      : company.name === identity,
  )
  if (matches.length !== 1) return { name: "", phone: "", href: "" }
  const company = matches[0]
  const name = String(company.contactName || "").trim()
  const phone = String(company.contactPhone || "").trim()
  const number = phone.replace(/[\s().-]/g, "")
  const href = /^\+?\d{6,15}$/.test(number) ? `tel:${number}` : ""
  return { name, phone, href }
}
