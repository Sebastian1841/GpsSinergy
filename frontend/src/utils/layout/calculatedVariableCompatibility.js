import { calculatedProfileValue } from "./calculatedVariableInputs.js"
import { calculatedSignalValue } from "./calculatedVariableSignals.js"

export function calculatedVariableCompatibility(asset, signalKeys = [], profileKeys = []) {
  const available = signalKeys.filter(key => calculatedSignalValue(asset, key) != null).length
  const profileAvailable = profileKeys.filter(key => {
    const value = calculatedProfileValue(asset, key)
    return value != null && (typeof value !== "string" || value.trim() !== "")
  }).length
  return { available, profileAvailable, compatible: available === signalKeys.length && profileAvailable === profileKeys.length }
}
