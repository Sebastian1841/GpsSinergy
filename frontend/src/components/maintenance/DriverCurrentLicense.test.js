import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'

test('new current license compiles with expiration, documents and permitted actions', () => {
  const source = readFileSync(new URL('./DriverCurrentLicense.vue', import.meta.url), 'utf8')
  const { descriptor, errors } = parse(source)
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: 'current-license' })
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename: 'DriverCurrentLicense.vue', id: 'current-license', compilerOptions: { bindingMetadata: script.bindings } }).errors, [])
  for (const label of ['Fecha de vencimiento', 'Anticipacion del aviso', 'Seguimiento de renovacion', 'Foto pendiente', 'Historial']) assert.ok(source.includes(label))
  assert.match(source, /v-if="canEdit && state.key !== 'unknown'"/)
  for (const event of ['manage', 'photo', 'history', 'edit', 'renew']) assert.ok(source.includes(`$emit('${event}'`))
  assert.doesNotMatch(source, /<dialog|driver-profile-|<form/)
})
