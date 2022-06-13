import { useCallback, useEffect } from 'react'
import { useSwap } from 'applications/swap/useSwap'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Keypair, SystemProgram, Transaction, Connection } from '@solana/web3.js'
import { Numberish } from 'types/constants'

export const useSwapAmountCalculator = () => {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const coinUpAmount = useSwap((s) => s.coinSrcAmount)

  useEffect(() => {
    console.log('coinUpAmount', coinUpAmount)
    try {
        // const calcResult = await calculatePairTokenAmount({
        //     upCoin,
        //     upCoinAmount,
        //     downCoin,
        //     downCoinAmount,
        //     connection,
        //     focusSide: focusDirectionSide,
        //     slippageTolerance
        //   })
    } catch (err) {
      console.error(err)
    }
  }, [coinUpAmount, connection, publicKey])
}


async function calculatePairTokenAmount({
    upCoin,
    upCoinAmount,
    downCoin,
    downCoinAmount,
    connection,
    slippageTolerance
  }: {
    upCoin: SplToken
    upCoinAmount: Numberish | undefined
    downCoin: SplToken
    downCoinAmount: Numberish | undefined
    connection: Connection
    slippageTolerance: Numberish
  }): Promise<SwapCalculatorInfo | undefined> {
    const upCoinTokenAmount = toTokenAmount(upCoin, upCoinAmount, { alreadyDecimaled: true })
    const downCoinTokenAmount = toTokenAmount(downCoin, downCoinAmount, { alreadyDecimaled: true })
  
    const { routeRelated: jsonInfos } = await useLiquidity
      .getState()
      .findLiquidityInfoByTokenMint(upCoin.mint, downCoin.mint)
  
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
        poolInfo: sdkParsedInfos[idx]
      }))
  
      const { amountOut, minAmountOut, executionPrice, currentPrice, priceImpact, routes, routeType, fee } =
        Trade.getBestAmountOut({
          pools,
          currencyOut: deUIToken(downCoin),
          amountIn: deUITokenAmount(upCoinTokenAmount),
          slippage: toPercent(slippageTolerance)
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
          minAmountOut: toUITokenAmount(minAmountOut).toExact()
        }
      }
    }
  }
  