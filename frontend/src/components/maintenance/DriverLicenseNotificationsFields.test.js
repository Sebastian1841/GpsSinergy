import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'

test('license notification settings compile and expose email/WhatsApp as configuration only', () => {
  const source = readFileSync(new URL('./DriverLicenseNotificationsFields.vue', import.meta.url), 'utf8')
  const { descriptor, errors } = parse(source)
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: 'license-notifications' })
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename: 'DriverLicenseNotificationsFields.vue', id: 'license-notifications', compilerOptions: { bindingMetadata: script.bindings } }).errors, [])
  for (const label of ['Notificaciones', 'Email', 'WhatsApp', 'Integracion pendiente']) assert.ok(source.includes(label))
  assert.match(source, /type="email"/)
  assert.match(source, /type="tel"/)
  assert.match(source, /<section class="license-notification-fields"/)
  assert.match(source, /<fieldset disabled class="notification-channels"/)
  assert.match(source, /emit\('update:modelValue'/)
  assert.doesNotMatch(source, /fetch\(|axios|webhook|n8n/)
})
