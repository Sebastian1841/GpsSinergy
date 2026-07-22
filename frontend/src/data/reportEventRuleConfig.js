export const REPORT_EVENT_RULE_FIELD_OPTIONS = [
  { id: "speed", label: "Velocidad", category: "analog" },
  { id: "speedLimit", label: "Limite de velocidad", category: "analog" },
  { id: "speedingDelta", label: "Sobre limite", category: "analog" },
  { id: "speeding", label: "Exceso de velocidad", category: "digital" },
  { id: "state", label: "Estado", category: "text" },
  { id: "event", label: "Evento", category: "text" },
  { id: "alert", label: "Alerta", category: "text" },
  { id: "geofence", label: "Geocerca", category: "text" },
  { id: "fuel", label: "Combustible", category: "analog" },
  { id: "can", label: "Datos CAN", category: "analog" },
  { id: "satellites", label: "Satelites", category: "analog" },
  { id: "gpsSignal", label: "Senal GPS", category: "analog" },
  { id: "ignition", label: "Encendido", category: "digital" },
  { id: "engineHours", label: "Horas motor", category: "analog" },
  { id: "duration", label: "Duracion", category: "analog" },
  { id: "odometer", label: "Odometro", category: "analog" },
  { id: "canRpm", label: "CAN RPM", category: "analog" },
  { id: "canEngineTemp", label: "CAN temperatura motor", category: "analog" },
  { id: "canBatteryVoltage", label: "CAN voltaje bateria", category: "analog" },
  { id: "canEngineLoad", label: "CAN carga motor", category: "analog" },
  { id: "canThrottle", label: "CAN acelerador", category: "analog" },
  { id: "canFuelRate", label: "CAN consumo instantaneo", category: "analog" },
  { id: "canFuelUsed", label: "CAN combustible usado", category: "analog" },
  { id: "canOilPressure", label: "CAN presion aceite", category: "analog" },
  { id: "canAdBlueLevel", label: "CAN AdBlue", category: "analog" },
  { id: "canDtcCount", label: "CAN codigos DTC", category: "analog" },
  { id: "gpsFix", label: "GPS fix", category: "digital" },
  { id: "digitalInput1", label: "Entrada digital 1", category: "digital" },
  { id: "digitalInput2", label: "Entrada digital 2", category: "digital" },
  { id: "driver", label: "Conductor", category: "text" },
  { id: "driverGroup", label: "Grupo de conductor", category: "text" },
  { id: "poi", label: "Punto de interes", category: "text" },
  { id: "rendezvous", label: "Rendezvous", category: "digital" },
  { id: "rendezvousDistance", label: "Distancia rendezvous", category: "analog" },
  { id: "script", label: "Script", category: "text" },
  { id: "http", label: "HTTP", category: "text" },
]

export const REPORT_EVENT_RULE_OPERATOR_OPTIONS = [
  { id: "exists", label: "Existe", needsValue: false },
  { id: "notExists", label: "No existe", needsValue: false },
  { id: "equals", label: "Es igual a", needsValue: true },
  { id: "notEquals", label: "Es distinto de", needsValue: true },
  { id: "contains", label: "Contiene", needsValue: true },
  { id: "greaterThan", label: "Mayor que", needsValue: true },
  { id: "greaterThanOrEqual", label: "Mayor o igual que", needsValue: true },
  { id: "lessThan", label: "Menor que", needsValue: true },
  { id: "lessThanOrEqual", label: "Menor o igual que", needsValue: true },
]

export const REPORT_EVENT_RULE_WEEKDAY_OPTIONS = [
  { id: 1, label: "Lun" },
  { id: 2, label: "Mar" },
  { id: 3, label: "Mie" },
  { id: 4, label: "Jue" },
  { id: 5, label: "Vie" },
  { id: 6, label: "Sab" },
  { id: 0, label: "Dom" },
]

export const REPORT_EVENT_RULE_EXPRESSION_OPTIONS = [
  { id: "text", label: "Comparar cadenas de texto" },
  { id: "analog", label: "Expresion Analogica" },
  { id: "digital", label: "Expresion Digital" },
  { id: "driverLogin", label: "Expresion DriverID login" },
  { id: "driverGroup", label: "Expresion DriverID en grupo" },
  { id: "offline", label: "Expresion Fuera de Linea" },
  { id: "geofence", label: "Expresion Geocerca" },
  { id: "poi", label: "Expresion puntos de interes" },
  { id: "rendezvous", label: "Expresion Rendezvous" },
  { id: "script", label: "Expresion Script" },
  { id: "speeding", label: "Expresion Exceso de velocidad" },
  { id: "http", label: "Http Expression" },
]

export const REPORT_EVENT_RULE_ALERT_TYPE_OPTIONS = [
  { id: "info", label: "Informativa" },
  { id: "warning", label: "Advertencia" },
  { id: "critical", label: "Critica" },
  { id: "emergency", label: "Emergencia" },
]

export const REPORT_EVENT_RULE_NOTIFICATION_OPTIONS = [
  {
    id: "variable",
    label: "Variable",
    targetLabel: "Variable",
    messageLabel: "Valor",
  },
  {
    id: "icon",
    label: "Icono",
    targetLabel: "Icono",
    messageLabel: "Texto",
  },
  {
    id: "text",
    label: "Texto",
    targetLabel: "Destino",
    messageLabel: "Mensaje",
  },
  {
    id: "sms",
    label: "SMS",
    targetLabel: "Telefono",
    messageLabel: "Mensaje",
  },
  {
    id: "smsSelf",
    label: "SMS Self",
    targetLabel: "Usuario",
    messageLabel: "Mensaje",
  },
  {
    id: "fleetApp",
    label: "Fleet app",
    targetLabel: "Usuario o grupo",
    messageLabel: "Mensaje",
  },
  {
    id: "email",
    label: "Correo electronico",
    targetLabel: "Correo",
    messageLabel: "Mensaje",
  },
  {
    id: "emailSelf",
    label: "Email Self",
    targetLabel: "Usuario",
    messageLabel: "Mensaje",
  },
  {
    id: "command",
    label: "Comando",
    targetLabel: "Comando",
    messageLabel: "Argumento",
  },
  {
    id: "argument",
    label: "Argumento",
    targetLabel: "Argumento",
    messageLabel: "Valor",
  },
  {
    id: "driverId",
    label: "Driver ID",
    targetLabel: "Driver ID",
    messageLabel: "Mensaje",
  },
  {
    id: "telegram",
    label: "Telegram",
    targetLabel: "Chat",
    messageLabel: "Mensaje",
  },
  {
    id: "slack",
    label: "Slack",
    targetLabel: "Canal",
    messageLabel: "Mensaje",
  },
  {
    id: "reportArgument",
    label: "Argumento Reporte",
    targetLabel: "Argumento",
    messageLabel: "Valor",
  },
  {
    id: "groupNotifier",
    label: "Group Notifier",
    targetLabel: "Grupo",
    messageLabel: "Mensaje",
  },
]

export const DEFAULT_SCHEDULE = {
  mode: "always",
  timeFrom: "",
  timeTo: "",
  weekdays: [],
}

export const DEFAULT_ACTIVATION = {
  mode: "immediate",
  delayMinutes: 1,
  autoExecuteAfterDelay: false,
}

export const DEFAULT_ALERT_TYPE_BY_RULE_ID = {
  movement: "info",
  stops: "warning",
  idle: "warning",
  tripEnd: "info",
  speeding: "critical",
  geofence: "warning",
  alerts: "critical",
  gpsSignal: "warning",
  fuel: "warning",
  can: "warning",
  engine: "warning",
  ignition: "info",
}

export const DEFAULT_RULE_CONDITIONS = {
  movement: [
    {
      field: "speed",
      operator: "greaterThan",
      value: "3",
    },
  ],
  stops: [
    {
      field: "speed",
      operator: "equals",
      value: "0",
    },
  ],
  idle: [
    {
      field: "ignition",
      operator: "equals",
      value: "true",
    },
    {
      field: "speed",
      operator: "lessThanOrEqual",
      value: "3",
    },
  ],
  tripEnd: [
    {
      field: "ignition",
      operator: "equals",
      value: "false",
    },
    {
      field: "speed",
      operator: "equals",
      value: "0",
    },
  ],
  speeding: [
    {
      expressionType: "speeding",
      field: "speed",
      operator: "greaterThan",
      value: "80",
    },
  ],
  geofence: [
    {
      field: "geofence",
      operator: "exists",
      value: "",
    },
  ],
  alerts: [
    {
      field: "alert",
      operator: "exists",
      value: "",
    },
  ],
  gpsSignal: [
    {
      field: "satellites",
      operator: "lessThanOrEqual",
      value: "3",
    },
  ],
  fuel: [
    {
      field: "fuel",
      operator: "exists",
      value: "",
    },
  ],
  can: [
    {
      field: "can",
      operator: "exists",
      value: "",
    },
  ],
  engine: [
    {
      field: "engineHours",
      operator: "exists",
      value: "",
    },
  ],
  ignition: [
    {
      field: "ignition",
      operator: "exists",
      value: "",
    },
  ],
}
