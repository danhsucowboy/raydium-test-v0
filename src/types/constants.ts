import BN from 'bn.js'
import { PublicKey } from '@solana/web3.js'

export type HexAddress = string
export type SrcAddress = string

export type PublicKeyish = HexAddress | PublicKey
export type Numberish = number | string | bigint | BN

export function validateAndParsePublicKey(publicKey: PublicKeyish) {
  if (publicKey instanceof PublicKey) {
    return publicKey
  }

  if (typeof publicKey === 'string') {
    try {
      const key = new PublicKey(publicKey)
      return key
    } catch {
      throw Error(`invalid public key: ${publicKey}`)
    }
  }
  throw Error(`invalid public key: ${publicKey}`)
}
