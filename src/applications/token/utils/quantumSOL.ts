import { SplToken, HydratedTokenJsonInfo } from '../type'
import { Token } from 'entity/currency'
import { PublicKey } from '@solana/web3.js'
import toPubString from '../../../functions/toMintString'
import { TokenAmount } from 'entity/amount'
import BN from 'bn.js'
import { ZERO } from 'entity/constant'
import { PublicKeyish } from 'common/pubkey'
import { Currency } from 'entity/currency'
import { CurrencyAmount } from 'entity/amount'
import { isToken, isTokenAmount } from 'functions/judgers/dateType'

export const WSOLMint = new PublicKey('So11111111111111111111111111111111111111112')
export const SOLDecimals = 9
export const WSOL = new Token(WSOLMint, SOLDecimals, 'WSOL', 'wrapped solana')
export const SOLUrlMint = 'sol'
export const SOL = new Currency(SOLDecimals, 'SOL', 'solana')

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

export interface QuantumSOLAmount extends TokenAmount {
  token: QuantumSOLToken
  solBalance: BN
  wsolBalance: BN
  collapseTo?: 'sol' | 'wsol'
}

export const quantumSOLHydratedTokenJsonInfo: QuantumSOLJsonInfo = {
  isQuantumSOL: true,
  isLp: false,
  official: true,
  mint: toPubString(WSOLMint),
  decimals: SOLDecimals,
  symbol: 'SOL', // QSOL
  name: 'solana',
  icon: `https://img.raydium.io/icon/So11111111111111111111111111111111111111112.png`,
  extensions: {
    coingeckoId: 'solana',
  },
} as const

export const QuantumSOL = Object.assign(
  new Token(
    quantumSOLHydratedTokenJsonInfo.mint,
    quantumSOLHydratedTokenJsonInfo.decimals,
    quantumSOLHydratedTokenJsonInfo.symbol,
    quantumSOLHydratedTokenJsonInfo.name
  ),
  omit(quantumSOLHydratedTokenJsonInfo, ['mint', 'decimals', 'symbol', 'name'])
) as QuantumSOLToken

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

export const isQuantumSOLVersionSOL = (token: any) => isQuantumSOL(token) && token.collapseTo === 'sol'

export const quantumSOLVersionWSOLTokenJsonInfo: QuantumSOLJsonInfo = {
  isQuantumSOL: true,
  isLp: false,
  official: true,
  mint: toPubString(WSOLMint),
  decimals: SOLDecimals,
  collapseTo: 'wsol',
  symbol: 'WSOL',
  name: 'Wrapped SOL',
  icon: `https://img.raydium.io/icon/So11111111111111111111111111111111111111112.png`,
  extensions: {
    coingeckoId: 'solana'
  }
} as const

export const QuantumSOLVersionWSOL = Object.assign(
  new Token(
    quantumSOLVersionWSOLTokenJsonInfo.mint,
    quantumSOLVersionWSOLTokenJsonInfo.decimals,
    quantumSOLVersionWSOLTokenJsonInfo.symbol,
    quantumSOLVersionWSOLTokenJsonInfo.name
  ),
  omit(quantumSOLVersionWSOLTokenJsonInfo, ['mint', 'decimals', 'symbol', 'name'])
) as QuantumSOLToken

export const toQuantumSolAmount = ({
  solRawAmount: solRawAmount,
  wsolRawAmount: wsolRawAmount,
}: {
  solRawAmount?: BN
  wsolRawAmount?: BN
}): QuantumSOLAmount => {
  const quantumSol = solRawAmount ? QuantumSOLVersionSOL : QuantumSOL
  const tempTokenAmount = new TokenAmount(quantumSol, solRawAmount ?? wsolRawAmount ?? ZERO)
  // @ts-expect-error force
  return Object.assign(tempTokenAmount, { solBalance: solRawAmount, wsolBalance: wsolRawAmount })
}

export function toDataMint(mintlike: PublicKeyish | undefined): string {
  return String(mintlike) === SOLUrlMint ? String(WSOLMint) : String(mintlike ?? '')
}

/** transaction: wrap NativeSOL(real) to QuantumSOL */
export function toUITokenAmount(tokenAmount: TokenAmount | CurrencyAmount): TokenAmount {
  if (isTokenAmount(tokenAmount)) {
    return tokenAmount
  } else {
    // CurrencyAmount must be SOL
    return toQuantumSolAmount({ solRawAmount: tokenAmount.raw })
  }
}

// @ts-expect-error no need to worry about type guard's type here
export const isQuantumSOLAmount: (tokenAmount: TokenAmount) => tokenAmount is QuantumSOLAmount = (tokenAmount) =>
  isQuantumSOL(tokenAmount.token)

//#region ------------------- SDK instruction SOL  -------------------
/** transaction for SDK: unWrap  may QuantumSOL to TokenAmount or CurrencyAmount */
export function deUITokenAmount(tokenAmount: TokenAmount): TokenAmount | CurrencyAmount {
  if (isQuantumSOLAmount(tokenAmount)) {
    // if (tokenAmount.token.collapseTo === 'wsol') {
    //   // return new TokenAmount(WSOL, tokenAmount.wsolBalance ?? ZERO) // which means error appears
    // } else {
    return new CurrencyAmount(SOL, tokenAmount.solBalance ?? ZERO) // which means error appears
    // }
  }
  return tokenAmount
}

export function deUIToken(token: Token): Token | Currency {
  if (isQuantumSOL(token)) {
    return token.collapseTo !== 'wsol' && SOL
  }
  return token
}
