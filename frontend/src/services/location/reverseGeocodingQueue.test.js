import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"

let instance = 0
const flush = async () => {
  for (let index = 0; index < 35; index++) await Promise.resolve()
}
const deferred = () => {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}
const response = (name) => ({ ok: true, json: async () => ({ display_name: name }) })

const setup = async (context, fetcher) => {
  const service = await import(`./reverseGeocodingService.js?queue-test-${++instance}`)
  const original = {
    window: globalThis.window,
    fetch: globalThis.fetch,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    now: Date.now,
  }
  let clock = 100000
  let timerId = 0
  const timers = new Map()
  const storage = new Map()
  Date.now = () => clock
  globalThis.setTimeout = (callback, delay = 0) => {
    const id = ++timerId
    timers.set(id, { callback, at: clock + Math.max(0, Number(delay) || 0) })
    return id
  }
  globalThis.clearTimeout = (id) => timers.delete(id)
  globalThis.window = {
    location: { origin: "http://localhost" },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  }
  globalThis.fetch = fetcher
  context.after(() => {
    Date.now = original.now
    globalThis.setTimeout = original.setTimeout
    globalThis.clearTimeout = original.clearTimeout
    globalThis.fetch = original.fetch
    if (original.window === undefined) delete globalThis.window
    else globalThis.window = original.window
  })
  const advance = async (milliseconds) => {
    await flush()
    const target = clock + milliseconds
    while (true) {
      const due = [...timers.entries()]
        .filter(([, timer]) => timer.at <= target)
        .sort((a, b) => a[1].at - b[1].at)[0]
      if (!due) break
      clock = due[1].at
      timers.delete(due[0])
      due[1].callback()
      await flush()
    }
    clock = target
    await flush()
  }
  return { service, advance, timers }
}
const a = { lat: -33.4, lng: -70.6 }
const b = { lat: -34.4, lng: -71.6 }

test("an ignored network abort times out, releases the queue and cannot overwrite the cache later", async (t) => {
  const blocked = deferred()
  const calls = []
  const { service, advance, timers } = await setup(t, async (_url, options) => {
    calls.push({ signal: options.signal, at: Date.now() })
    return calls.length === 1 ? blocked.promise : response(`Address ${calls.length}`)
  })
  const first = service.reverseGeocodeCoordinates(a)
  const next = service.reverseGeocodeCoordinates(b)
  await advance(0)
  assert.equal(calls.length, 1)
  await advance(service.REVERSE_GEOCODING_REQUEST_TIMEOUT_MS)
  assert.equal(await first, null)
  assert.equal(calls[0].signal.aborted, true)
  assert.equal(await next, "Address 2")
  assert.equal(service.getCachedReverseGeocodeAddress(a), "")
  const retry = service.reverseGeocodeCoordinates(a)
  await advance(1100)
  assert.equal(await retry, "Address 3")
  assert.ok(calls[2].at - calls[1].at >= 1100)
  blocked.resolve(response("Too late"))
  await flush()
  assert.equal(service.getCachedReverseGeocodeAddress(a), "Address 3")
  assert.equal(timers.size, 0)
})

test("a stalled JSON body is bounded by the same deadline as fetch", async (t) => {
  const body = deferred()
  let calls = 0
  const { service, advance, timers } = await setup(t, async () =>
    ++calls === 1 ? { ok: true, json: () => body.promise } : response("Next"),
  )
  const first = service.reverseGeocodeCoordinates(a)
  const next = service.reverseGeocodeCoordinates(b)
  await advance(service.REVERSE_GEOCODING_REQUEST_TIMEOUT_MS)
  assert.equal(await first, null)
  assert.equal(await next, "Next")
  body.resolve({ display_name: "Late body" })
  await flush()
  assert.equal(service.getCachedReverseGeocodeAddress(a), "")
  assert.equal(timers.size, 0)
})

test("cancelling one shared subscriber does not cancel another subscriber's request", async (t) => {
  const blocked = deferred()
  let signal
  let calls = 0
  const { service, advance, timers } = await setup(t, (_url, options) => {
    calls++
    signal = options.signal
    return blocked.promise
  })
  const cancel = new AbortController()
  const first = service.reverseGeocodeCoordinates(a, { signal: cancel.signal })
  const shared = service.reverseGeocodeCoordinates(a)
  await advance(0)
  cancel.abort()
  assert.equal(await first, null)
  assert.equal(signal.aborted, false)
  blocked.resolve(response("Shared address"))
  await flush()
  assert.equal(await shared, "Shared address")
  assert.equal(calls, 1)
  assert.equal(timers.size, 0)
})

test("cancelling the last subscriber aborts transport and skipped queued jobs never fetch", async (t) => {
  const calls = []
  const { service, advance, timers } = await setup(t, (_url, options) => {
    calls.push(options.signal)
    return calls.length === 1 ? new Promise(() => {}) : Promise.resolve(response("Following"))
  })
  const active = new AbortController()
  const queued = new AbortController()
  const first = service.reverseGeocodeCoordinates(a, { signal: active.signal })
  const skipped = service.reverseGeocodeCoordinates(b, { signal: queued.signal })
  const following = service.reverseGeocodeCoordinates({ lat: -35.4, lng: -72.6 })
  await advance(0)
  queued.abort()
  active.abort()
  assert.equal(await first, null)
  assert.equal(await skipped, null)
  assert.equal(calls[0].aborted, true)
  await advance(1100)
  assert.equal(await following, "Following")
  assert.equal(calls.length, 2)
  assert.equal(timers.size, 0)
})

test("batch deadline returns every row with fallback coordinates without waiting for each timeout", async (t) => {
  let signal
  let calls = 0
  const { service, advance, timers } = await setup(t, (_url, options) => {
    signal = options.signal
    calls++
    return new Promise(() => {})
  })
  const rows = [
    { id: "real", address: "Known street", ...a },
    { id: "a", ...a },
    { id: "b", ...b },
  ]
  const original = structuredClone(rows)
  const result = service.resolveReverseGeocodedSources(rows, { timeoutMs: 2500 })
  await advance(2500)
  const resolved = await result
  assert.equal(resolved.length, rows.length)
  assert.equal(resolved[0].address, "Known street")
  assert.match(resolved[1].address, /^Coordenadas /)
  assert.match(resolved[2].address, /^Coordenadas /)
  assert.deepEqual(rows, original)
  assert.equal(calls, 1)
  assert.equal(signal.aborted, true)
  assert.equal(timers.size, 0)
})

test("pre-cancelled calls do not fetch and failed requests can be retried with rate limiting", async (t) => {
  let calls = 0
  const { service, advance, timers } = await setup(t, async () => {
    if (++calls === 1) throw Error("offline")
    return response("Recovered")
  })
  const controller = new AbortController()
  controller.abort()
  assert.equal(await service.reverseGeocodeCoordinates(a, { signal: controller.signal }), null)
  const cancelled = await service.resolveReverseGeocodedSources([{ ...a }], {
    signal: controller.signal,
  })
  assert.match(cancelled[0].address, /^Coordenadas /)
  assert.equal(calls, 0)
  const failed = service.reverseGeocodeCoordinates(a)
  await advance(0)
  assert.equal(await failed, null)
  const retry = service.reverseGeocodeCoordinates(a)
  await advance(1099)
  assert.equal(calls, 1)
  await advance(1)
  assert.equal(await retry, "Recovered")
  assert.equal(timers.size, 0)
})

test("visible row consumers cancel their subscriptions when unmounted or disabled", () => {
  const source = readFileSync(
    new URL("../../composables/location/useReverseGeocodedRows.js", import.meta.url),
    "utf8",
  )
  assert.match(source, /reverseGeocodeCoordinates\(coordinates, \{ signal: controller.signal \}\)/)
  assert.match(
    source,
    /onBeforeUnmount\([\s\S]*?activeControllers.forEach\(\(controller\) => controller.abort\(\)\)/,
  )
  assert.match(
    source,
    /watch\(isEnabled,[\s\S]*?activeControllers.forEach\(\(controller\) => controller.abort\(\)\)/,
  )
})
