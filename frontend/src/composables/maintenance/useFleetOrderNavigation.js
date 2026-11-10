import { computed, nextTick, ref } from "vue"

export const useFleetOrderNavigation = ({
  activeTab,
  orders,
  fleetTable,
  closeModal,
  openOrder,
  showOrders,
}) => {
  const origin = ref(null)
  let revision = 0
  const context = computed(() => {
    if (!origin.value) return null
    const order = orders.value.find((item) => String(item.id) === String(origin.value.orderId))
    return order ? { orderId: order.id, vehicle: order.plate, plan: order.job } : null
  })
  const clear = () => {
    revision++
    origin.value = null
  }
  const open = async (orderId) => {
    if (!orders.value.some((order) => String(order.id) === String(orderId))) return
    if (activeTab.value === "overview") {
      origin.value = { orderId, scroll: fleetTable.value?.getScrollPosition() }
    } else {
      clear()
    }
    const request = ++revision
    closeModal()
    await showOrders(orderId)
    if (request !== revision || !orders.value.some((order) => String(order.id) === String(orderId)))
      return
    openOrder(orderId, "order-detail")
  }
  const back = async () => {
    if (!origin.value) return
    const scroll = origin.value.scroll
    closeModal()
    activeTab.value = "overview"
    await nextTick()
    fleetTable.value?.restoreScrollPosition(scroll)
    clear()
  }
  return { context, open, back, clear }
}
