import BN from 'bn.js'
import { PublicKey } from '@solana/web3.js'
import { Fraction } from 'entity/fraction'

export type AnyFn = (...args: any[]) => any

export type Primitive = boolean | number | string | bigint
export type StringNumber = string | number
export type HexAddress = string
export type SrcAddress = string
export type MayPromise<T> = T | Promise<T>

export type PublicKeyish = HexAddress | PublicKey
export type Numberish = number | string | bigint | Fraction | BN

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
