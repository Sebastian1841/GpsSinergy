<template>
  <section class="charts-grid" aria-label="Graficos de equipos sin reporte">
    <article class="chart-panel">
      <header><h2>Equipos por estado</h2></header>
      <div class="status-layout">
        <div class="status-chart"><canvas ref="statusCanvas" /></div>
        <ul class="status-legend">
          <li v-for="item in statusLegend" :key="item.label">
            <span class="legend-dot" :style="{ backgroundColor: item.color }" />
            <span class="legend-label">{{ item.label }}</span><strong>{{ item.value }}</strong><span>{{ item.percent }}</span>
          </li>
        </ul>
      </div>
    </article>
    <article class="chart-panel">
      <header>
        <h2>Tiempo sin reportar</h2>
        <span>Total: {{ rows.length }} equipos</span>
      </header>
      <div class="chart-area"><canvas ref="durationCanvas" /></div>
    </article>
    <article class="chart-panel">
      <header>
        <h2>Equipos por empresa</h2>
        <span>Total: {{ rows.length }} equipos</span>
      </header>
      <div class="chart-area"><canvas ref="companyCanvas" /></div>
    </article>
    <article class="chart-panel">
      <header><h2>Top equipos con mayor tiempo sin reportar</h2></header>
      <div class="chart-area"><canvas ref="rankingCanvas" /></div>
    </article>
  </section>
</template>

<script setup>
import { Chart, registerables } from "chart.js"
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"

Chart.register(...registerables)
const props = defineProps({ rows: { type: Array, required: true } })
const statusCanvas = ref(null)
const durationCanvas = ref(null)
const companyCanvas = ref(null)
const rankingCanvas = ref(null)
const charts = []
const statuses = [
  { label: "Corte de alimentacion", color: "#ff1744" },
  { label: "Requiere revision", color: "#ff7900" },
  { label: "Sin conexion", color: "#087cff" },
  { label: "Nunca reporto", color: "#7c3aed" },
]
const countBy = (items, key) =>
  items.reduce((result, item) => ({ ...result, [item[key]]: (result[item[key]] ?? 0) + 1 }), {})
const durationHours = (duration) => {
  const value = Number.parseInt(duration) || 0
  return duration.includes("dia")
    ? value * 24 + (Number(duration.match(/(\d+)\s*h/)?.[1]) || 0)
    : value
}
const statusLegend = computed(() => {
  const counts = countBy(props.rows, "status")
  return statuses.map((status) => {
    const value = counts[status.label] ?? 0
    return {
      ...status,
      value,
      percent: props.rows.length ? `${((value / props.rows.length) * 100).toFixed(1)}%` : "0%",
    }
  })
})
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 350 },
  plugins: {
    legend: { display: false },
    tooltip: {
      displayColors: false,
      titleFont: { size: 15 },
      bodyFont: { size: 14 },
      callbacks: { label: ({ raw }) => `(${raw}) vehiculos` },
    },
  },
}
const axisOptions = (horizontal = false) => ({
  ...baseOptions,
  indexAxis: horizontal ? "y" : "x",
  scales: {
    x: {
      beginAtZero: true,
      ticks: { precision: 0, color: "#526b94", font: { size: 13 } },
      grid: { color: "#edf1f6" },
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0, color: "#526b94", font: { size: 13 } },
      grid: { display: !horizontal, color: "#edf1f6" },
    },
  },
})
const renderCharts = async () => {
  await nextTick()
  charts.splice(0).forEach((chart) => chart.destroy())
  const statusData = statusLegend.value
  charts.push(
    new Chart(statusCanvas.value, {
      type: "pie",
      data: {
        labels: statusData.map(({ label }) => label),
        datasets: [
          {
            data: statusData.map(({ value }) => value),
            backgroundColor: statusData.map(({ color }) => color),
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      },
      options: baseOptions,
    }),
  )
  const durations = [0, 0, 0]
  props.rows.forEach((row) => {
    const hours = durationHours(row.duration)
    durations[hours >= 48 ? 2 : hours >= 24 ? 1 : 0] += 1
  })
  charts.push(
    new Chart(durationCanvas.value, {
      type: "bar",
      data: {
        labels: ["6 a 23 horas", "24 a 47 horas", "48 horas o mas"],
        datasets: [
          {
            data: durations,
            backgroundColor: ["#075bd8", "#ff7900", "#ff1744"],
            borderRadius: 4,
            barPercentage: 0.66,
          },
        ],
      },
      options: axisOptions(),
    }),
  )
  const companies = countBy(props.rows, "company")
  charts.push(
    new Chart(companyCanvas.value, {
      type: "bar",
      data: {
        labels: Object.keys(companies),
        datasets: [
          {
            data: Object.values(companies),
            backgroundColor: ["#075bd8", "#00a6c8", "#7c3aed", "#ff4f8b"],
            borderRadius: 3,
            barPercentage: 0.65,
          },
        ],
      },
      options: axisOptions(true),
    }),
  )
  const ranking = [...props.rows]
    .sort((a, b) => durationHours(b.duration) - durationHours(a.duration))
    .slice(0, 5)
  charts.push(
    new Chart(rankingCanvas.value, {
      type: "bar",
      data: {
        labels: ranking.map(({ name }) => name),
        datasets: [
          {
            data: ranking.map(({ duration }) => durationHours(duration)),
            backgroundColor: ["#075bd8", "#ff7900", "#ff1744", "#7c3aed", "#00a6c8"],
            borderRadius: 3,
            barPercentage: 0.62,
          },
        ],
      },
      options: {
        ...axisOptions(true),
        plugins: {
          ...baseOptions.plugins,
          tooltip: {
            displayColors: false,
            titleFont: { size: 15 },
            bodyFont: { size: 14 },
            callbacks: {
              label: ({ dataIndex }) => ranking[dataIndex].duration,
            },
          },
        },
      },
    }),
  )
}
onMounted(renderCharts)
watch(() => props.rows, renderCharts, { deep: true })
onBeforeUnmount(() => charts.splice(0).forEach((chart) => chart.destroy()))
</script>

<style scoped>
.charts-grid {
  display: grid;
  min-height: 0;
  flex: 1;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.chart-panel {
  display: flex;
  min-height: 280px;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #dbe3ee;
  border-radius: 0.5rem;
  background: #fff;
  box-shadow: 0 2px 8px rgb(15 35 80 / 5%);
}
.chart-panel header {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #edf1f6;
  padding: 0.75rem 1rem;
}
.chart-panel h2 {
  color: #102372;
  font-size: 1rem;
  font-weight: 900;
}
.chart-panel header span {
  color: #60789f;
  font-size: 0.825rem;
  font-weight: 700;
}
.chart-area {
  position: relative;
  min-height: 220px;
  flex: 1;
  padding: 0.75rem 1rem 1rem;
}
.status-layout {
  display: grid;
  min-height: 220px;
  flex: 1;
  grid-template-columns: minmax(150px, 46%) minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem 1rem;
}
.status-chart {
  position: relative;
  height: 205px;
}
.status-legend {
  display: grid;
  gap: 0.8rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.status-legend li {
  display: grid;
  grid-template-columns: 9px minmax(0, 1fr) 20px 42px;
  align-items: center;
  gap: 0.45rem;
  color: #526b94;
  font-size: 0.875rem;
}
.status-legend strong {
  color: #102372;
  text-align: right;
}
.status-legend li > span:last-child {
  text-align: right;
}
.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}
.legend-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 1100px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
