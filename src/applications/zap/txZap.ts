import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js'

import assert from 'assert'
import asyncMap from 'functions/asyncMap'
import { toTokenAmount } from 'functions/format/toTokenAmount'
import { gt } from 'functions/numberish/compare'
import { toString } from 'functions/numberish/toString'

import { loadTransaction } from '../txTools/createTransaction'
import handleMultiTx from '../txTools/handleMultiTx'
import useWallet from '../wallet/useWallet'

import { useZap } from './useZap'
import { deUITokenAmount } from '../token/utils/quantumSOL'
import { shakeUndifindedItem } from 'functions/arrayMethods'
import { AmountSide, LiquidityPoolKeysV4 } from 'liquidity'
import { UnsignedTransactionAndSigners } from 'base'
import { TokenAmount } from 'entity/amount'
import { Spl } from 'spl'
import { Token } from 'entity/currency'
import { SplAccount } from 'spl/layout'
import { CurrencyAmount } from 'entity/amount'
import { BigNumberish, parseBigNumberish } from 'entity/bignumber'
import { struct, u64, u8 } from 'marshmallow'
import {
  AccountMeta,
  AccountMetaReadonly,
  TOKEN_PROGRAM_ID,
} from 'common/pubkey'
interface TokenAccount {
  pubkey: PublicKey
  accountInfo: SplAccount
}
interface SelectTokenAccountParams {
  tokenAccounts: TokenAccount[]
  mint: PublicKey
  owner: PublicKey
  config?: { associatedOnly?: boolean }
}

export interface SwapFixedOutInstructionParams {
  poolKeys: LiquidityPoolKeysV4
  userKeys: {
    tokenAccountIn: PublicKey
    tokenAccountOut: PublicKey
    owner: PublicKey
  }
  // maximum amount in
  maxAmountIn: BigNumberish
  minAmountOut: BigNumberish
}

export interface LiquidityAddInstructionParams {
  poolKeys: LiquidityPoolKeysV4
  userKeys: {
    baseTokenAccount: PublicKey
    quoteTokenAccount: PublicKey
    lpTokenAccount: PublicKey
    owner: PublicKey
  }
  baseAmountIn: BigNumberish
  quoteAmountIn: BigNumberish
  fixedSide: AmountSide
}

const getTokenSide = (token: Token, poolKeys: LiquidityPoolKeysV4): AmountSide => {
  const { baseMint, quoteMint } = poolKeys

  if (token.mint.equals(baseMint)) return 'base'
  else if (token.mint.equals(quoteMint)) return 'quote'
  else
    throw Error(
      `token not match with pool: ${{
        token: token.mint,
        baseMint,
        quoteMint,
      }}`
    )
}

const getTokensSide = (tokenA: Token, tokenB: Token, poolKeys: LiquidityPoolKeysV4): AmountSide[] => {
  const sideA = getTokenSide(tokenA, poolKeys)
  const sideB = getTokenSide(tokenB, poolKeys)

  return [sideA, sideB]
}

const getAmountsSide = (
  amountA: CurrencyAmount | TokenAmount,
  amountB: CurrencyAmount | TokenAmount,
  poolKeys: LiquidityPoolKeysV4
): AmountSide[] => {
  const tokenA = amountA instanceof TokenAmount ? amountA.token : Token.WSOL
  const tokenB = amountB instanceof TokenAmount ? amountB.token : Token.WSOL
  return getTokensSide(tokenA, tokenB, poolKeys)
}

const selectTokenAccount = async (params: SelectTokenAccountParams) => {
  const { tokenAccounts, mint, owner, config } = params

  const { associatedOnly } = {
    // default
    ...{ associatedOnly: true },
    // custom
    ...config,
  }

  const _tokenAccounts = tokenAccounts
    // filter by mint
    .filter(({ accountInfo }) => accountInfo.mint.equals(mint))
    // sort by balance
    .sort((a, b) => (a.accountInfo.amount.lt(b.accountInfo.amount) ? 1 : -1))

  const ata = await Spl.getAssociatedTokenAccount({ mint, owner })

  for (const tokenAccount of _tokenAccounts) {
    const { pubkey } = tokenAccount

    if (associatedOnly) {
      // return ata only
      if (ata.equals(pubkey)) return pubkey
    } else {
      // return the first account
      return pubkey
    }
  }

  return null
}

function makeSwapFixedInInstruction(
  { poolKeys, userKeys, maxAmountIn, minAmountOut }: SwapFixedOutInstructionParams,
  version: number
) {
  const LAYOUT = struct([u8('instruction'), u64('amountIn'), u64('minAmountOut')])
  const data = Buffer.alloc(LAYOUT.span)
  LAYOUT.encode(
    {
      instruction: 9,
      amountIn: parseBigNumberish(maxAmountIn),
      minAmountOut: parseBigNumberish(minAmountOut),
    },
    data
  )

  const keys = [
    // system
    AccountMetaReadonly(TOKEN_PROGRAM_ID, false),
    // amm
    AccountMeta(poolKeys.id, false),
    AccountMetaReadonly(poolKeys.authority, false),
    AccountMeta(poolKeys.openOrders, false),
  ]

  if (version === 4) {
    keys.push(AccountMeta(poolKeys.targetOrders, false))
  }

  keys.push(AccountMeta(poolKeys.baseVault, false), AccountMeta(poolKeys.quoteVault, false))

  keys.push(
    // serum
    AccountMetaReadonly(poolKeys.marketProgramId, false),
    AccountMeta(poolKeys.marketId, false),
    AccountMeta(poolKeys.marketBids, false),
    AccountMeta(poolKeys.marketAsks, false),
    AccountMeta(poolKeys.marketEventQueue, false),
    AccountMeta(poolKeys.marketBaseVault, false),
    AccountMeta(poolKeys.marketQuoteVault, false),
    AccountMetaReadonly(poolKeys.marketAuthority, false),
    // user
    AccountMeta(userKeys.tokenAccountIn, false),
    AccountMeta(userKeys.tokenAccountOut, false),
    AccountMetaReadonly(userKeys.owner, true)
  )

  return new TransactionInstruction({
    programId: poolKeys.programId,
    keys,
    data,
  })
}

function makeAddLiquidityInstruction(params: LiquidityAddInstructionParams) {
  const { poolKeys, userKeys, baseAmountIn, quoteAmountIn, fixedSide } = params
  const { version } = poolKeys

  if (version === 4 || version === 5) {
    const LAYOUT = struct([u8('instruction'), u64('baseAmountIn'), u64('quoteAmountIn'), u64('fixedSide')])
    const data = Buffer.alloc(LAYOUT.span)
    LAYOUT.encode(
      {
        instruction: 3,
        baseAmountIn: parseBigNumberish(baseAmountIn),
        quoteAmountIn: parseBigNumberish(quoteAmountIn),
        fixedSide: parseBigNumberish(fixedSide === 'base' ? 0 : 1),
      },
      data
    )

    const keys = [
      // system
      AccountMetaReadonly(TOKEN_PROGRAM_ID, false),
      // amm
      AccountMeta(poolKeys.id, false),
      AccountMetaReadonly(poolKeys.authority, false),
      AccountMetaReadonly(poolKeys.openOrders, false),
      AccountMeta(poolKeys.targetOrders, false),
      AccountMeta(poolKeys.lpMint, false),
      AccountMeta(poolKeys.baseVault, false),
      AccountMeta(poolKeys.quoteVault, false),
    ]

    keys.push(
      // serum
      AccountMetaReadonly(poolKeys.marketId, false),
      // user
      AccountMeta(userKeys.baseTokenAccount, false),
      AccountMeta(userKeys.quoteTokenAccount, false),
      AccountMeta(userKeys.lpTokenAccount, false),
      AccountMetaReadonly(userKeys.owner, true)
    )

    return new TransactionInstruction({
      programId: poolKeys.programId,
      keys,
      data,
    })
  }
  throw Error(`invalid version: ${version}`)
}

export default function txZap() {
  return handleMultiTx(async ({ transactionCollector, baseUtils: { connection, owner } }) => {
    const { checkWalletHasEnoughBalance, tokenAccountRawInfos } = useWallet.getState()
    const {
      coin1,
      coin2,
      coinInputAmount,
      coinSwapSrcAmount,
      coinSwapDstAmount,
      coinLiquidityUpAmount,
      routes,
      routeType,
      minReceived,
      maxSpent,
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

    //zap input
    const inputCoinTokenAmount = toTokenAmount(upCoin, coinInputAmount, { alreadyDecimaled: true })

    //swap
    const upCoinTokenAmount = toTokenAmount(upCoin, upCoinAmount, { alreadyDecimaled: true })
    const downCoinTokenAmount = toTokenAmount(downCoin, minReceived, { alreadyDecimaled: true })

    //add liquidity
    const liquidity_coin1TokenAmount = toTokenAmount(coin1, coinLiquidityUpAmount, { alreadyDecimaled: true })

    assert(routeType, 'accidently routeType is undefined')

    let setupTransaction: UnsignedTransactionAndSigners | null = null
    let tradeTransaction: UnsignedTransactionAndSigners | null = null

    const addLiquidity_fixedSide = 'b'
    const addLiquidity_amountInA = deUITokenAmount(liquidity_coin1TokenAmount)
    const { lpMint } = routes[0].keys
    const payer = owner

    const swap_tokenIn = upCoinTokenAmount.token
    const swap_tokenOut = downCoinTokenAmount.token
    const addLiquidity_tokenA = liquidity_coin1TokenAmount.token
    const addLiquidity_tokenB = swap_tokenOut

    const swap_tokenAccountIn = await selectTokenAccount({
      tokenAccounts: tokenAccountRawInfos,
      mint: swap_tokenIn.mint,
      owner,
      config: { associatedOnly: false },
    })
    const swap_tokenAccountOut = await selectTokenAccount({
      tokenAccounts: tokenAccountRawInfos,
      mint: swap_tokenOut.mint,
      owner,
    })
    const addLiquidity_tokenAccountA = await selectTokenAccount({
      tokenAccounts: tokenAccountRawInfos,
      mint: addLiquidity_tokenA.mint,
      owner,
      config: { associatedOnly: false },
    })
    const addLiquidity_tokenAccountB = await selectTokenAccount({
      tokenAccounts: tokenAccountRawInfos,
      mint: swap_tokenOut.mint,
      owner,
      config: { associatedOnly: false },
    })
    const lpTokenAccount = await selectTokenAccount({
      tokenAccounts: tokenAccountRawInfos,
      mint: lpMint,
      owner,
    })

    const [amountInRaw, amountOutRaw] = [upCoinTokenAmount.raw, downCoinTokenAmount.raw]
    const tokens = [addLiquidity_tokenA, addLiquidity_tokenB]
    const _tokenAccounts = [addLiquidity_tokenAccountA, addLiquidity_tokenAccountB]
    const rawAmounts = [addLiquidity_amountInA.raw, downCoinTokenAmount.raw]

    // handle amount a & b and direction
    const [sideA] = getAmountsSide(addLiquidity_amountInA, downCoinTokenAmount, routes[0].keys)
    let _fixedSide: AmountSide = 'base'
    if (sideA === 'quote') {
      // reverse
      tokens.reverse()
      _tokenAccounts.reverse()
      rawAmounts.reverse()

      // if (addLiquidity_fixedSide === 'a') _fixedSide = 'quote'
      // else
      if (addLiquidity_fixedSide === 'b') _fixedSide = 'base'
      else throw Error(`invalid fixedSide: ${addLiquidity_fixedSide}`)
    } else if (sideA === 'base') {
      // if (addLiquidity_fixedSide === 'a') _fixedSide = 'base'
      // else
      if (addLiquidity_fixedSide === 'b') _fixedSide = 'quote'
      else throw Error(`invalid fixedSide: ${addLiquidity_fixedSide}`)
    } else throw Error(`invalid fixedSide: ${addLiquidity_fixedSide}`)

    const [baseTokenAccount, quoteTokenAccount] = _tokenAccounts
    const [baseAmountRaw, quoteAmountRaw] = rawAmounts

    const frontInstructions: TransactionInstruction[] = []
    const endInstructions: TransactionInstruction[] = []
    const signers: Signer[] = []
    const _tokenAccountIn = await Spl.insertCreateWrappedNativeAccountInstructions({
      connection,
      owner,
      payer,
      instructions: frontInstructions,
      signers,
      amount: inputCoinTokenAmount.raw, //amountInRaw.add(quoteAmountRaw),
    })
    endInstructions.push(Spl.makeCloseAccountInstruction({ tokenAccount: _tokenAccountIn, owner, payer }))

    frontInstructions.push(
      makeSwapFixedInInstruction(
        {
          poolKeys: routes[0].keys,
          userKeys: {
            tokenAccountIn: _tokenAccountIn,
            tokenAccountOut: swap_tokenAccountOut,
            owner,
          },
          maxAmountIn: amountInRaw,
          minAmountOut: amountOutRaw,
        },
        routes[0].keys.version
      ),
      makeAddLiquidityInstruction({
        poolKeys: routes[0].keys,
        userKeys: {
          baseTokenAccount: baseTokenAccount,
          quoteTokenAccount: _tokenAccountIn,
          lpTokenAccount: lpTokenAccount,
          owner,
        },
        baseAmountIn: baseAmountRaw,
        quoteAmountIn: quoteAmountRaw,
        fixedSide: _fixedSide,
      })
    )

    const transaction = new Transaction()
    transaction.add(...[...frontInstructions, ...endInstructions])

    tradeTransaction = { transaction, signers }

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
