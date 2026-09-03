/**
 * Utilitaires de formatage de dates et heures pour AlphaMedPro.
 */

/**
 * Formate une date ISO ou un objet Date en JJ/MM/AAAA.
 */
export function formatDate(val) {
  if (!val) return '—'
  try {
    const d = typeof val === 'string' && val.includes('-') && !val.includes('T') && !val.includes(' ')
      ? new Date(`${val}T00:00:00`)
      : new Date(val)
    if (isNaN(d.getTime())) {
      // Fallback simple si parsing échoue
      if (typeof val === 'string' && val.length >= 10) {
        const parts = val.substring(0, 10).split('-')
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return val
    }
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return val || '—'
  }
}

/**
 * Formate une date et heure ISO ou un objet Date en "JJ/MM/AAAA à HH:mm" (ou "JJ/MM/AAAA HH:mm").
 */
export function formatDateTime(val, separator = ' à ') {
  if (!val) return '—'
  try {
    let d = new Date(val)
    if (isNaN(d.getTime())) {
      // Cas ISO direct ou tronqué
      if (typeof val === 'string' && val.length >= 16) {
        const parts = val.substring(0, 10).split('-')
        const timePart = val.substring(11, 16)
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}${separator}${timePart}`
        }
      }
      return formatDate(val)
    }

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')

    return `${day}/${month}/${year}${separator}${hours}:${minutes}`
  } catch {
    return val || '—'
  }
}

/**
 * Formate uniquement l'heure en "HH:mm".
 */
export function formatTime(val) {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return '—'
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  } catch {
    return '—'
  }
}

/**
 * Retourne la date et l'heure actuelles au format ISO compatible input "datetime-local" (YYYY-MM-DDTHH:mm).
 */
export function getCurrentDateTimeLocal() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16)
  return localISOTime
}
