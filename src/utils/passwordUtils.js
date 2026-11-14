// Password hashing utilities using Web Crypto API

/**
 * Hash a password using SHA-256
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - The hashed password as a hex string
 */
export const hashPassword = async (password) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Verify a password against a hash
 * @param {string} password - The password to verify
 * @param {string} hash - The hash to verify against
 * @returns {Promise<boolean>} - True if password matches hash
 */
export const verifyPassword = async (password, hash) => {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

/**
 * Generate a random PIN (4 digits)
 * @returns {string} - A 4-digit PIN
 */
export const generatePin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export default {
  hashPassword,
  verifyPassword,
  generatePin
}