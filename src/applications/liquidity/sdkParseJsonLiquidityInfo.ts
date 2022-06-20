import useConnection from 'applications/connection/useConnection'
import { LiquidityPoolJsonInfo as LiquidityJsonInfo } from 'liquidity/type'
import { Liquidity } from '../../liquidity'
import { jsonInfo2PoolKeys } from 'common/convert-json'

import { SDKParsedLiquidityInfo } from './type'

// TODO: cache system
export default async function sdkParseJsonLiquidityInfo(
  liquidityJsonInfos: LiquidityJsonInfo[],
  connection = useConnection.getState().connection
): Promise<SDKParsedLiquidityInfo[]> {
  if (!connection) return []
  if (!liquidityJsonInfos.length) return [] // no jsonInfo
  try {
    const info = await Liquidity.fetchMultipleInfo({ connection, pools: liquidityJsonInfos.map(jsonInfo2PoolKeys) })
    const result = info.map((sdkParsed, idx) => ({
      jsonInfo: liquidityJsonInfos[idx],
      ...jsonInfo2PoolKeys(liquidityJsonInfos[idx]),
      ...sdkParsed,
    }))
    return result
  } catch (err) {
    console.error(err)
    return []
  }
}
