import { useEffect } from 'react'

import useToken from 'applications/token/useToken'
import { RAYMint } from 'applications/token/utils/wellknownToken.config'

import { useZap } from 'applications/zap/useZap'
import toPubString from 'functions/toMintString'
import { QuantumSOLVersionSOL } from 'applications/token/utils/quantumSOL'
import { Token } from 'entity/currency'
import { SplToken } from 'applications/token/type'
import { SplTokenJsonInfo } from 'token'
import { PublicKey } from '@solana/web3.js'

const testETHMint = new PublicKey('Eth1111111111111111111111111111111111111112')

export const ETHSpl = Object.assign(
  new Token(
    testETHMint,
    9,
    'ETH',
    'Ethereum',
  ),
  // omit(quantumSOLHydratedTokenJsonInfo, ['mint', 'decimals', 'symbol', 'name'])
) as SplToken


export default function useInitCoinFiller() {
  const getToken = useToken((s) => s.getToken)
  useEffect(() => {
    const { coin1, coin2 } = useZap.getState()

    if (!coin1 && toPubString(coin2?.mint) !== toPubString(QuantumSOLVersionSOL.mint)) {
      useZap.setState({ coin1: QuantumSOLVersionSOL })
    }
    if (!coin2 && toPubString(coin1?.mint) !== toPubString(testETHMint)) {
      // useZap.setState({ coin2: getToken(RAYMint) })
      useZap.setState({ coin2: ETHSpl })
      console.log('coin2 checkout')
    }
  }, [getToken])
}
