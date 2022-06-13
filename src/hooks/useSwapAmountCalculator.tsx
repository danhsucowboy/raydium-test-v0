import { useCallback, useEffect } from "react"
import { useSwap } from "applications/swap/useSwap"

export const useSwapAmountCalculator = () =>{
  const coinUpAmount = useSwap((s) => s.coin1Amount)

  useEffect(() => {
    console.log('coinUpAmount',coinUpAmount)
  }, [coinUpAmount])
}

