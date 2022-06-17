import { useEffect } from 'react'
import toPubString from 'functions/toMintString'
import { PublicKeyish } from 'types/constants'
import useToken from 'applications/token/useToken'
import { SplToken } from 'applications/token/type'
import { SOLUrlMint, QuantumSOLVersionSOL } from 'applications/token/utils/quantumSOL'

export function useLpTokenMethodsLoad() {
  const lpTokens = useToken((s) => s.lpTokens)
  const tokens = useToken((s) => s.tokens)
  //   const userAddedTokens = useToken((s) => s.userAddedTokens)

  /** NOTE -  getToken place 2 */
  useEffect(() => {
    console.log('getToken checkout')
    function getToken(mint: PublicKeyish | undefined, options?: { exact?: boolean }): SplToken | undefined {
      console.log('getToken in function, mint:',String(mint))
      if (String(mint) === SOLUrlMint) {
        return QuantumSOLVersionSOL
      }

      return tokens[String(mint)] ?? lpTokens[toPubString(mint)]
    }
    useToken.setState({ getToken })
  }, [lpTokens])
  const pureTokens = useToken((s) => s.pureTokens)

  useEffect(() => {
    function getPureToken(mint: PublicKeyish | undefined): SplToken | undefined {
      return pureTokens[String(mint)] ?? lpTokens[toPubString(mint)]
    }

    useToken.setState({ getPureToken })
  }, [lpTokens])
}
