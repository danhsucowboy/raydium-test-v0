import { GetTokenAccountsByOwnerConfig } from 'common/web3'
import { Spl } from 'spl'
import { SPL_ACCOUNT_LAYOUT } from 'spl/layout'
import { TOKEN_PROGRAM_ID } from 'common/pubkey'
import { Connection, PublicKey } from '@solana/web3.js'

import BN from 'bn.js'

import { ITokenAccount, TokenAccountRawInfo } from '../type'

// const logger = new Logger('nft-ui')

export async function getWalletTokenAccounts({
  connection,
  owner,
  config
}: {
  connection: Connection
  owner: PublicKey
  config?: GetTokenAccountsByOwnerConfig
}): Promise<{ accounts: ITokenAccount[]; rawInfos: TokenAccountRawInfo[] }> {
  const defaultConfig = {}
  const customConfig = { ...defaultConfig, ...config }

  const solReq = connection.getAccountInfo(owner, customConfig.commitment)
  const tokenReq = connection.getTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }, customConfig.commitment)

  const [solResp, tokenResp] = await Promise.all([solReq, tokenReq])

  const accounts: ITokenAccount[] = []
  const rawInfos: TokenAccountRawInfo[] = []

  for (const { pubkey, account } of tokenResp.value) {
    // double check layout length
    if (account.data.length !== SPL_ACCOUNT_LAYOUT.span) {
      throw Error(`invalid token account layout length: ${pubkey.toBase58()}`)
    }

    const rawResult = SPL_ACCOUNT_LAYOUT.decode(account.data)
    const { mint, amount } = rawResult
    const associatedTokenAddress = await Spl.getAssociatedTokenAccount({ mint, owner })

    accounts.push({
      publicKey: pubkey,
      mint,
      isAssociated: associatedTokenAddress.equals(pubkey),
      amount,
      isNative: false
    })
    rawInfos.push({ pubkey, accountInfo: rawResult })
  }

  if (solResp) {
    accounts.push({
      amount: new BN(solResp.lamports),
      isNative: true
    })
  }

  return { accounts, rawInfos }
}
