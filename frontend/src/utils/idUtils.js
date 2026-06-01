export const normalizeId = (value) => {
  return String(value ?? "")
}

export const isSameId = (left, right) => {
  return normalizeId(left) === normalizeId(right)
}
