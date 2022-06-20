import { Trade } from 'trade'

import assert from 'assert'
import asyncMap from 'functions/asyncMap'
import { toTokenAmount } from 'functions/format/toTokenAmount'
import { gt } from 'functions/numberish/compare'
import { toString } from 'functions/numberish/toString'

import { loadTransaction } from '../txTools/createTransaction'
import handleMultiTx from '../txTools/handleMultiTx'
import useWallet from '../wallet/useWallet'

import { useZap } from './useZap'
import { deUITokenAmount, toUITokenAmount } from '../token/utils/quantumSOL'
import { shakeUndifindedItem } from 'functions/arrayMethods'

export default function txZap() {
  return handleMultiTx(async ({ transactionCollector, baseUtils: { connection, owner } }) => {
    const { checkWalletHasEnoughBalance, tokenAccountRawInfos } = useWallet.getState()
    const {
      coin1,
      coin2,
      coinSwapSrcAmount,
      coinSwapDstAmount,
      coinLiquidityUpAmount,
      coinLiquidityDownAmount,
      routes,
      // focusSide,
      routeType,
      // directionReversed,
      minReceived,
      maxSpent,
      jsonInfos,
      currentJsonInfo,
    } = useZap.getState()

    //swap

    const upCoin = coin1
    // although info is included in routes, still need upCoinAmount to pop friendly feedback
    const upCoinAmount = coinSwapSrcAmount || '0'

    const downCoin = coin2
    // although info is included in routes, still need downCoinAmount to pop friendly feedback
    const downCoinAmount = coinSwapDstAmount || '0'

    assert(upCoinAmount && gt(upCoinAmount, 0), 'should input upCoin amount larger than 0')
    assert(downCoinAmount && gt(downCoinAmount, 0), 'should input downCoin amount larger than 0')
    assert(upCoin, 'select a coin in upper box')
    assert(downCoin, 'select a coin in lower box')
    assert(String(upCoin.mint) !== String(downCoin.mint), 'should not select same mint ')
    assert(routes, "can't find correct route")

    const upCoinTokenAmount = toTokenAmount(upCoin, upCoinAmount, { alreadyDecimaled: true })
    const downCoinTokenAmount = toTokenAmount(downCoin, downCoinAmount, { alreadyDecimaled: true })

    //add liquidity
    const targetJsonInfo = currentJsonInfo
    const liquidity_coinTokenAmount = toTokenAmount(coin1, coinLiquidityUpAmount, { alreadyDecimaled: true })
    const liquidity_coin2TokenAmount = toTokenAmount(coin2, downCoinAmount, { alreadyDecimaled: true })
    // assert(checkWalletHasEnoughBalance(upCoinTokenAmount), `not enough ${upCoin.symbol}`)

    assert(routeType, 'accidently routeType is undefined')
    const { setupTransaction, tradeTransaction } = await Trade.makeZapTransaction({
      connection,
      routes,
      routeType,
      swap_fixedSide: 'in', // TODO: currently  only fixed in
      addLiquidity_fixedSide: 'b', // TODO: currently  only fixed in
      userKeys: { tokenAccounts: tokenAccountRawInfos, owner },
      swap_amountIn: deUITokenAmount(upCoinTokenAmount), // TODO: currently  only fixed upper side
      swap_amountOut: deUITokenAmount(toTokenAmount(downCoin, minReceived, { alreadyDecimaled: true })),
      addLiquidity_amountInA: deUITokenAmount(liquidity_coinTokenAmount),
    })

    const signedTransactions = shakeUndifindedItem(
      await asyncMap([setupTransaction, tradeTransaction], (merged) => {
        if (!merged) return
        const { transaction, signers } = merged
        return loadTransaction({ transaction: transaction, signers })
      })
    )

    for (const signedTransaction of signedTransactions) {
      transactionCollector.add(signedTransaction, {
        txHistoryInfo: {
          title: 'Swap',
          description: `Swap ${toString(upCoinAmount)} ${upCoin.symbol} to ${toString(minReceived || maxSpent)} ${
            downCoin.symbol
          }`,
        },
      })
    }
  })
}
