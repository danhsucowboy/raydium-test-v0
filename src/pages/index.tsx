import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { ChevronsDown, Plus } from 'react-feather'
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { useSwap } from 'applications/swap/useSwap';
import useLiquidity from 'applications/liquidity/useLiquidity';
import { useSwapAmountCalculator } from 'hooks/useSwapAmountCalculator';

const Home: NextPage = (props) => {
  const {connection} = useConnection()
  const { publicKey, sendTransaction } = useWallet();
  const [inputCoinAmount, setInputCoinAmount] = useState<number>(0)
  const [coinUp, setCoinUp] = useState('SOL')
  const [coinDown, setCoinDown] = useState('RAY')
  // const [coinUpAmount, setCoinUpAmount] = useState<number>(0)
  const liquidity_coinUpAmount = useLiquidity((s) => s.coin1Amount)
  const liquidity_coinDownAmount = useLiquidity((s) => s.coin2Amount)
  // const swap_coinSrcAmount = useSwap((s) => s.coin1Amount)
  // const swap_coinUpAmount = useSwap((s) => s.coin2Amount)

  useSwapAmountCalculator()
  // const [coinDownAmount, setCoinDownAmount] = useState<number>(0)

  // useEffect(() => {
  //   console.log('connection', connection)
  //   console.log('publicKey', publicKey)

  // },[connection, publicKey])

  useEffect(() => {
    if (inputCoinAmount > 0) {
      useLiquidity.setState({
        coin1Amount: (inputCoinAmount / 2).toString()
      })
      useSwap.setState({
        coin1Amount: inputCoinAmount / 2
      })
    }
    else{
      useLiquidity.setState({
        coin1Amount: ''
      })
      useSwap.setState({
        coin1Amount: 0
      })
    }
  }, [inputCoinAmount])

  return (
    <div className="flex justify-center items-start mt-28 w-full h-full">
      <div className="w-1/4 h-2/3 bg-stone-700 rounded-2xl flex flex-col justify-center items-center gap-8">
        <div id="up" className="w-2/3 flex justify-between items-center">
          <label className="mr-4 text-2xl">SOL</label>
          <input
            type="number"
            className="border-2 border-slate-200 rounded-md h-12 text-black text-center"
            value={inputCoinAmount === 0 ? '' : inputCoinAmount}
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
            value={liquidity_coinUpAmount ? liquidity_coinUpAmount : ''}
          />
        </div>
        <Plus />
        <div id="down" className="w-2/3 flex justify-between items-center">
          <label className="mr-4 text-2xl">{coinDown}</label>
          <input
            type="number"
            className="border-2 border-slate-200 rounded-md h-12 text-black text-center bg-white"
            disabled
            value={liquidity_coinDownAmount ? liquidity_coinDownAmount : ''}
          />
        </div>
        <button className="w-2/3 h-10 mt-4 border-2 border-blue-500 bg-blue-500 rounded-md">ZAP</button>
      </div>
    </div>
  )
}

export default Home
