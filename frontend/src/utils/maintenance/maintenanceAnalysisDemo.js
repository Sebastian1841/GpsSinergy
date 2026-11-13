import { maintenanceDay } from './maintenanceHistoricalReading.js'

const dayLabel = (year, month, day) => new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10)

export const buildMaintenanceAnalysisDemo = (now = new Date()) => {
  const [year, month, today] = maintenanceDay(now).split('-').map(Number)
  const vehicles = ['MAES-01', 'GKZK-26', 'TWDR-56', 'SSGY-01', 'PLKR-18', 'LXHD-60', 'BDFR-22', 'JVTS-48'].map((plate, index) => ({
    id: `analysis-demo-${index + 1}`, plate, assetName: `${index < 5 ? 'Camion' : 'Vehiculo menor'} ${index + 1}`, status: 'current',
  }))
  const orders = []
  for (let offset = 11; offset >= 0; offset--) {
    const date = new Date(Date.UTC(year, month - 1 - offset, 1))
    const y = date.getUTCFullYear(), m = date.getUTCMonth()
    const count = 4 + (offset % 5)
    for (let index = 0; index < count; index++) {
      const day = offset === 0 ? Math.max(1, today - 1 - index % 4) : 4 + index * 3
      const weight = 1 + ((offset * 3 + index) % 6) * 0.18
      const laborCost = Math.round((35000 + index * 8500) * weight)
      const partsCost = Math.round((70000 + ((index + offset) % 7) * 32000) * weight)
      const otherCost = Math.round((8000 + (index % 3) * 6000) * weight)
      orders.push({
        id: `analysis-demo-order-${offset}-${index}`, vehicleId: vehicles[(offset + index) % vehicles.length].id,
        status: 'finished', closedAt: dayLabel(y, m, day), createdAt: dayLabel(y, m, day - 2 - index % 4),
        scheduledDate: index === count - 1 ? '' : dayLabel(y, m, day + (index % 3 === 0 ? -2 : 1)),
        laborCost, partsCost, otherCost, actualCost: laborCost + partsCost + otherCost,
      })
    }
  }
  return { vehicles, orders }
}
