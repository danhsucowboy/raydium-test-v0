import { useEffect } from 'react'

import useToken from 'applications/token/useToken'
import { RAYMint } from 'applications/token/utils/wellknownToken.config'

import { useSwap } from 'applications/swap/useSwap'
import toPubString from 'functions/toMintString'
import { QuantumSOLVersionSOL } from 'applications/token/utils/quantumSOL'

export default function useSwapInitCoinFiller() {
  const getToken = useToken((s) => s.getToken)
  useEffect(() => {
    const { coin1, coin2 } = useSwap.getState()
    if (!coin1 && toPubString(coin2?.mint) !== toPubString(QuantumSOLVersionSOL.mint)) {
      useSwap.setState({ coin1: QuantumSOLVersionSOL })
    }
    if (!coin2 && toPubString(coin1?.mint) !== toPubString(RAYMint)) {
      useSwap.setState({ coin2: getToken(RAYMint) })
    }
  }, [getToken])
}
