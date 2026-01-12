import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { fr } from 'date-fns/locale'
import { QUOTA_MENSUEL, PRIME_PAR_LED } from './constants'

// Formatage de dates
export function formatDate(date, formatStr = 'dd MMM yyyy') {
  if (!date) return ''
  return format(new Date(date), formatStr, { locale: fr })
}

export function formatDateTime(date) {
  if (!date) return ''
  return format(new Date(date), 'dd MMM yyyy à HH:mm', { locale: fr })
}

// Calcul de période
export function getCurrentMonthRange() {
  const now = new Date()
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  }
}

export function getCurrentYearRange() {
  const now = new Date()
  return {
    start: startOfYear(now),
    end: endOfYear(now),
  }
}

// Calcul de prime
export function calculatePrime(ledValidees, quotaMensuel = QUOTA_MENSUEL) {
  const ledSurQuota = Math.max(0, ledValidees - quotaMensuel)
  return ledSurQuota * PRIME_PAR_LED
}

// Calcul du pourcentage de quota
export function calculateQuotaProgress(ledValidees, quotaMensuel = QUOTA_MENSUEL) {
  return Math.min((ledValidees / quotaMensuel) * 100, 100)
}

// Génération d'un token sécurisé
export function generateSecureToken() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Validation email
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validation téléphone français
export function isValidPhone(phone) {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
  return phoneRegex.test(phone)
}

// Formater le téléphone pour l'affichage
export function formatPhone(phone) {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('33')) {
    return '+33 ' + cleaned.slice(2).replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  }
  return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
}

// Formater le téléphone pour l'envoi SMS (E.164)
export function formatPhoneE164(phone) {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    return '+33' + cleaned.slice(1)
  }
  if (cleaned.startsWith('33')) {
    return '+' + cleaned
  }
  return '+33' + cleaned
}

// Tronquer le texte
export function truncate(str, length = 50) {
  if (!str) return ''
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// Formater les nombres
export function formatNumber(num) {
  if (num === null || num === undefined) return '0'
  return new Intl.NumberFormat('fr-FR').format(num)
}

// Formater les montants
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '0 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Classe conditionnelle (type clsx simplifié)
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Délai asynchrone
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Debounce
export function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
