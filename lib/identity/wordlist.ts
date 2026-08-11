/**
 * EFF Long Wordlist — 7,776 words for diceware passphrase generation.
 * Source: https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt
 *
 * The eff-diceware-passphrase package exports an object keyed by 5-digit dice
 * rolls (e.g. "11111" → "abacus"). We extract just the word values here.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const effList = require('eff-diceware-passphrase') as Record<string, string>

export const WORDLIST: string[] = Object.values(effList)

// Verify at import time (fails fast in tests if package structure changes)
if (WORDLIST.length < 7000) {
  throw new Error(`EFF wordlist too short: ${WORDLIST.length} words. Check eff-diceware-passphrase package.`)
}
