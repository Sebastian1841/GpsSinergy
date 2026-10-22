import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse } from "@vue/compiler-sfc"
import { consultationDecisionForSituation } from "../../utils/unreported/unreportedFlow.js"

test("modal header displays the supplied Activos image with contained sizing and error fallback", () => {
  const { descriptor } = parse(
    readFileSync(new URL("./UnreportedOperationModal.vue", import.meta.url), "utf8"),
  )
  assert.match(descriptor.template.content, /:src="vehicleImage"/)
  assert.match(descriptor.template.content, /:alt="equipment.name"/)
  assert.match(descriptor.template.content, /@error="failedVehicleImage = vehicleImage"/)
  assert.match(
    descriptor.styles[0].content,
    /\.equipment-symbol img\s*\{[^}]*object-fit: contain;/s,
  )
})

test("registered consultations expose edit and confirmed delete actions", () => {
  const { descriptor } = parse(
    readFileSync(new URL("./UnreportedOperationModal.vue", import.meta.url), "utf8"),
  )
  assert.match(descriptor.template.content, /@click="editCall\(call\)"/)
  assert.match(descriptor.template.content, /deleteCandidate === call.id/)
  assert.match(descriptor.template.content, /emit\('delete-consultation', call.id\)/)
  assert.match(descriptor.template.content, /Guardar cambios/)
  assert.match(descriptor.template.content, /call.updatedAt/)
  assert.match(descriptor.template.content, /Historial de consultas/)
  assert.match(descriptor.template.content, /class="consultation-information"/)
  assert.match(descriptor.template.content, /Registro la consulta/)
})

test("consultation editor is separate from vehicle details and saved consultations", () => {
  const { descriptor } = parse(
    readFileSync(new URL("./UnreportedOperationModal.vue", import.meta.url), "utf8"),
  )
  const template = descriptor.template.content
  assert.match(template, /Detalles del vehiculo/)
  assert.match(template, /Consultas registradas/)
  assert.match(template, /v-if="!consultationOpen" class="review-tabs"/)
  assert.match(template, /activeTab === 'general' && !consultationOpen/)
  assert.match(template, /activeTab === 'consultations' \|\| consultationOpen/)
  const start = descriptor.scriptSetup.content.match(
    /const startConsultation = \(\) => \{([\s\S]*?)\n\}/,
  )[1]
  assert.doesNotMatch(start, /activeTab.value =/)
  assert.match(start, /consultationOpen.value = true/)
})

test("non-use and unanswered consultations default to pending, without keeping a prior decision", async () => {
  const { ref, watch, nextTick } = await import("vue")
  const { descriptor } = parse(
    readFileSync(new URL("./UnreportedOperationModal.vue", import.meta.url), "utf8"),
  )
  const source = descriptor.scriptSetup.content
  const watcher = source.slice(
    source.indexOf("watch(\n  () => consultation.value.situation"),
    source.indexOf("const caseCalls"),
  )
  assert.ok(watcher.startsWith("watch("))
  assert.match(
    descriptor.template.content,
    /:disabled="!!consultationDecisionForSituation\(consultation.situation\)"/,
  )
  assert.equal(
    (descriptor.template.content.match(/v-if="consultation.situation !== 'not_contacted'"/g) || [])
      .length,
    2,
  )
  const consultation = ref({ situation: "", decision: "field_review" })
  const stop = new Function(
    "watch",
    "consultation",
    "consultationDecisionForSituation",
    `return ${watcher}`,
  )(watch, consultation, consultationDecisionForSituation)
  try {
    for (const situation of ["not_in_use", "not_contacted"]) {
      consultation.value.contactedPerson = "Persona de prueba"
      consultation.value.contactedRole = "Encargado"
      consultation.value.decision = "field_review"
      consultation.value.situation = situation
      await nextTick()
      assert.equal(consultation.value.decision, "pending")
      if (situation === "not_contacted") {
        assert.equal(consultation.value.contactedPerson, "")
        assert.equal(consultation.value.contactedRole, "")
      }
    }
    consultation.value.situation = "workshop"
    await nextTick()
    assert.equal(consultation.value.decision, "pending")
    consultation.value.workshopDays = 10
    consultation.value.situation = "working"
    await nextTick()
    assert.equal(consultation.value.decision, "field_review")
    assert.equal(consultation.value.workshopDays, "")
  } finally {
    stop()
  }
})

test("review modal follows reference panels with bounded dimensions and responsive consultation columns", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./UnreportedOperationModal.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  const css = descriptor.styles.map((style) => style.content).join("\n")
  assert.match(css, /select:disabled\s*\{[^}]*background-color: #edf0f4;[^}]*cursor: not-allowed;/s)
  assert.match(css, /width: min\(1020px, calc\(100vw - 48px\)\)/)
  assert.match(css, /height: min\(760px, calc\(100dvh - 40px\)\)/)
  assert.match(css, /form\s*\{[^}]*min-height: 0;[^}]*overflow: hidden/s)
  assert.match(
    css,
    /\.consultation-list\.is-editing\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/s,
  )
  assert.match(css, /@media \(max-width: 980px\)/)
  assert.match(css, /@media \(max-width: 540px\)/)
  assert.match(css, /\.consultation-list\s*\{[^}]*overflow-y: auto/s)
  assert.match(descriptor.template.content, /class="observation-field"/)
  assert.match(descriptor.template.content, /'is-editing': consultationOpen/)
  assert.match(descriptor.template.content, /Informacion de la consulta/)
  assert.match(descriptor.template.content, /class="consultation-left-column"/)
  assert.doesNotMatch(
    descriptor.template.content,
    /Registrar visita realizada|class="visit-column"|v-model="consultation.visit/,
  )
  assert.match(descriptor.template.content, /consultation.observation.length \}\}\/500/)
  assert.match(descriptor.template.content, /getAssetTypeLabel\(equipment.assetType\)/)
  assert.doesNotMatch(descriptor.template.content, />Operativo</)
  assert.doesNotMatch(css, /backdrop-filter/)
  assert.doesNotMatch(css, /min-height: 100%/)
  assert.doesNotMatch(descriptor.scriptSetup.content, /callTomorrow|nextCallDate: ""/)
  assert.doesNotMatch(
    descriptor.template.content,
    /v-model="consultation.nextCallDate"|Llamar manana/,
  )
})
