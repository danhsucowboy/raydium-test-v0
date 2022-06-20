import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { ChevronsDown, Plus } from 'react-feather'
import { WalletNotConnectedError } from '@solana/wallet-adapter-base'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js'
import { useZap } from 'applications/zap/useZap'
import { useSwapAmountCalculator } from 'hooks/useSwapAmountCalculator'
import useInitCoinFiller from 'hooks/useInitCoinFiller'
import { useLpTokenMethodsLoad } from 'hooks/useLpTokenMethodsLoad'
import useTokenListsLoader from 'hooks/useTokenListsLoader'
import useLiquidityInfoLoader from 'applications/liquidity/useLiquidityInfoLoader'
import useConnectionInitialization from 'applications/connection/useConnectionInitialization'
import { useSyncWithSolanaWallet } from 'applications/wallet/feature/useSyncWithSolanaWallet'
import useTokenMintAutoRecord from 'applications/token/feature/useTokenFlaggedMintAutoRecorder'
import txZap from 'applications/zap/txZap'
import { useSlippageTolerenceSyncer } from 'applications/appSettings/initializationHooks'
import useTokenAccountsRefresher from 'applications/wallet/feature/useTokenAccountsRefresher'
import { useWalletAccountChangeListeners } from 'applications/wallet/feature/useWalletAccountChangeListeners'
import useLpTokensLoader from 'applications/token/feature/useLpTokensLoader'
import useLiquidityAmmSelector from 'applications/liquidity/useLiquidityAmmSelector'
import useLiquidityAmountCalculator from 'applications/liquidity/useLiquidityAmountCalculator'
import useAppSettings from 'applications/appSettings/useAppSettings'

const Home: NextPage = (props) => {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [inputCoinAmount, setInputCoinAmount] = useState<number>(0)
  const [coinPredictSwap, setCoinPredictSwap] = useState('RAY')
  const [coinPredictAddLiquidy, setCoinPredictAddLiquidy] = useState('SOL')
  // const [coinUpAmount, setCoinUpAmount] = useState<number>(0)

  const cutRatio = 0.49
  const coin1 = useZap((s) => s.coin1)
  const coin2 = useZap((s) => s.coin2)
  const liquidity_coinUpAmount = useZap((s) => s.coinLiquidityUpAmount)
  const liquidity_coinDownAmount = useZap((s) => s.coinLiquidityDownAmount)
  const swap_coinSrcAmount = useZap((s) => s.coinSwapSrcAmount)
  const swap_coinDstAmount = useZap((s) => s.coinSwapDstAmount)
  const slippageTolerance = useAppSettings((s) => s.slippageTolerance)


  useSlippageTolerenceSyncer()
  useLiquidityInfoLoader()

  /********************** connection **********************/
  useConnectionInitialization()
  /********************** wallet **********************/
  useSyncWithSolanaWallet()
  useTokenAccountsRefresher()
  useWalletAccountChangeListeners()
  // useLpTokenMethodsLoad()
  useTokenListsLoader()
  useLpTokensLoader()
  useTokenMintAutoRecord()
  useInitCoinFiller()
  useSwapAmountCalculator()
  useLiquidityAmmSelector()
  useLiquidityAmountCalculator()

  useEffect(() => {
    if (inputCoinAmount > 0) {
      useZap.setState({
        coinInputAmount: inputCoinAmount,
        coinSwapSrcAmount: inputCoinAmount * cutRatio,
        // coinLiquidityUpAmount: (inputCoinAmount / 2).toString(),
      })
    } else {
      useZap.setState({
        coinInputAmount: 0,
        coinSwapSrcAmount: 0,
        // coinLiquidityUpAmount: '',
      })
    }
  }, [inputCoinAmount])

  return (
    <div className="flex justify-center items-center w-full h-full gap-20">
      <div className="w-5/12 h-3/4 bg-stone-700 rounded-2xl flex flex-col justify-center items-center gap-8 px-10">
        <div id="up" className="w-full flex justify-between items-center gap-4">
          <label className="text-2xl">Zap Input</label>
          <input
            type="number"
            className="border-2 border-slate-200 rounded-md h-12 text-black text-center"
            value={inputCoinAmount}
            onChange={(e) => setInputCoinAmount(Number(e.target.value))}
          />
          <label className="text-2xl">SOL</label>
        </div>
        <div id="up" className="w-full flex justify-between items-center gap-4">
          <label className="text-2xl">{`Swap In (${cutRatio * 100}% Input)`}</label>
          <input
            type="number"
            className="border-2 border-slate-200 rounded-md h-12 text-black text-center bg-white"
            disabled
            value={swap_coinSrcAmount ? swap_coinSrcAmount.toString() : ''}
          />
          <label className="text-2xl">SOL</label>
        </div>
        <ChevronsDown />
        <div id="down" className="w-full flex justify-between items-center gap-4">
          <label className="text-2xl">{`Add Liquidity A (Swap Out)`}</label>
          <input
            type="number"
            className="border-2 border-slate-200 rounded-md h-12 text-black text-center bg-white"
            disabled
            // value={liquidity_coinUpAmount ? liquidity_coinUpAmount : ''}
            value={swap_coinDstAmount ? swap_coinDstAmount.toString() : ''}
          />
          <label className="text-2xl">{coinPredictSwap}</label>
        </div>
        <Plus />
        <div id="down" className="w-full flex justify-between items-center gap-4">
          <label className="text-2xl">{`Add Liquidity B (AmountCalculator Input)`}</label>
          <input
            type="number"
            className="border-2 border-slate-200 rounded-md h-12 text-black text-center bg-white"
            disabled
            value={liquidity_coinUpAmount ? liquidity_coinUpAmount : ''}
            // value={swap_coinDstAmount ? swap_coinDstAmount.toString() : ''}
          />
          <label className="text-2xl">{coinPredictAddLiquidy}</label>
        </div>
        <button className="w-2/3 h-10 mt-4 border-2 border-blue-500 bg-blue-500 rounded-md" onClick={txZap}>
          ZAP
        </button>
      </div>
      <div className="w-4/12 h-1/3 bg-stone-700 rounded-2xl flex flex-col justify-center items-center gap-8 mt-8 mb-8 px-10">
        <label className="text-2xl">RAY/SOL</label>
        <div id="up" className="w-full flex justify-between items-center gap-4">
          <label className="text-2xl">Your Liquidity</label>
          <input
            type="number"
            className="border-2 border-slate-200 rounded-md h-12 text-black text-center bg-white"
            disabled
            value={swap_coinSrcAmount ? swap_coinSrcAmount.toString() : ''}
          />
          <label className="text-2xl">LP</label>
        </div>
        <div id="up" className="w-full flex justify-between items-center gap-4">
          <label className="text-2xl">Slippage Tolerance</label>
          <input
            type="number"
            className="border-2 border-slate-200 rounded-md h-12 text-black text-center bg-white"
            disabled
            value={slippageTolerance ? slippageTolerance.toString() : ''}
          />
          <label className="text-2xl">%</label>
        </div>
      </div>
    </div>
  )
}

export default Home
