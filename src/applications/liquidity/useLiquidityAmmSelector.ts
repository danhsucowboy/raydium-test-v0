import { useEffect } from 'react'

import useToken from 'applications/token/useToken'
import { isMintEqual } from 'functions/judgers/areEqual'
import useAsyncEffect from 'hooks/useAsyncEffect'

import { useZap } from 'applications/zap/useZap'

/** coin1 coin2 ammId */
export default function useLiquidityAmmSelector() {
  const coin1 = useZap((s) => s.coin1)
  const coin2 = useZap((s) => s.coin2)
  const ammId = useZap((s) => s.ammId)
  const currentJsonInfo = useZap((s) => s.currentJsonInfo)

  /** update `coin1` and `coin2` (to match `ammId`) */
  useEffect(() => {
    if (!ammId) return
    const { coin1, coin2, jsonInfos } = useZap.getState()
    const targetInfo = jsonInfos.find((info) => info.id === ammId)
    // current is right, no need to sync again
    if (isMintEqual(coin1?.mint, targetInfo?.baseMint) && isMintEqual(coin2?.mint, targetInfo?.quoteMint)) return
    if (isMintEqual(coin1?.mint, targetInfo?.quoteMint) && isMintEqual(coin2?.mint, targetInfo?.baseMint)) return

    const { getToken } = useToken.getState()
    const baseCoin = getToken(jsonInfos.find((i) => i.id === ammId)?.baseMint)
    const quoteCoin = getToken(jsonInfos.find((i) => i.id === ammId)?.quoteMint)

    useZap.setState({
      coin1: baseCoin,
      coin2: quoteCoin
    })
  }, [ammId])

  /** update `ammId` (to match `coin1` and `coin2`) */
  useAsyncEffect(async () => {
    const { findLiquidityInfoByTokenMint, ammId } = useZap.getState()

    const computeResult = await findLiquidityInfoByTokenMint(coin1?.mint, coin2?.mint)
    const resultPool = computeResult.best
    if (resultPool) {
      // current is right, no need to sync again
      if (ammId === resultPool?.id) return

      useZap.setState({
        ammId: resultPool?.id,
        currentJsonInfo: resultPool
      })
    } else {
      // should clear ammId and currentJsonInfo
      useZap.setState({
        ammId: undefined,
        currentJsonInfo: undefined
      })
    }
  }, [coin1, coin2])

  // update `currentJsonInfo` (to match `ammId`)
  useEffect(() => {
    const { jsonInfos, currentJsonInfo } = useZap.getState()

    const alreadyMatched = currentJsonInfo?.id === ammId
    if (alreadyMatched) return

    const matchedInfo = jsonInfos.find((i) => i.id === ammId)
    useZap.setState({ currentJsonInfo: matchedInfo })
  }, [ammId])

  // update `ammId` (to match `currentJsonInfo`)
  useEffect(() => {
    const { ammId: currentAmmId } = useZap.getState()

    const alreadyMatched = currentJsonInfo?.id === currentAmmId
    if (alreadyMatched) return

    const ammId = currentJsonInfo?.id
    useZap.setState({ ammId })
  }, [currentJsonInfo])
}
