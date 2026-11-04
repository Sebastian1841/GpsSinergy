export const createVariableTestState = () => ({ signals: Object.create(null), profile: Object.create(null), profileAssetId: "" })

export function reconcileVariableTestState(state, inputs) {
  const retain = (values, keys) => {
    const next = Object.create(null)
    for (const key of keys) if (Object.hasOwn(values, key)) next[key] = values[key]
    return next
  }
  return { signals: retain(state.signals, inputs.signals), profile: retain(state.profile, inputs.profile), profileAssetId: state.profileAssetId }
}
