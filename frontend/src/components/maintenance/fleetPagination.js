export function getFleetPage(items, page = 1, pageSize = 20) {
  const size = [10, 20, 50].includes(Number(pageSize)) ? Number(pageSize) : 20
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / size))
  const current = Math.min(pageCount, Math.max(1, Math.trunc(Number(page)) || 1))
  const offset = (current - 1) * size
  return {
    page: current,
    pageCount,
    total,
    start: total ? offset + 1 : 0,
    end: Math.min(offset + size, total),
    rows: items
      .slice(offset, offset + size)
      .map((item, index) => ({ item, index: offset + index })),
  }
}
