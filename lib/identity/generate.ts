import { WORDLIST } from './wordlist'

// ─── Adjective + Animal pools for per-space pseudonyms ───────────────────────

const ADJECTIVES = [
  'Quiet', 'Swift', 'Calm', 'Bright', 'Dark', 'Wild', 'Soft', 'Bold',
  'Pale', 'Deep', 'Lone', 'Still', 'Sharp', 'Warm', 'Cold', 'Dry',
  'Vast', 'Slow', 'Keen', 'Mild', 'Free', 'Odd', 'Rare', 'Firm',
  'Vast', 'Grim', 'Fair', 'Bare', 'Dusk', 'Dawn',
]

const ANIMALS = [
  'Falcon', 'Raven', 'Otter', 'Lynx', 'Crane', 'Viper', 'Bison', 'Heron',
  'Stoat', 'Finch', 'Gecko', 'Quail', 'Dingo', 'Egret', 'Mink', 'Puffin',
  'Snipe', 'Tapir', 'Ibis', 'Newt', 'Kite', 'Wren', 'Teal', 'Moth',
  'Dove', 'Boar', 'Hart', 'Vole', 'Pike', 'Wasp',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a hex string like "SERVER_PEPPER" env var into a Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/** Convert an ArrayBuffer to a lowercase hex string */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Import a raw pepper string as an HMAC-SHA-256 CryptoKey */
async function importPepperKey(pepper: string): Promise<CryptoKey> {
  const pepperBytes = /^[0-9a-f]+$/i.test(pepper)
    ? hexToBytes(pepper)
    : new TextEncoder().encode(pepper)

  return crypto.subtle.importKey(
    'raw',
    pepperBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

/** Compute HMAC-SHA-256(key, message) and return as hex */
async function hmacHex(key: CryptoKey, message: string): Promise<string> {
  const msgBytes = new TextEncoder().encode(message)
  const sig = await crypto.subtle.sign('HMAC', key, msgBytes)
  return bufferToHex(sig)
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate a fresh anonymous access code.
 * Format: word1-word2-word3-word4-word5-NN
 * Example: amber-falcon-brook-marsh-quill-92
 *
 * Uses crypto.getRandomValues — cryptographically secure.
 * ~71 bits of entropy. Effectively unguessable.
 */
export function generateCode(): string {
  const randoms = new Uint32Array(6)
  crypto.getRandomValues(randoms)

  const words = Array.from({ length: 5 }, (_, i) =>
    WORDLIST[randoms[i] % WORDLIST.length],
  )
  const suffix = String(randoms[5] % 100).padStart(2, '0')

  return [...words, suffix].join('-')
}

/**
 * Hash an access code for storage and lookup.
 *
 * Uses HMAC-SHA-256 with a server-side pepper so that a raw DB dump
 * alone cannot be used to build a lookup table.
 *
 * Normalises the code (trim + lowercase) before hashing so incidental
 * whitespace or capitalisation differences don't cause false failures.
 *
 * NEVER log the plaintext code argument.
 */
export async function hashCode(code: string, pepper: string): Promise<string> {
  const normalised = code.trim().toLowerCase()
  const key = await importPepperKey(pepper)
  return hmacHex(key, normalised)
}

/**
 * Derive a stable, per-space display name for an identity.
 *
 * Properties:
 * - Deterministic: same (identityId, spaceId) always produces the same name
 * - Isolated: same identityId in a different space → completely different name
 * - No DB column needed — derived at read time
 *
 * Format: "Quiet Falcon 42"
 */
export async function deriveSpacePseudonym(
  identityId: string,
  spaceId: string,
  pepper: string,
): Promise<string> {
  const key = await importPepperKey(pepper)
  const hex = await hmacHex(key, `${identityId}:${spaceId}`)

  // Use first 4 bytes of the HMAC output to pick adjective, animal, suffix
  const b = (idx: number) => parseInt(hex.slice(idx * 2, idx * 2 + 2), 16)

  const adj = ADJECTIVES[b(0) % ADJECTIVES.length]
  const animal = ANIMALS[b(1) % ANIMALS.length]
  const num = ((b(2) * 256 + b(3)) % 100).toString().padStart(2, '0')

  return `${adj} ${animal} ${num}`
}
