export const normalizeTagSearch = (value) =>
  String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()

export function matchesTagAssetSearch(assetText, { tagName, globalQuery, localQuery }) {
  const text = normalizeTagSearch(assetText)
  const global = normalizeTagSearch(globalQuery)
  const local = normalizeTagSearch(localQuery)
  return (!local || text.includes(local)) &&
    (!global || normalizeTagSearch(tagName).includes(global) || text.includes(global))
}
