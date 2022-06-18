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

export default function txSwap() {
  return handleMultiTx(async ({ transactionCollector, baseUtils: { connection, owner } }) => {
    const { checkWalletHasEnoughBalance, tokenAccountRawInfos } = useWallet.getState()
    const {
      coin1,
      coin2,
      coinSwapSrcAmount,
      coinSwapDstAmount,
      routes,
      // focusSide,
      routeType,
      // directionReversed,
      minReceived,
      maxSpent
    } = useZap.getState()

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

    // assert(checkWalletHasEnoughBalance(upCoinTokenAmount), `not enough ${upCoin.symbol}`)

    assert(routeType, 'accidently routeType is undefined')
    const { setupTransaction, tradeTransaction } = await Trade.makeTradeTransaction({
      connection,
      routes,
      routeType,
      fixedSide: 'in', // TODO: currently  only fixed in
      userKeys: { tokenAccounts: tokenAccountRawInfos, owner },
      amountIn: deUITokenAmount(upCoinTokenAmount), // TODO: currently  only fixed upper side
      amountOut: deUITokenAmount(toTokenAmount(downCoin, minReceived, { alreadyDecimaled: true }))
    })

    console.log('setupTransaction',setupTransaction)
    console.log('tradeTransaction',tradeTransaction)

    // console.log('trade check')
    const signedTransactions = shakeUndifindedItem(
      await asyncMap([setupTransaction, tradeTransaction], (merged) => {
        if (!merged) return
        const { transaction, signers } = merged
        return loadTransaction({ transaction: transaction, signers })
      })
    )
    // console.log('trade check 2')

    for (const signedTransaction of signedTransactions) {
      transactionCollector.add(signedTransaction, {
        txHistoryInfo: {
          title: 'Swap',
          description: `Swap ${toString(upCoinAmount)} ${upCoin.symbol} to ${toString(minReceived || maxSpent)} ${
            downCoin.symbol
          }`
        }
      })
    }
    // console.log('trade check 3')

  })
}