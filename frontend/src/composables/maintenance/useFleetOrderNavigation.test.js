import test from "node:test"
import assert from "node:assert/strict"
import { ref } from "vue"
import { useFleetOrderNavigation } from "./useFleetOrderNavigation.js"

const setup = () => {
  const calls = []
  const activeTab = ref("overview")
  const orders = ref([{ id: "OT-1", plate: "ABCD12", job: "Frenos" }])
  const position = { top: 480, left: 60 }
  const fleetTable = ref({
    getScrollPosition: () => position,
    restoreScrollPosition: (value) => calls.push(["restore", value]),
  })
  const navigation = useFleetOrderNavigation({
    activeTab,
    orders,
    fleetTable,
    closeModal: () => calls.push(["close"]),
    showOrders: async (id) => {
      activeTab.value = "orders"
      calls.push(["list", id])
    },
    openOrder: (...args) => calls.push(["open", ...args]),
  })
  return { navigation, calls, orders, activeTab, position }
}

test("opens the exact linked OT and returns to cached fleet with its scroll", async () => {
  const { navigation, calls, activeTab, position } = setup()
  await navigation.open("OT-1")
  assert.deepEqual(navigation.context.value, { orderId: "OT-1", vehicle: "ABCD12", plan: "Frenos" })
  assert.deepEqual(calls.at(-1), ["open", "OT-1", "order-detail"])
  await navigation.back()
  assert.equal(activeTab.value, "overview")
  assert.deepEqual(calls.at(-1), ["restore", position])
  assert.equal(navigation.context.value, null)
})

test("missing or out-of-scope orders never open another OT", async () => {
  const { navigation, calls, orders } = setup()
  await navigation.open("missing")
  assert.equal(calls.length, 0)
  await navigation.open("OT-1")
  orders.value = []
  assert.equal(navigation.context.value, null)
  navigation.clear()
  const before = calls.length
  await navigation.back()
  assert.equal(calls.length, before)
})

test("opening from orders does not invent a fleet origin", async () => {
  const { navigation, activeTab } = setup()
  activeTab.value = "orders"
  await navigation.open("OT-1")
  assert.equal(navigation.context.value, null)
})

test("clearing company context while navigation is pending prevents opening stale OT", async () => {
  const { navigation, calls } = setup()
  const pending = navigation.open("OT-1")
  navigation.clear()
  await pending
  assert.ok(!calls.some(([type]) => type === "open"))
})
