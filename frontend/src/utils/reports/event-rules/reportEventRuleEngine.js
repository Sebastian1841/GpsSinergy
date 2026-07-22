const normalizeText = (value) => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const normalizeEventRuleIds = (template = {}) => {
  const sourceIds = Array.isArray(template.eventRuleIds)
    ? template.eventRuleIds
    : template.eventRuleId
      ? [template.eventRuleId]
      : []

  const cleanIds = Array.from(new Set(sourceIds.map(String).filter(Boolean)))

  return cleanIds.filter((eventRuleId) => eventRuleId !== "all")
}

const firstValue = (...values) => {
  return values.find((value) => value !== undefined && value !== null && value !== "")
}

const normalizeId = (value) => {
  return String(value ?? "").trim()
}

const getSourceGroupId = ({ report = {}, asset = {} }) => {
  return normalizeId(
    firstValue(
      asset.sucursalId,
      asset.groupId,
      asset.tagId,
      asset.branchId,
      report.sucursalId,
      report.groupId,
      report.tagId,
      report.branchId,
    ),
  )
}

const doesRuleApplyToGroup = ({ report, asset, rule }) => {
  const groupIds = Array.isArray(rule?.groupIds)
    ? rule.groupIds.map(normalizeId).filter(Boolean)
    : []

  if (!groupIds.length) return true

  const sourceGroupId = getSourceGroupId({ report, asset })

  if (!sourceGroupId) return false

  return groupIds.includes(sourceGroupId)
}

const getTimestampValue = ({ report = {}, asset = {} }) => {
  return firstValue(
    report.timestamp,
    report.lastReport,
    report.reportedAt,
    report.lastReportAt,
    report.updatedAt,
    report.datosUlt,
    asset.timestamp,
    asset.lastReport,
    asset.reportedAt,
    asset.lastReportAt,
    asset.updatedAt,
    asset.datosUlt,
  )
}

const parseScheduleDate = (value) => {
  if (!value) return null

  const textValue = String(value)
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(textValue)
    ? new Date(`${textValue}T00:00:00`)
    : new Date(value)

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

const normalizeWeekdays = (weekdays = []) => {
  return Array.isArray(weekdays)
    ? Array.from(
        new Set(
          weekdays
            .map((weekday) => Number(weekday))
            .filter((weekday) => Number.isInteger(weekday) && weekday >= 0 && weekday <= 6),
        ),
      )
    : []
}

const parseScheduleTime = (value) => {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/)

  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null

  return hours * 60 + minutes
}

const doesRuleApplyToWeeklySchedule = ({ eventDate, schedule, weekdays }) => {
  const eventWeekday = eventDate.getDay()
  const previousWeekday = eventWeekday === 0 ? 6 : eventWeekday - 1
  const eventMinutes = eventDate.getHours() * 60 + eventDate.getMinutes()
  const timeFrom = parseScheduleTime(schedule.timeFrom)
  const timeTo = parseScheduleTime(schedule.timeTo)
  const hasWeekdays = weekdays.length > 0
  const isWeekdaySelected = (weekday) => !hasWeekdays || weekdays.includes(weekday)

  if (timeFrom === null && timeTo === null) {
    return isWeekdaySelected(eventWeekday)
  }

  if (timeFrom !== null && timeTo !== null && timeFrom > timeTo) {
    return (
      (eventMinutes >= timeFrom && isWeekdaySelected(eventWeekday)) ||
      (eventMinutes <= timeTo && isWeekdaySelected(previousWeekday))
    )
  }

  if (!isWeekdaySelected(eventWeekday)) return false
  if (timeFrom !== null && eventMinutes < timeFrom) return false
  if (timeTo !== null && eventMinutes > timeTo) return false

  return true
}

const doesRuleApplyToSchedule = ({ report, asset, rule }) => {
  const schedule = rule?.schedule || {}

  if (schedule.mode !== "calendar") return true

  const timestampValue = getTimestampValue({ report, asset })
  const eventDate = parseScheduleDate(timestampValue) || new Date()
  const weekdays = normalizeWeekdays(schedule.weekdays)

  return doesRuleApplyToWeeklySchedule({
    eventDate,
    schedule,
    weekdays,
  })
}

const toNumber = (value) => {
  if (typeof value === "number") return value

  const parsedValue = Number(
    String(value ?? "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, ""),
  )

  return Number.isFinite(parsedValue) ? parsedValue : null
}

const getRuleSpeedThreshold = (rule = {}, { includeDefault = true } = {}) => {
  const speedCondition = (rule?.conditions || []).find((condition) => {
    return (
      String(condition?.field || "") === "speed" &&
      ["greaterThan", "greaterThanOrEqual"].includes(String(condition?.operator || ""))
    )
  })

  const threshold = toNumber(speedCondition?.value)

  if (threshold === null) return null
  if (!includeDefault && threshold === 80) return null

  return threshold
}

const getEffectiveSpeedLimitValue = ({ report = {}, asset = {}, rule = null }) => {
  return firstValue(
    asset.speedLimit,
    asset.limiteVelocidad,
    asset.velocidadLimite,
    getRuleSpeedThreshold(rule, { includeDefault: false }),
    report.speedLimit,
    report.limiteVelocidad,
    report.velocidadLimite,
    getRuleSpeedThreshold(rule),
  )
}

const toBooleanValue = (value) => {
  const normalizedValue = normalizeText(value)

  if (
    [
      "true",
      "1",
      "on",
      "si",
      "yes",
      "active",
      "activo",
      "activa",
      "encendido",
      "encendida",
    ].includes(normalizedValue)
  ) {
    return true
  }

  if (
    ["false", "0", "off", "no", "inactive", "inactivo", "inactiva", "apagado", "apagada"].includes(
      normalizedValue,
    )
  ) {
    return false
  }

  return null
}

const hasMeaningfulValue = (value) => {
  const normalizedValue = normalizeText(value)

  return Boolean(
    normalizedValue &&
    !["-", "n/a", "na", "null", "undefined", "sin datos", "sin dato"].includes(normalizedValue),
  )
}

const hasTelemetryValue = ({ field, report, asset }) => {
  return hasMeaningfulValue(
    getEventFieldValue({
      field,
      report,
      asset,
    }),
  )
}

const getEventFieldValue = ({ field, report = {}, asset = {}, rule = null }) => {
  const speedValue = firstValue(
    report.speed,
    report.velocidad,
    report.velocidad_kmh,
    report.speedLabel,
    asset.speed,
    asset.velocidad,
    asset.velocidad_kmh,
  )
  const speedLimitValue = getEffectiveSpeedLimitValue({ report, asset, rule })
  const speedNumber = toNumber(speedValue)
  const speedLimitNumber = toNumber(speedLimitValue)
  const calculatedSpeedingDelta =
    speedNumber !== null && speedLimitNumber !== null ? speedNumber - speedLimitNumber : null
  const canValue = firstValue(
    report.can,
    report.rpm,
    report.engineRpm,
    report.engineTemp,
    report.temperaturaMotor,
    asset.can,
    asset.rpm,
    asset.engineRpm,
    asset.engineTemp,
    asset.temperaturaMotor,
  )

  const values = {
    speed: speedValue,
    speedLimit: speedLimitValue,
    speedingDelta: firstValue(
      report.speedingDelta,
      report.speedOverLimit,
      report.excesoVelocidad,
      asset.speedingDelta,
      asset.speedOverLimit,
      asset.excesoVelocidad,
      calculatedSpeedingDelta,
    ),
    speeding: firstValue(
      report.speeding,
      report.isSpeeding,
      report.enExcesoVelocidad,
      asset.speeding,
      asset.isSpeeding,
      asset.enExcesoVelocidad,
      calculatedSpeedingDelta !== null ? calculatedSpeedingDelta > 0 : null,
    ),
    state: firstValue(report.estado, report.status, asset.estado, asset.status),
    event: firstValue(report.event, report.evento, asset.evento),
    alert: firstValue(
      report.alerta,
      report.alert,
      report.choque,
      asset.alerta,
      asset.alert,
      asset.choque,
    ),
    geofence: firstValue(report.geocerca, report.geofence, asset.geocerca, asset.geofence),
    fuel: firstValue(
      report.combustible,
      report.fuel,
      report.fuelLevel,
      report.fuelPercent,
      report.combustibleNivel,
      asset.combustible,
      asset.fuel,
      asset.fuelLevel,
      asset.fuelPercent,
      asset.combustibleNivel,
    ),
    can: firstValue(
      canValue,
      report.canStatus,
      report.canSummary,
      report.canRpm,
      report.canEngineTemp,
      report.canBatteryVoltage,
      report.canDtcCount,
      asset.canStatus,
      asset.canSummary,
      asset.canRpm,
      asset.canEngineTemp,
      asset.canBatteryVoltage,
      asset.canDtcCount,
    ),
    satellites: firstValue(
      report.satellites,
      report.satelites,
      report.gpsSatellites,
      asset.satellites,
      asset.satelites,
      asset.gpsSatellites,
    ),
    gpsSignal: firstValue(
      report.gpsSignal,
      report.gpsSignalLabel,
      asset.gpsSignal,
      asset.gpsSignalLabel,
    ),
    ignition: firstValue(
      report.ignition,
      report.ignicion,
      report.contacto,
      asset.ignition,
      asset.ignicion,
      asset.contacto,
    ),
    engineHours: firstValue(
      report.horometroTotal,
      report.horometro,
      report.engineHours,
      asset.horometroTotal,
      asset.horometro,
      asset.engineHours,
    ),
    duration: firstValue(report.duracion, report.duration, asset.duracion, asset.duration),
    odometer: firstValue(
      report.odometer,
      report.odometro,
      asset.odometer,
      asset.odometro,
      asset.odometroTotal,
    ),
    canRpm: firstValue(report.canRpm, report.rpm, asset.canRpm, asset.rpm),
    canEngineTemp: firstValue(
      report.canEngineTemp,
      report.engineTemp,
      report.temperaturaMotor,
      asset.canEngineTemp,
      asset.engineTemp,
      asset.temperaturaMotor,
    ),
    canBatteryVoltage: firstValue(
      report.canBatteryVoltage,
      report.batteryVoltage,
      asset.canBatteryVoltage,
      asset.batteryVoltage,
    ),
    canEngineLoad: firstValue(
      report.canEngineLoad,
      report.engineLoad,
      asset.canEngineLoad,
      asset.engineLoad,
    ),
    canThrottle: firstValue(report.canThrottle, report.throttle, asset.canThrottle, asset.throttle),
    canFuelRate: firstValue(report.canFuelRate, report.fuelRate, asset.canFuelRate, asset.fuelRate),
    canFuelUsed: firstValue(report.canFuelUsed, report.fuelUsed, asset.canFuelUsed, asset.fuelUsed),
    canOilPressure: firstValue(
      report.canOilPressure,
      report.oilPressure,
      asset.canOilPressure,
      asset.oilPressure,
    ),
    canAdBlueLevel: firstValue(
      report.canAdBlueLevel,
      report.adBlueLevel,
      asset.canAdBlueLevel,
      asset.adBlueLevel,
    ),
    canDtcCount: firstValue(report.canDtcCount, report.dtcCount, asset.canDtcCount, asset.dtcCount),
    gpsFix: firstValue(report.gpsFix, report.fix, asset.gpsFix, asset.fix),
    digitalInput1: firstValue(
      report.digitalInput1,
      report.input1,
      asset.digitalInput1,
      asset.input1,
    ),
    digitalInput2: firstValue(
      report.digitalInput2,
      report.input2,
      asset.digitalInput2,
      asset.input2,
    ),
    driver: firstValue(report.driver, report.conductor, asset.driver, asset.conductor),
    driverGroup: firstValue(
      report.driverGroup,
      report.driverGroupId,
      report.grupoConductor,
      asset.driverGroup,
      asset.driverGroupId,
      asset.grupoConductor,
    ),
    poi: firstValue(
      report.poi,
      report.pointOfInterest,
      report.puntoInteres,
      asset.poi,
      asset.pointOfInterest,
      asset.puntoInteres,
    ),
    rendezvous: firstValue(
      report.rendezvous,
      report.isRendezvous,
      report.enRendezvous,
      asset.rendezvous,
      asset.isRendezvous,
      asset.enRendezvous,
    ),
    rendezvousDistance: firstValue(
      report.rendezvousDistance,
      report.nearbyAssetDistance,
      report.distanciaRendezvous,
      asset.rendezvousDistance,
      asset.nearbyAssetDistance,
      asset.distanciaRendezvous,
    ),
    script: firstValue(
      report.script,
      report.scriptResult,
      report.scriptStatus,
      asset.script,
      asset.scriptResult,
      asset.scriptStatus,
    ),
    http: firstValue(
      report.http,
      report.httpResult,
      report.httpStatus,
      asset.http,
      asset.httpResult,
      asset.httpStatus,
    ),
  }

  return values[field]
}

const isOperationalRule = (ruleId) => {
  return ["movement", "stops", "idle"].includes(String(ruleId || ""))
}

const IDLE_SPEED_THRESHOLD_KMH = 3

const getOperationalSpeed = ({ report = {}, asset = {} }) => {
  return toNumber(
    firstValue(
      report.speed,
      report.velocidad,
      report.velocidad_kmh,
      report.speedLabel,
      asset.speed,
      asset.velocidad,
      asset.velocidad_kmh,
    ),
  )
}

const getOperationalIgnition = ({ report = {}, asset = {} }) => {
  return toBooleanValue(
    firstValue(
      report.ignition,
      report.ignicion,
      report.contacto,
      asset.ignition,
      asset.ignicion,
      asset.contacto,
    ),
  )
}

const getOperationalRpm = ({ report = {}, asset = {} }) => {
  return toNumber(firstValue(report.canRpm, report.rpm, asset.canRpm, asset.rpm))
}

const hasExplicitIdleText = ({ report = {}, asset = {} }) => {
  const stateText = normalizeText(
    firstValue(report.estado, report.status, asset.estado, asset.status),
  )
  const eventText = normalizeText(
    firstValue(report.event, report.evento, asset.event, asset.evento),
  )

  return (
    stateText.includes("idle") ||
    stateText.includes("ralent") ||
    eventText.includes("idle") ||
    eventText.includes("ralent")
  )
}

const hasIdleSignal = ({ report = {}, asset = {} }) => {
  const speed = getOperationalSpeed({ report, asset })
  const ignition = getOperationalIgnition({ report, asset })
  const rpm = getOperationalRpm({ report, asset })
  const explicitIdle = hasExplicitIdleText({ report, asset })
  const hasStoppedSpeed = speed !== null && speed <= IDLE_SPEED_THRESHOLD_KMH
  const hasEngineSignal = ignition === true || (rpm !== null && rpm > 0)

  if (!hasStoppedSpeed) return false
  if (ignition === false) return false

  return hasEngineSignal || explicitIdle
}

const doesReportMatchOperationalRule = ({ report, asset, rule }) => {
  if (!isOperationalRule(rule?.id)) return true
  if (Array.isArray(rule.conditions) && rule.conditions.length && !hasDefaultRuleConditions(rule)) {
    return true
  }

  const speed = getOperationalSpeed({ report, asset })
  const isIdle = hasIdleSignal({ report, asset })

  if (rule.id === "movement") {
    return speed !== null && speed > IDLE_SPEED_THRESHOLD_KMH
  }

  if (rule.id === "idle") {
    return isIdle
  }

  if (rule.id === "stops") {
    return speed !== null && speed <= IDLE_SPEED_THRESHOLD_KMH && !isIdle
  }

  return true
}

const hasSpeedingSignal = ({ report = {}, asset = {}, rule = null }) => {
  const speed = getOperationalSpeed({ report, asset })
  const speeding = toBooleanValue(
    firstValue(
      report.speeding,
      report.isSpeeding,
      report.enExcesoVelocidad,
      asset.speeding,
      asset.isSpeeding,
      asset.enExcesoVelocidad,
    ),
  )
  const speedLimit = toNumber(getEffectiveSpeedLimitValue({ report, asset, rule }))

  if (speed === null) return false
  if (speedLimit !== null) return speed > speedLimit
  if (speeding === true) return true

  return speed > 80
}

const hasSpeedingText = (value) => {
  const text = normalizeText(value)

  return text.includes("exceso") && text.includes("velocidad")
}

const isSpeedingEventRule = (rule = {}) => {
  if (String(rule?.id || "") === "speeding") return true
  if (hasSpeedingText([rule.label, rule.description].filter(Boolean).join(" "))) return true

  return (rule.conditions || []).some((condition) => {
    return (
      condition?.expressionType === "speeding" ||
      ["speeding", "speedingDelta"].includes(String(condition?.field || ""))
    )
  })
}

const hasGpsSignalIssue = ({ report = {}, asset = {} }) => {
  const stateText = normalizeText(
    firstValue(report.estado, report.status, asset.estado, asset.status),
  )
  const eventText = normalizeText(
    firstValue(report.event, report.evento, report.alerta, report.alert, asset.evento),
  )
  const gpsFix = toBooleanValue(firstValue(report.gpsFix, report.fix, asset.gpsFix, asset.fix))
  const satellites = toNumber(
    firstValue(
      report.satellites,
      report.satelites,
      report.gpsSatellites,
      asset.satellites,
      asset.satelites,
      asset.gpsSatellites,
    ),
  )
  const gpsSignal = toNumber(
    firstValue(report.gpsSignal, report.gpsSignalLabel, asset.gpsSignal, asset.gpsSignalLabel),
  )
  const issueTexts = ["offline", "sin senal", "senal baja", "baja senal", "perdida", "no fix"]

  if (stateText.includes("offline") || stateText.includes("sin senal")) return true
  if (issueTexts.some((issueText) => eventText.includes(issueText))) return true
  if (gpsFix === false) return true
  if (satellites !== null && satellites <= 3) return true
  if (gpsSignal !== null && gpsSignal <= 35) return true

  return false
}

const hasAlertSignal = ({ report = {}, asset = {} }) => {
  const alertValue = firstValue(
    report.alerta,
    report.alert,
    report.choque,
    asset.alerta,
    asset.alert,
    asset.choque,
  )
  const alertText = normalizeText(alertValue)

  if (!alertText) return false
  if (["-", "sin alerta", "no alerta", "ninguna", "none", "n/a"].includes(alertText)) {
    return false
  }
  if (hasSpeedingText(alertValue)) return hasSpeedingSignal({ report, asset })

  return !alertText.includes("sin alerta")
}

const hasGeofenceSignal = ({ report = {}, asset = {} }) => {
  const geofenceText = normalizeText(
    firstValue(report.geocerca, report.geofence, asset.geocerca, asset.geofence),
  )
  const eventText = normalizeText(firstValue(report.event, report.evento, asset.evento))

  return (
    hasMeaningfulValue(geofenceText) ||
    eventText.includes("geocerca") ||
    eventText.includes("entrada") ||
    eventText.includes("salida") ||
    eventText.includes("permanencia")
  )
}

const doesReportHaveDefaultRuleSignal = ({ report, asset, rule }) => {
  switch (String(rule?.id || "")) {
    case "movement":
    case "stops":
    case "idle":
      return doesReportMatchOperationalRule({ report, asset, rule })
    case "speeding":
      return hasSpeedingSignal({ report, asset, rule })
    case "geofence":
      return hasGeofenceSignal({ report, asset })
    case "alerts":
      return hasAlertSignal({ report, asset })
    case "gpsSignal": {
      const hasBaseGpsRule =
        hasDefaultRuleConditions(rule) ||
        !Array.isArray(rule?.conditions) ||
        !rule.conditions.length

      return hasBaseGpsRule ? hasGpsSignalIssue({ report, asset }) : true
    }
    case "fuel":
      return hasTelemetryValue({ field: "fuel", report, asset })
    case "can":
      return hasTelemetryValue({ field: "can", report, asset })
    case "engine":
      return hasTelemetryValue({ field: "engineHours", report, asset })
    case "ignition":
      return hasTelemetryValue({ field: "ignition", report, asset })
    default:
      return true
  }
}

const normalizeConditionSignature = (condition = {}) => {
  return [
    String(condition.field || ""),
    String(condition.operator || "exists"),
    String(condition.value ?? ""),
  ].join(":")
}

const DEFAULT_RULE_CONDITION_SIGNATURES = {
  movement: ["speed:greaterThan:3"],
  stops: ["speed:equals:0"],
  idle: [["ignition:equals:true", "speed:lessThanOrEqual:3"], ["state:equals:idle"]],
  speeding: ["speed:greaterThan:80"],
  gpsSignal: [["satellites:lessThanOrEqual:3"], ["satellites:exists:"]],
  alerts: ["alert:exists:"],
}

const hasDefaultRuleConditions = (rule = {}) => {
  const defaultSignatures = DEFAULT_RULE_CONDITION_SIGNATURES[rule.id]

  if (!defaultSignatures) return false
  if (!Array.isArray(rule.conditions)) return false

  const signatures = rule.conditions.map(normalizeConditionSignature)
  const signatureAlternatives = Array.isArray(defaultSignatures[0])
    ? defaultSignatures
    : [defaultSignatures]

  return signatureAlternatives.some((expectedSignatures) => {
    if (signatures.length !== expectedSignatures.length) return false

    return signatures.every((signature, index) => signature === expectedSignatures[index])
  })
}

const compareCondition = ({ value, operator, expectedValue }) => {
  const hasValue = value !== undefined && value !== null && value !== ""

  if (operator === "exists") return hasValue
  if (operator === "notExists") return !hasValue

  const leftNumber = toNumber(value)
  const rightNumber = toNumber(expectedValue)

  if (
    ["greaterThan", "greaterThanOrEqual", "lessThan", "lessThanOrEqual"].includes(operator) &&
    leftNumber !== null &&
    rightNumber !== null
  ) {
    if (operator === "greaterThan") return leftNumber > rightNumber
    if (operator === "greaterThanOrEqual") return leftNumber >= rightNumber
    if (operator === "lessThan") return leftNumber < rightNumber
    if (operator === "lessThanOrEqual") return leftNumber <= rightNumber
  }

  if (["equals", "notEquals"].includes(operator) && leftNumber !== null && rightNumber !== null) {
    if (operator === "equals") return leftNumber === rightNumber
    if (operator === "notEquals") return leftNumber !== rightNumber
  }

  const leftText = normalizeText(value)
  const rightText = normalizeText(expectedValue)
  const leftBoolean = toBooleanValue(value)
  const rightBoolean = toBooleanValue(expectedValue)

  if (rightBoolean !== null && leftBoolean !== null) {
    if (operator === "equals") return leftBoolean === rightBoolean
    if (operator === "notEquals") return leftBoolean !== rightBoolean
  }

  if (operator === "equals") return leftText === rightText
  if (operator === "notEquals") return leftText !== rightText
  if (operator === "contains") return leftText.includes(rightText)

  return true
}

export const doesReportMatchEventRule = ({ report, asset, rule }) => {
  if (!rule || rule.id === "all") return false
  if (rule.active === false) return false
  if (!doesRuleApplyToGroup({ report, asset, rule })) return false
  if (!doesRuleApplyToSchedule({ report, asset, rule })) return false
  if (isSpeedingEventRule(rule) && !hasSpeedingSignal({ report, asset, rule })) return false
  if (!doesReportHaveDefaultRuleSignal({ report, asset, rule })) return false
  if (hasDefaultRuleConditions(rule)) return true
  if (!Array.isArray(rule.conditions) || !rule.conditions.length) return true

  return rule.conditions.every((condition) => {
    const value = getEventFieldValue({
      field: condition.field,
      report,
      asset,
      rule,
    })

    return compareCondition({
      value,
      operator: condition.operator || "exists",
      expectedValue: condition.value,
    })
  })
}

export const doesReportMatchEventRules = ({ report, asset, template, eventRulesById }) => {
  const eventRuleIds = normalizeEventRuleIds(template)

  if (!eventRuleIds.length) return false

  return eventRuleIds.some((eventRuleId) => {
    const rule = eventRulesById?.get?.(eventRuleId)

    return doesReportMatchEventRule({
      report,
      asset,
      rule,
    })
  })
}
