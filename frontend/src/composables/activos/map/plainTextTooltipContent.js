export const plainTextTooltipContent = (value) => {
  const content = document.createElement("span")
  content.textContent = String(value ?? "")
  return content
}
