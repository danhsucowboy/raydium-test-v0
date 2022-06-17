import { useRouter } from 'next/router'

import { jsonInfo2PoolKeys } from 'common/convert-json'
import { Liquidity } from 'liquidity'
import { Trade } from 'trade'
import { Connection } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'

import { shakeUndifindedItem } from 'functions/arrayMethods'
import toPubString from 'functions/toMintString'
import { toPercent } from 'functions/format/toPercent'
import { toTokenAmount } from 'functions/format/toTokenAmount'
import useAsyncEffect from './useAsyncEffect'
import { HexAddress, Numberish } from 'types/constants'

import useAppSettings from 'applications/appSettings/useAppSettings'
// import useConnection from '../connection/useConnection'
import { SDKParsedLiquidityInfo } from 'applications/liquidity/type'
// import useLiquidity from '../liquidity/useLiquidity'
import sdkParseJsonLiquidityInfo from 'applications/liquidity/sdkParseJsonLiquidityInfo'
import { SplToken } from 'applications/token/type'
import { deUIToken, deUITokenAmount, toUITokenAmount } from 'applications/token/utils/quantumSOL'

import { useZap } from 'applications/zap/useZap'
import { useDebugValue, useEffect } from 'react'
import { eq } from 'functions/numberish/compare'

export function useSwapAmountCalculator() {
  const { pathname } = useRouter()

  const { connection } = useConnection()
  const coin1 = useZap((s) => s.coin1)
  const coin2 = useZap((s) => s.coin2)
  const userCoin1Amount = useZap((s) => s.coinSwapSrcAmount)
  const userCoin2Amount = useZap((s) => s.coinSwapDstAmount)
  const refreshCount = useZap((s) => s.refreshCount)
  // const directionReversed = useSwap((s) => s.directionReversed)
  // const focusSide = directionReversed ? 'coin2' : 'coin1' // temporary focus side is always up, due to swap route's `Trade.getBestAmountIn()` is not ready
  const slippageTolerance = useAppSettings((s) => s.slippageTolerance)
  // const connected = useWallet((s) => s.connected)

  /** for swap is always from up to down, up/down is easier to calc */
  const upCoin = coin1
  const upCoinAmount = userCoin1Amount || '0'
  const downCoin = coin2
  const downCoinAmount = userCoin2Amount || '0'

  const jsonInfos = useZap((s) => s.jsonInfos)
  useEffect(() => {
    cleanCalcCache()
  }, [refreshCount])

  // if don't check focusSideCoin, it will calc twice.
  // one for coin1Amount then it will change coin2Amount
  // changing coin2Amount will cause another calc
  useAsyncEffect(async () => {
    // pairInfo is not enough
    if (!upCoin || !downCoin || !connection) {
      console.log('check pairInfo is not enough')
      useZap.setState({
        fee: undefined,
        minReceived: undefined,
        maxSpent: undefined,
        routes: undefined,
        priceImpact: undefined,
        executionPrice: undefined,
        ...{ ['coinSwapDstAmount']: undefined },
      })
      return
    }

    console.log('upCoin: ', upCoin)
    console.log('downCoin: ', downCoin)
    console.log('connection: ', connection)

    const focusDirectionSide = 'up'

    try {
      const calcResult = await calculatePairTokenAmount({
        upCoin,
        upCoinAmount,
        downCoin,
        downCoinAmount,
        connection,
        focusSide: focusDirectionSide,
        slippageTolerance,
      })
      // for calculatePairTokenAmount is async, result maybe droped. if that, just stop it
      const resultStillFresh = (() => {
        const currentUpCoinAmount = useZap.getState().coinSwapSrcAmount || '0'
        const currentDownCoinAmount = useZap.getState().coinSwapDstAmount || '0'
        const currentFocusSideAmount = focusDirectionSide === 'up' ? currentUpCoinAmount : currentDownCoinAmount
        const focusSideAmount = focusDirectionSide === 'up' ? upCoinAmount : downCoinAmount
        return eq(currentFocusSideAmount, focusSideAmount)
      })()
      if (!resultStillFresh) return

      if (focusDirectionSide === 'up') {
        const { routes, priceImpact, executionPrice, currentPrice, swapable, routeType, fee } = calcResult ?? {}
        const { amountOut, minAmountOut } = (calcResult?.info ?? {}) as { amountOut?: string; minAmountOut?: string }
        useZap.setState({
          fee,
          routes,
          priceImpact,
          executionPrice,
          currentPrice,
          minReceived: minAmountOut,
          maxSpent: undefined,
          swapable,
          routeType,
          ...{ coinSwapDstAmount: amountOut },
        })
      }
      // else {
      //   const { routes, priceImpact, executionPrice, currentPrice, swapable, routeType, fee } = calcResult ?? {}
      //   const { amountIn, maxAmountIn } = (calcResult?.info ?? {}) as { amountIn?: string; maxAmountIn?: string }
      //   useSwap.setState({
      //     fee,
      //     routes,
      //     priceImpact,
      //     executionPrice,
      //     currentPrice,
      //     minReceived: undefined,
      //     maxSpent: maxAmountIn,
      //     swapable,
      //     routeType,
      //     ...{ [focusSide === 'coin1' ? 'coin2Amount' : 'coin1Amount']: amountIn },
      //   })
      // }
    } catch (err) {
      console.error(err)
    }
  }, [
    upCoin,
    downCoin,
    upCoinAmount,
    downCoinAmount,
    slippageTolerance,
    connection,
    pathname,
    refreshCount,
    // connected, // init fetch data
    jsonInfos,
  ])
}

const sdkParsedInfoCache = new Map<HexAddress, SDKParsedLiquidityInfo[]>()

type SwapCalculatorInfo = {
  executionPrice: ReturnType<typeof Trade['getBestAmountOut']>['executionPrice']
  currentPrice: ReturnType<typeof Trade['getBestAmountOut']>['currentPrice']
  priceImpact: ReturnType<typeof Trade['getBestAmountOut']>['priceImpact']
  routes: ReturnType<typeof Trade['getBestAmountOut']>['routes']
  routeType: ReturnType<typeof Trade['getBestAmountOut']>['routeType']
  fee: ReturnType<typeof Trade['getBestAmountOut']>['fee']
  swapable: boolean
  info: { amountOut: string; minAmountOut: string } | { amountIn: string; maxAmountIn: string }
}

function cleanCalcCache() {
  sdkParsedInfoCache.clear()
}

async function calculatePairTokenAmount({
  upCoin,
  upCoinAmount,
  downCoin,
  downCoinAmount,
  focusSide,
  connection,
  slippageTolerance,
}: {
  upCoin: SplToken
  upCoinAmount: Numberish | undefined
  downCoin: SplToken
  downCoinAmount: Numberish | undefined
  focusSide: 'up' | 'down'
  connection: Connection
  slippageTolerance: Numberish
}): Promise<SwapCalculatorInfo | undefined> {
  const upCoinTokenAmount = toTokenAmount(upCoin, upCoinAmount, { alreadyDecimaled: true })
  const downCoinTokenAmount = toTokenAmount(downCoin, downCoinAmount, { alreadyDecimaled: true })

  const { routeRelated: jsonInfos } = await useZap.getState().findLiquidityInfoByTokenMint(upCoin.mint, downCoin.mint)

  if (jsonInfos.length) {
    const key = jsonInfos.map((jsonInfo) => jsonInfo.id).join('-')
    const sdkParsedInfos = sdkParsedInfoCache.has(key)
      ? sdkParsedInfoCache.get(key)!
      : await (async () => {
          const sdkParsed = await sdkParseJsonLiquidityInfo(jsonInfos, connection)
          sdkParsedInfoCache.set(key, sdkParsed)
          return sdkParsed
        })()

    const pools = jsonInfos.map((jsonInfo, idx) => ({
      poolKeys: jsonInfo2PoolKeys(jsonInfo),
      poolInfo: sdkParsedInfos[idx],
    }))

    const { amountOut, minAmountOut, executionPrice, currentPrice, priceImpact, routes, routeType, fee } =
      Trade.getBestAmountOut({
        pools,
        currencyOut: deUIToken(downCoin),
        amountIn: deUITokenAmount(upCoinTokenAmount),
        slippage: toPercent(slippageTolerance),
      })
    // console.log('{ amountOut, minAmountOut, executionPrice, currentPrice, priceImpact, routes, routeType, fee }: ', {
    //   amountOut,
    //   minAmountOut,
    //   executionPrice,
    //   currentPrice,
    //   priceImpact,
    //   routes,
    //   routeType,
    //   fee
    // })

    const sdkParsedInfoMap = new Map(sdkParsedInfos.map((info) => [toPubString(info.id), info]))
    const choosedSdkParsedInfos = shakeUndifindedItem(
      routes.map((route) => sdkParsedInfoMap.get(toPubString(route.keys.id)))
    )

    const swapable = choosedSdkParsedInfos.every((info) => Liquidity.getEnabledFeatures(info).swap)
    return {
      executionPrice,
      currentPrice,
      priceImpact,
      routes,
      routeType,
      swapable,
      fee,
      info: {
        amountOut: toUITokenAmount(amountOut).toExact(),
        minAmountOut: toUITokenAmount(minAmountOut).toExact(),
      },
    }
  }
}
