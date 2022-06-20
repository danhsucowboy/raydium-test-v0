import { jsonInfo2PoolKeys } from 'common/convert-json'
import { Liquidity } from 'liquidity'
import { LiquidityPoolJsonInfo } from 'liquidity/type'

import useAppSettings from 'applications/appSettings/useAppSettings'
import { SplToken } from 'applications/token/type'
import { deUIToken, deUITokenAmount, toUITokenAmount } from 'applications/token/utils/quantumSOL'
import { toPercent } from 'functions/format/toPercent'
import { toTokenAmount } from 'functions/format/toTokenAmount'
import { eq } from 'functions/numberish/compare'
import { shakeZero } from '../../functions/numberish/shakeZero'
import useAsyncEffect from 'hooks/useAsyncEffect'
import { HexAddress, Numberish } from 'types/constants'

import { hasSameItems } from 'functions/arrayMethods'
import useConnection from 'applications/connection/useConnection'
import { SDKParsedLiquidityInfo } from './type'
import { useZap } from 'applications/zap/useZap'
import { useEffect } from 'react'
import toPubString from 'functions/toMintString'

/**
 * will auto fresh  liquidity's coin1Amount and coin2Amount with liquidity's jsonInfos and coin1 and coin2
 * @requires {@link useConnection `useConnection`} and {@link useLiquidity `useLiquidity`}
 * delayly refresh
 */
export default function useLiquidityAmountCalculator() {
  const connection = useConnection((s) => s.connection)

  const currentJsonInfo = useZap((s) => s.currentJsonInfo)
  const currentSdkParsedInfo = useZap((s) => s.currentSdkParsedInfo)

  const coin1 = useZap((s) => s.coin1)
  const coin2 = useZap((s) => s.coin2)
  const userCoin1Amount = useZap((s) => s.coinLiquidityUpAmount)
  const userCoin2Amount = useZap((s) => s.coinLiquidityDownAmount)
  const focusSide = 'coin2'//useZap((s) => s.focusSide)
  const refreshCount = useZap((s) => s.refreshCount)

  const slippageTolerance = useAppSettings((s) => s.slippageTolerance)

  useEffect(() => {
    cleanCalcCache()
  }, [refreshCount])

  useAsyncEffect(async () => {
    if (!coin1 || !coin2 || !currentSdkParsedInfo || !currentJsonInfo /* acctually no need, but for ts type gard */)
      return
    if (
      !hasSameItems(
        [toPubString(currentSdkParsedInfo.baseMint), toPubString(currentSdkParsedInfo.quoteMint)],
        [String(coin1.mint), String(coin2.mint)]
      ) ||
      (focusSide === 'coin2' && eq(userCoin2Amount, 0))
    ) {
      // if (focusSide === 'coin1') useZap.setState({ coinLiquidityDownAmount: '', unslippagedCoinDownAmount: '' })
      if (focusSide === 'coin2') useZap.setState({ coinLiquidityUpAmount: '', unslippagedCoinUpAmount: '' })
      return
    }
    try {
      const { amount: pairCoinAmount, unslippagedAmount: unslippagedPairCoinAmount } = await calculatePairTokenAmount({
        coin1,
        userCoin1Amount,
        coin2,
        userCoin2Amount,
        focusSide,
        currentJsonInfo,
        currentSdkParsedInfo,
        slippageTolerance
      })

      // for calculatePairTokenAmount is async, result maybe droped. if that, just stop it
      const resultStillFresh = (() => {
        const { coinLiquidityUpAmount, coinLiquidityDownAmount } = useZap.getState()
        // const currentFocusSideAmount = focusSide === 'coin1' ? coinLiquidityUpAmount : coinLiquidityDownAmount
        const currentFocusSideAmount = coinLiquidityDownAmount
        // const focusSideAmount = focusSide === 'coin1' ? userCoin1Amount : userCoin2Amount
        const focusSideAmount = userCoin2Amount
        return eq(currentFocusSideAmount, focusSideAmount)
      })()
      if (!resultStillFresh) return

      // if (focusSide === 'coin1') {
      //   useZap.setState({ coinLiquidityDownAmount: pairCoinAmount, unslippagedCoinDownAmount: unslippagedPairCoinAmount })
      // } else {
        useZap.setState({ coinLiquidityUpAmount: pairCoinAmount, unslippagedCoinUpAmount: unslippagedPairCoinAmount })
      // }
    } catch (err) {
      console.error('err: ', err)
    }
  }, [
    coin1,
    coin2,
    userCoin1Amount,
    userCoin2Amount,
    focusSide,
    connection,
    // jsonInfos, no need , because sdkParsed changed jsonInfo must change before
    //currentJsonInfo, no need , because sdkParsed changed jsonInfo must change before
    currentSdkParsedInfo,
    slippageTolerance,
    refreshCount
  ])
}

const sdkParsedInfoCache = new Map<HexAddress, SDKParsedLiquidityInfo>()

function cleanCalcCache() {
  sdkParsedInfoCache.clear()
}

async function calculatePairTokenAmount({
  coin1,
  coin2,
  userCoin1Amount,
  userCoin2Amount,
  focusSide,

  slippageTolerance,
  currentJsonInfo: jsonInfo,
  currentSdkParsedInfo: sdkParsedInfo
}: {
  coin1: SplToken
  userCoin1Amount?: Numberish
  coin2: SplToken
  userCoin2Amount?: Numberish
  focusSide: 'coin1' | 'coin2'

  slippageTolerance: Numberish
  currentJsonInfo: LiquidityPoolJsonInfo
  currentSdkParsedInfo: SDKParsedLiquidityInfo
}): Promise<{
  amount: string
  unslippagedAmount: string
}> {
  const inputToken = focusSide === 'coin1' ? coin1 : coin2
  const pairToken = inputToken === coin1 ? coin2 : coin1
  const inputAmount = toTokenAmount(inputToken, focusSide === 'coin1' ? userCoin1Amount : userCoin2Amount, {
    alreadyDecimaled: true
  })
  const { maxAnotherAmount, anotherAmount } = Liquidity.computeAnotherAmount({
    poolKeys: jsonInfo2PoolKeys(jsonInfo),
    poolInfo: sdkParsedInfo,
    amount: deUITokenAmount(inputAmount),
    anotherCurrency: deUIToken(pairToken),
    slippage: toPercent(toPercent(slippageTolerance))
  })

  return {
    amount: shakeZero(toUITokenAmount(maxAnotherAmount).toExact()),
    unslippagedAmount: shakeZero(toUITokenAmount(anotherAmount).toExact())
  }
}
