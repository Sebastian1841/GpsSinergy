export const normalizeDriverLicenseNotifications = (value = {}) => {
  const email = { enabled: value?.email?.enabled === true, address: String(value?.email?.address || '').trim() }
  const whatsapp = { enabled: value?.whatsapp?.enabled === true, phone: String(value?.whatsapp?.phone || '').replace(/[\s()-]/g, '') }
  if (email.enabled && (email.address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.address)))
    throw new Error('Ingresa un correo valido para las notificaciones de la licencia.')
  if (whatsapp.enabled && !/^\+[1-9]\d{7,14}$/.test(whatsapp.phone))
    throw new Error('Ingresa WhatsApp con codigo de pais, por ejemplo +56912345678.')
  return { email, whatsapp }
}
