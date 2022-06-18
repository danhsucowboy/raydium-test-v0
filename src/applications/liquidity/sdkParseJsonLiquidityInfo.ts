import useConnection from 'applications/connection/useConnection'
import { LiquidityPoolJsonInfo as LiquidityJsonInfo } from 'liquidity/type'
import { Liquidity } from '../../liquidity'
import { jsonInfo2PoolKeys } from 'common/convert-json'

import { SDKParsedLiquidityInfo } from './type'
import { Connection } from '@solana/web3.js'

// TODO: cache system
export default async function sdkParseJsonLiquidityInfo(
  liquidityJsonInfos: LiquidityJsonInfo[],
  connection = useConnection.getState().connection
): Promise<SDKParsedLiquidityInfo[]> {
  // console.log('check-2, connection:',connection)
  if (!connection) return []
  if (!liquidityJsonInfos.length) return [] // no jsonInfo
  try {
    const info = await Liquidity.fetchMultipleInfo({ connection, pools: liquidityJsonInfos.map(jsonInfo2PoolKeys) })
    // console.log('info:',info)
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
