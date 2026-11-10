export const getWorkOrderPage = (orders, page = 1, pageSize = 10) => {
  const size = [10, 25, 50].includes(Number(pageSize)) ? Number(pageSize) : 10
  const total = orders.length
  const pageCount = Math.max(1, Math.ceil(total / size))
  const current = Math.min(pageCount, Math.max(1, Math.trunc(Number(page)) || 1))
  const offset = (current - 1) * size
  return {
    page: current, pageCount, total,
    start: total ? offset + 1 : 0,
    end: Math.min(offset + size, total),
    rows: orders.slice(offset, offset + size),
  }
}
