import { SplToken, HydratedTokenJsonInfo } from '../type'
import { Token } from 'entity/currency'
import { PublicKey } from '@solana/web3.js'
import toPubString from '../../../functions/toMintString'

export const WSOLMint = new PublicKey('So11111111111111111111111111111111111111112')
export const SOLDecimals = 9

/**
 * the same as typescript:Omit
 * @example
 * omit({ a: 1, b: true }, ['a']) //=> { b: true }
 */
export function omit<T, U extends keyof T>(obj: T, ...inputKeys: (U[] | U)[]): Omit<T, U> {
  const unvalidKeys = inputKeys.flat()
  //@ts-expect-error Object.fromEntries / Object.entries' type is not quite intelligense. So force to type it !!!
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !unvalidKeys.includes(key)))
}

export interface QuantumSOLJsonInfo extends HydratedTokenJsonInfo {
  isQuantumSOL: true
  collapseTo?: 'sol' | 'wsol'
}

export interface QuantumSOLToken extends SplToken {
  isQuantumSOL: true
  collapseTo?: 'sol' | 'wsol'
}

export const quantumSOLVersionSOLTokenJsonInfo: QuantumSOLJsonInfo = {
  isQuantumSOL: true,
  isLp: false,
  official: true,
  mint: toPubString(WSOLMint),
  decimals: SOLDecimals,
  collapseTo: 'sol',
  symbol: 'SOL',
  name: 'solana',
  icon: `https://img.raydium.io/icon/So11111111111111111111111111111111111111112.png`,
  extensions: {
    coingeckoId: 'solana',
  },
} as const

export const QuantumSOLVersionSOL = Object.assign(
  new Token(
    quantumSOLVersionSOLTokenJsonInfo.mint,
    quantumSOLVersionSOLTokenJsonInfo.decimals,
    quantumSOLVersionSOLTokenJsonInfo.symbol,
    quantumSOLVersionSOLTokenJsonInfo.name
  ),
  omit(quantumSOLVersionSOLTokenJsonInfo, ['mint', 'decimals', 'symbol', 'name'])
) as QuantumSOLToken

// @ts-expect-error no need to worry about type guard's type here
export const isQuantumSOL: (token: any) => token is QuantumSOLToken = (token) => {
  try {
    return 'isQuantumSOL' in (token as QuantumSOLToken)
  } catch {
    return false
  }
}

export const isQuantumSOLVersionWSOL = (token: any) => isQuantumSOL(token) && token.collapseTo === 'wsol'
