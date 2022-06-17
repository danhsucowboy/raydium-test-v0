import { LiquidityPoolJsonInfo as LiquidityJsonInfo } from 'liquidity/type'

import BN from 'bn.js'
import { PublicKey } from '@solana/web3.js'
import { SplToken } from '../token/type'
import { Fraction } from 'entity/fraction'
import { TokenAmount } from 'entity/amount'
import { ReplaceType } from 'common/convert-json'

export type SDKParsedLiquidityInfo = ReplaceType<LiquidityJsonInfo, string, PublicKey> & {
  jsonInfo: LiquidityJsonInfo
  status: BN // do not know what is this
  baseDecimals: number
  quoteDecimals: number
  lpDecimals: number
  baseReserve: BN
  quoteReserve: BN
  lpSupply: BN
  startTime: BN
}
/** computed by other info  */
// eslint-disable-next-line @typescript-eslint/no-empty-interface

export interface HydratedLiquidityInfo extends SDKParsedLiquidityInfo {
  sharePercent: Fraction | undefined
  lpToken: SplToken | undefined
  baseToken: SplToken | undefined
  quoteToken: SplToken | undefined
  userBasePooled: TokenAmount | undefined
  userQuotePooled: TokenAmount | undefined
}
