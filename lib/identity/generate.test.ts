import { describe, it, expect } from 'vitest'
import { generateCode, hashCode, deriveSpacePseudonym } from './generate'
import { WORDLIST } from './wordlist'

const TEST_PEPPER = 'a'.repeat(64) // 32 bytes hex for testing

describe('generateCode()', () => {
  it('produces the correct format: 5 words + 2-digit suffix', () => {
    const code = generateCode()
    // e.g. "amber-falcon-brook-marsh-quill-92"
    expect(code).toMatch(/^[a-z]+-[a-z]+-[a-z]+-[a-z]+-[a-z]+-\d{2}$/)
  })

  it('uses words from the EFF wordlist', () => {
    const code = generateCode()
    const parts = code.split('-')
    const words = parts.slice(0, 5)
    for (const word of words) {
      expect(WORDLIST).toContain(word)
    }
  })

  it('suffix is zero-padded to 2 digits', () => {
    // Run many times to catch single-digit cases
    for (let i = 0; i < 200; i++) {
      const code = generateCode()
      const suffix = code.split('-').at(-1)!
      expect(suffix).toMatch(/^\d{2}$/)
    }
  })

  it('produces unique codes across multiple calls', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateCode()))
    expect(codes.size).toBe(50)
  })
})

describe('hashCode()', () => {
  it('is deterministic — same input always produces same hash', async () => {
    const h1 = await hashCode('amber-falcon-brook-marsh-quill-92', TEST_PEPPER)
    const h2 = await hashCode('amber-falcon-brook-marsh-quill-92', TEST_PEPPER)
    expect(h1).toBe(h2)
  })

  it('normalises whitespace — trimmed and un-trimmed versions hash equally', async () => {
    const h1 = await hashCode('  amber-falcon-brook-marsh-quill-92  ', TEST_PEPPER)
    const h2 = await hashCode('amber-falcon-brook-marsh-quill-92', TEST_PEPPER)
    expect(h1).toBe(h2)
  })

  it('normalises case — uppercase and lowercase hash equally', async () => {
    const h1 = await hashCode('AMBER-FALCON-BROOK-MARSH-QUILL-92', TEST_PEPPER)
    const h2 = await hashCode('amber-falcon-brook-marsh-quill-92', TEST_PEPPER)
    expect(h1).toBe(h2)
  })

  it('is sensitive to input — different codes produce different hashes', async () => {
    const h1 = await hashCode('amber-falcon-brook-marsh-quill-92', TEST_PEPPER)
    const h2 = await hashCode('amber-falcon-brook-marsh-quill-93', TEST_PEPPER)
    expect(h1).not.toBe(h2)
  })

  it('is sensitive to pepper — different peppers produce different hashes', async () => {
    const h1 = await hashCode('amber-falcon-brook-marsh-quill-92', TEST_PEPPER)
    const h2 = await hashCode('amber-falcon-brook-marsh-quill-92', 'b'.repeat(64))
    expect(h1).not.toBe(h2)
  })

  it('returns a valid 64-char hex string (SHA-256 output)', async () => {
    const h = await hashCode('test-code', TEST_PEPPER)
    expect(h).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('deriveSpacePseudonym()', () => {
  const identityId = 'identity-abc-123'
  const spaceId1 = 'space-general'
  const spaceId2 = 'space-tech'

  it('is deterministic — same args always produce same pseudonym', async () => {
    const p1 = await deriveSpacePseudonym(identityId, spaceId1, TEST_PEPPER)
    const p2 = await deriveSpacePseudonym(identityId, spaceId1, TEST_PEPPER)
    expect(p1).toBe(p2)
  })

  it('is isolated — same identity in different spaces has different pseudonym', async () => {
    const p1 = await deriveSpacePseudonym(identityId, spaceId1, TEST_PEPPER)
    const p2 = await deriveSpacePseudonym(identityId, spaceId2, TEST_PEPPER)
    expect(p1).not.toBe(p2)
  })

  it('produces the expected format: "Adjective Animal NN"', async () => {
    const p = await deriveSpacePseudonym(identityId, spaceId1, TEST_PEPPER)
    // e.g. "Quiet Falcon 42"
    expect(p).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ \d{2}$/)
  })

  it('different identities in the same space get different pseudonyms', async () => {
    const p1 = await deriveSpacePseudonym('identity-aaa', spaceId1, TEST_PEPPER)
    const p2 = await deriveSpacePseudonym('identity-bbb', spaceId1, TEST_PEPPER)
    expect(p1).not.toBe(p2)
  })
})
