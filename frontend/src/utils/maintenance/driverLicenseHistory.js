// Older records stored the previous license; never present its photos as the renewed license.
export const getDriverRenewalLicense = (entry, driver) => {
  if (entry.renewedLicense) {
    const id = entry.renewedLicense.licenseId
    const current = id && driver.licenseId === id ? driver : null
    const archived = id ? driver.history?.find((item) => item.licenseId === id) : null
    const latest = current || archived
    return { ...entry.renewedLicense, ...(latest ? { photos: latest.photos, expiresAt: latest.expiresAt, classes: latest.classes } : {}), isPrevious: false }
  }
  if (entry.newExpiresAt) {
    const correctedIds = [...new Set((driver.corrections || [])
      .filter((item) => item.licenseId && item.licenseId !== entry.licenseId && item.previous?.expiresAt === entry.newExpiresAt)
      .map((item) => item.licenseId))]
    // Follow audited identity changes; never guess between licenses with the same old date.
    const correctedId = correctedIds.length === 1 ? correctedIds[0] : null
    const candidates = [driver, ...(driver.history || [])]
    const corrected = correctedId ? candidates.find((item) => (item.licenseId || item.createdAt) === correctedId) : null
    const archived = !correctedIds.length ? driver.history?.find((item) => item.expiresAt === entry.newExpiresAt) : null
    const current = !correctedIds.length && driver.expiresAt === entry.newExpiresAt ? driver : null
    const license = corrected || archived || current
    return {
      classes: license?.classes || entry.newClasses || [],
      expiresAt: license?.expiresAt || entry.newExpiresAt,
      photos: license?.photos || { front: null, back: null },
      isPrevious: false,
    }
  }
  return { classes: entry.classes, expiresAt: entry.expiresAt, photos: entry.photos, isPrevious: true }
}
