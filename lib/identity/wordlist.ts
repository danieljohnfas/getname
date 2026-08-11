/**
 * 7776-word EFF Large Wordlist
 * Source: https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt
 *
 * Extracted to JSON to avoid edge runtime issues with native node modules.
 */

import effWords from './eff_words.json'

export const WORDLIST: string[] = effWords as string[]

// Verify at import time (fails fast in tests if something goes wrong)
if (WORDLIST.length !== 7776) {
  throw new Error(`EFF wordlist incorrect length: ${WORDLIST.length} words.`)
}
