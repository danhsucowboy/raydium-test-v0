import { LiquidityVersion } from "applications/liquidity/type"

export interface NativeTokenInfo {
  readonly symbol: string
  readonly name: string

  readonly decimals: number
}

export type ExtensionKey = 'coingeckoId' | 'website' | 'whitepaper'

export type Extensions = { [key in ExtensionKey]?: string }

// SPL token
export interface SplTokenInfo extends NativeTokenInfo {
  // readonly chainId: ENV;
  readonly mint: string

  readonly extensions: Extensions
}

// SPL tokens
export type SplTokens = {
  [Symbol.iterator](): IterableIterator<SplTokenInfo>
} & {
  [T in string]: SplTokenInfo
}

// LP token
export interface LpTokenInfo extends NativeTokenInfo {
  readonly mint: string

  readonly base: SplTokenInfo
  readonly quote: SplTokenInfo

  readonly version: LiquidityVersion
}

// LP tokens
export type LpTokens = {
  [Symbol.iterator](): IterableIterator<LpTokenInfo>
} & {
  [T in string]: LpTokenInfo
}
