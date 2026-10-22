import { addUnreportedContinuousReportSheet } from "./unreportedContinuousReportSheet.js"

export const addUnreportedReportSheet = (workbook, rows, options = {}, brand = "") =>
  addUnreportedContinuousReportSheet(workbook, rows, options, brand)
