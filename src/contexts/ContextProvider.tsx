import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider as ReactUIWalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
//   SolflareWalletAdapter,
//   SolletExtensionWalletAdapter,
//   SolletWalletAdapter,
//   TorusWalletAdapter,
  // LedgerWalletAdapter,
  // SlopeWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { FC, ReactNode, useCallback, useMemo } from 'react'
import { AutoConnectProvider, useAutoConnect } from './AutoConnectProvider'
import { notify } from '../utils/notifications'
import useConnection from 'applications/connection/useConnection'

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { currentEndPoint } = useConnection()
  const { autoConnect } = useAutoConnect()
  const network = WalletAdapterNetwork.Devnet
  //   const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const endpoint = useMemo(() => currentEndPoint?.url ?? clusterApiUrl('devnet'), [currentEndPoint])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    //   new SolflareWalletAdapter(),
    //   new SolletWalletAdapter({ network }),
    //   new SolletExtensionWalletAdapter({ network }),
    //   new TorusWalletAdapter(),
      // new LedgerWalletAdapter(),
      // new SlopeWalletAdapter(),
    ],
    [endpoint]
  )

  const onError = useCallback((error: WalletError) => {
    notify({ type: 'error', message: error.message ? `${error.name}: ${error.message}` : error.name })
    console.error(error)
  }, [])

  return (
    // TODO: updates needed for updating and referencing endpoint: wallet adapter rework
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={autoConnect}>
        <ReactUIWalletModalProvider>{children}</ReactUIWalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export const ContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AutoConnectProvider>
      <WalletContextProvider>{children}</WalletContextProvider>
    </AutoConnectProvider>
  )
}
