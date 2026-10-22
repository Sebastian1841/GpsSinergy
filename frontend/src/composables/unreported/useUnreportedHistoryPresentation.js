import { computed, reactive, toValue } from "vue"
import {
  interruptionDiagnosis,
  interruptionDurationLabel,
  consultationsForInterruption,
} from "../../utils/unreported/unreportedHistory.js"
import {
  consultationSituations,
  consultationDecisions,
} from "../../utils/unreported/unreportedFlow.js"

const dates = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Santiago",
})
const voltages = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 })
const formatDate = (value) => dates.format(new Date(value))
const label = (options, value) =>
  options.find((option) => option.value === value)?.label || "Sin registro"

export const useUnreportedHistoryPresentation = (visibleRows, equipment) =>
  computed(() =>
    toValue(visibleRows).map((episode) => {
      const diagnosis = interruptionDiagnosis(episode)
      const readings =
        diagnosis.reason === "Alimentacion desconectada"
          ? [
              ["Externa:", episode.telemetry?.externalVoltage],
              ["Interna:", episode.telemetry?.internalVoltage],
            ]
              .filter(
                ([, value]) => typeof value === "number" && Number.isFinite(value) && value >= 0,
              )
              .map(([label, value]) => ({ label, value: `${voltages.format(value)} V` }))
          : []
      // Computed calls stay unevaluated until the expanded body requests them.
      const calls = computed(() =>
        consultationsForInterruption(toValue(equipment), episode).map((call) => ({
          ...call,
          dateLabel: formatDate(call.createdAt),
          situationLabel: label(consultationSituations, call.situation),
          decisionLabel: label(consultationDecisions, call.decision),
        })),
      )
      return reactive({
        id: episode.id,
        open: false,
        startLabel:
          episode.kind === "first_report" ? "Sin reporte previo" : formatDate(episode.lastReportAt),
        recoveryLabel: formatDate(episode.recoveredAt),
        durationLabel: interruptionDurationLabel(episode, episode.recoveredAt),
        diagnosis,
        readings,
        calls,
      })
    }),
  )
