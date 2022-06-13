import BN from 'bn.js'
import { PublicKey } from '@solana/web3.js'

export type HexAddress = string
export type PublicKeyish = HexAddress | PublicKey
export type Numberish = number | string | bigint | BN
