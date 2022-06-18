import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { ChevronsDown, Plus } from 'react-feather'
import { WalletNotConnectedError } from '@solana/wallet-adapter-base'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js'
import { useZap } from 'applications/zap/useZap'
import useLiquidity from 'applications/liquidity/useLiquidity'
import { useSwapAmountCalculator } from 'hooks/useSwapAmountCalculator'
import useInitCoinFiller from 'hooks/useInitCoinFiller'
import { useLpTokenMethodsLoad } from 'hooks/useLpTokenMethodsLoad'
import useTokenListsLoader from 'hooks/useTokenListsLoader'
import { Connection, PublicKey, TokenAmount } from '@solana/web3.js'
import { GetStructureSchema, publicKey, struct, u32, u64, u8 } from '../marshmallow'
import useLiquidityInfoLoader from 'applications/liquidity/useLiquidityInfoLoader'
import useConnectionInitialization from 'applications/connection/useConnectionInitialization'
import { useSyncWithSolanaWallet } from 'applications/wallet/feature/useSyncWithSolanaWallet'
import useTokenMintAutoRecord from 'applications/token/feature/useTokenFlaggedMintAutoRecorder'
import txZap from 'applications/zap/txZap'
import { useSlippageTolerenceSyncer } from 'applications/appSettings/initializationHooks'
import useTokenAccountsRefresher from 'applications/wallet/feature/useTokenAccountsRefresher'
import { useWalletAccountChangeListeners } from 'applications/wallet/feature/useWalletAccountChangeListeners'

const Home: NextPage = (props) => {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [inputCoinAmount, setInputCoinAmount] = useState<number>(0)
  const [coinUp, setCoinUp] = useState('SOL')
  const [coinDown, setCoinDown] = useState('RAY')
  // const [coinUpAmount, setCoinUpAmount] = useState<number>(0)

  const coin1 = useZap((s) => s.coin1)
  const coin2 = useZap((s) => s.coin2)
  const liquidity_coinUpAmount = useZap((s) => s.coinLiquidityUpAmount)
  const liquidity_coinDownAmount = useZap((s) => s.coinLiquidityDownAmount)
  const swap_coinSrcAmount = useZap((s) => s.coinSwapSrcAmount)
  const swap_coinDstAmount = useZap((s) => s.coinSwapDstAmount)

  useSlippageTolerenceSyncer()
  // load liquidity info (jsonInfo, sdkParsedInfo, hydratedInfo)
  useLiquidityInfoLoader()

  /********************** connection **********************/
  useConnectionInitialization()
  /********************** wallet **********************/
  useSyncWithSolanaWallet()
  useTokenAccountsRefresher()
  useWalletAccountChangeListeners()
  // useLpTokenMethodsLoad()
  useTokenListsLoader()
  useTokenMintAutoRecord()
  useInitCoinFiller()
  useSwapAmountCalculator()
  // const [coinDownAmount, setCoinDownAmount] = useState<number>(0)

  // useEffect(() => {
  //   console.log('swap_coinSrcAmount', swap_coinSrcAmount)
  //   console.log('swap_coinDstAmount', swap_coinDstAmount)

  // },[swap_coinSrcAmount, swap_coinDstAmount])

  useEffect(() => {
    if (inputCoinAmount > 0) {
      useZap.setState({
        coinSwapSrcAmount: inputCoinAmount / 2,
        coinLiquidityUpAmount: (inputCoinAmount / 2).toString(),
      })
    } else {
      useZap.setState({
        coinSwapSrcAmount: 0,
        coinLiquidityUpAmount: '',
      })
    }
  }, [inputCoinAmount])

  // const handleZap = async () => {
  //   const tokenIn = coin1
  //   const tokenOut = coin2
  // }

  return (
    <div className="flex justify-center items-start mt-28 w-full h-full">
      <div className="w-1/4 h-2/3 bg-stone-700 rounded-2xl flex flex-col justify-center items-center gap-8">
        <div id="up" className="w-2/3 flex justify-between items-center">
          <label className="mr-4 text-2xl">SOL</label>
          <input
            type="number"
            // pattern="[-+]?[0-9]*[.,]?[0-9]+"
            className="border-2 border-slate-200 rounded-md h-12 text-black text-center"
            // value={inputCoinAmount === 0 ? '' : inputCoinAmount}
            value={inputCoinAmount}
            onChange={(e) => setInputCoinAmount(Number(e.target.value))}
          />
        </div>
        <ChevronsDown />
        <div id="down" className="w-2/3 flex justify-between items-center">
          <label className="mr-4 text-2xl">{coinUp}</label>
          <input
            type="number"
            className="border-2 border-slate-200 rounded-md h-12 text-black text-center bg-white"
            disabled
            // value={liquidity_coinUpAmount ? liquidity_coinUpAmount : ''}
            value={swap_coinSrcAmount ? swap_coinSrcAmount.toString() : ''}
          />
        </div>
        <Plus />
        <div id="down" className="w-2/3 flex justify-between items-center">
          <label className="mr-4 text-2xl">{coinDown}</label>
          <input
            type="number"
            className="border-2 border-slate-200 rounded-md h-12 text-black text-center bg-white"
            disabled
            // value={liquidity_coinDownAmount ? liquidity_coinDownAmount : ''}
            value={swap_coinDstAmount ? swap_coinDstAmount.toString() : ''}
          />
        </div>
        <button className="w-2/3 h-10 mt-4 border-2 border-blue-500 bg-blue-500 rounded-md" onClick={txZap}>
          ZAP
        </button>
      </div>
    </div>
  )
}

export default Home
