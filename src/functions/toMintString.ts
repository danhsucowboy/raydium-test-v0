import { PublicKeyish } from 'types/constants'
import { PublicKey } from '@solana/web3.js'

const mintCache = new WeakMap<PublicKey, string>()

export function isString(val: unknown): val is string {
  return typeof val === 'string'
}

//TODO: no token
export default function toPubString(mint: PublicKeyish | undefined): string {
  if (!mint) return ''
  if (isString(mint)) return mint
  if (mintCache.has(mint)) {
    return mintCache.get(mint)!
  } else {
    const mintString = mint.toBase58()
    mintCache.set(mint, mintString)
    return mintString
  }
}
