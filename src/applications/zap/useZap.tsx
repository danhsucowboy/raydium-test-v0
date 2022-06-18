import create from 'zustand'

import { SplToken } from 'applications/token/type'

import { LiquidityPoolJsonInfo as LiquidityJsonInfo } from 'liquidity/type'
import { SDKParsedLiquidityInfo } from 'applications/liquidity/type'
import sdkParseJsonLiquidityInfo from 'applications/liquidity/sdkParseJsonLiquidityInfo'
import { CurrencyAmount } from 'entity/amount'
import { Numberish } from 'types/constants'
import { Price } from 'entity/price'
import { RouteInfo, RouteType } from 'trade'
import { PublicKeyish } from 'common/pubkey'
import { WSOLMint } from 'applications/token/utils/quantumSOL'
import {
  RAYMint,
  USDCMint,
  mSOLMint,
  PAIMint,
  stSOLMint,
  USDHMint,
  USDTMint,
} from 'applications/token/utils/wellknownToken.config'
import toPubString from 'functions/toMintString'
import { gte } from 'functions/numberish/compare'
import { div } from 'functions/numberish/operations'
import { toDataMint } from 'applications/token/utils/quantumSOL'
import { HydratedLiquidityInfo } from 'applications/liquidity/type'

export type ZapStore = {
  //   directionReversed: boolean // determine pairSide  swap make this to be true

  // too tedius
  // /** start with `query` means temp info (may be it will be abandon by data parse)*/
  // queryCoin1Mint?: string
  // queryCoin2Mint?: string
  // queryAmmId?: string

  coin1?: SplToken
  coin2?: SplToken
  coinSwapSrcAmount?: Numberish // Numberish // may with fee and slippage
  coinSwapDstAmount?: Numberish //Numberish // may with fee and slippage

  coinLiquidityUpAmount?: string // for coin may be not selected yet, so it can't be TokenAmount
  unslippagedCoinUpAmount?: string // for coin may be not selected yet, so it can't be TokenAmount

  coinLiquidityDownAmount?: string // for coin may be not selected yet, so it can't be TokenAmount
  unslippagedCoinDownAmount?: string // for coin may be not selected yet, so it can't be TokenAmount

  jsonInfos: LiquidityJsonInfo[]

  officialIds: Set<LiquidityJsonInfo['id']>
  unOfficialIds: Set<LiquidityJsonInfo['id']>
  /**
   *  additionally add 'SDK parsed data' (BN, PublicKey, etc.)
   */
  sdkParsedInfos: SDKParsedLiquidityInfo[] // auto parse info in {@link useLiquid
  hydratedInfos: HydratedLiquidityInfo[] // auto parse info in {@link useLiquidityAuto}

  findLiquidityInfoByTokenMint: (
    coin1Mint: PublicKeyish | undefined,
    coin2Mint: PublicKeyish | undefined
  ) => Promise<{
    availables: LiquidityJsonInfo[]
    best: LiquidityJsonInfo | undefined
    routeRelated: LiquidityJsonInfo[]
  }>

  /********************** exhibition panel **********************/
  userExhibitionLiquidityIds: string[]

  /********************** main panel (coin pair panel) **********************/
  currentJsonInfo: LiquidityJsonInfo | undefined
  currentSdkParsedInfo: SDKParsedLiquidityInfo | undefined // auto parse info in {@link useLiquidityAuto}
  currentHydratedInfo: HydratedLiquidityInfo | undefined // auto parse info in {@link useLiquidityAuto}

  ammId: string | undefined
  //   hasUISwrapped?: boolean // if user swap coin1 and coin2, this will be true

  //   focusSide: 'coin1' | 'coin2' // make swap fixed (userInput may change this)

  /** only exist when maxSpent is undefined */
  minReceived?: Numberish // min received amount

  /** only exist when minReceived is undefined */
  maxSpent?: Numberish // max received amount

  /** unit: % */
  priceImpact?: Numberish
  executionPrice?: Price | null
  currentPrice?: Price | null // return by SDK, but don't know when to use it
  routes?: RouteInfo[]
  routeType?: RouteType
  fee?: CurrencyAmount[] // by SDK
  swapable?: boolean
  // scrollToInputBox: () => void
  // klineData: {
  //   [marketId: string]: { priceData: number[]; updateTime: number }
  // }

  // just for trigger refresh
  refreshCount: number
  refreshZap: () => void
}

export const useZap = create<ZapStore>((set, get) => ({
  jsonInfos: [],
  officialIds: new Set(),
  unOfficialIds: new Set(),
  sdkParsedInfos: [], // auto parse info in {@link useLiquidityAuto}
  findLiquidityInfoByTokenMint: async (
    coin1Mintlike: PublicKeyish | undefined,
    coin2Mintlike: PublicKeyish | undefined
  ) => {
    const coin1Mint = toDataMint(coin1Mintlike)
    const coin2Mint = toDataMint(coin2Mintlike)

    if (!coin1Mint || !coin2Mint) return { availables: [], best: undefined, routeRelated: [] }
    const mint1 = String(coin1Mint)
    const mint2 = String(coin2Mint)

    const availables = get().jsonInfos.filter(
      (info) =>
        (info.baseMint === mint1 && info.quoteMint === mint2) || (info.baseMint === mint2 && info.quoteMint === mint1)
    )

    /** swap's route transaction middle token  */
    const routeMiddleMints = [
      // USDCMint,
      RAYMint,
      // WSOLMint,
      // mSOLMint,
      // PAIMint,
      // stSOLMint,
      // USDHMint,
      // USDTMint,
    ].map(toPubString)
    const candidateTokenMints = routeMiddleMints.concat([mint1, mint2])
    const onlyRouteMints = routeMiddleMints.filter((routeMint) => ![mint1, mint2].includes(routeMint))
    const routeRelated = get().jsonInfos.filter((info) => {
      const isCandidate = candidateTokenMints.includes(info.baseMint) && candidateTokenMints.includes(info.quoteMint)
      const onlyInRoute = onlyRouteMints.includes(info.baseMint) && onlyRouteMints.includes(info.quoteMint)
      return isCandidate && !onlyInRoute
    })

    const best = await (async () => {
      if (availables.length === 0) return undefined
      if (availables.length === 1) return availables[0]
      const officials = availables.filter((info) => get().officialIds.has(info.id))
      if (officials.length === 1) return officials[0]
      // may be all official pools or all permissionless pools
      const sameLevels = await sdkParseJsonLiquidityInfo(officials.length ? officials : availables)
      // have most lp Supply
      const largest = sameLevels.reduce((acc, curr) => {
        const accIsStable = acc.version === 5
        const currIsStable = curr.version === 5
        if (accIsStable && !currIsStable) return acc
        if (!accIsStable && currIsStable) return curr
        return gte(div(acc.lpSupply, 10 ** acc.lpDecimals), div(curr.lpSupply, 10 ** curr.lpDecimals)) ? acc : curr
      })
      return largest.jsonInfo
    })()

    return { availables, best, routeRelated }
  },
  /**
   * additionally add 'hydrated data' (shorcuts data or customized data)
   */
  hydratedInfos: [], // auto parse info in {@link useLiquidityAuto}
  /********************** exhibition panel **********************/
  userExhibitionLiquidityIds: [],

  /********************** main panel (coin pair panel) **********************/
  currentJsonInfo: undefined,
  currentSdkParsedInfo: undefined, // auto parse info in {@link useLiquidityAuto}
  currentHydratedInfo: undefined, // auto parse info in {@link useLiquidityAuto}

  ammId: '',

  coin1: undefined,

  coin2: undefined,

  // isRemoveDialogOpen: false,
  // isSearchAmmDialogOpen: false,
  removeAmount: '',

  //   directionReversed: false,
  //   focusSide: 'coin1',
  priceImpact: 0.09,
  //   scrollToInputBox: () => {},
  //   klineData: {},
  refreshCount: 0,
  refreshZap: () => {
    set((s) => ({
      refreshCount: s.refreshCount + 1,
    }))
  },
}))
