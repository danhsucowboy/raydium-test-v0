import { Signer, Transaction, TransactionInstruction } from '@solana/web3.js'

import { attachRecentBlockhash } from './attachRecentBlockhash'

export const loadTransaction = async (payload: { transaction: Transaction; signers?: Signer[] }) => {
  const { transaction, signers } = payload
  console.log('trade check 1-2')
  const signedTransaction = await partialSignTransacion(transaction, signers)
  console.log('trade check 1-3')
  return signedTransaction
}

export type TransactionPiecesCollector = {
  setRawTransaction: (rawTransaction: Transaction) => void
  addInstruction: (...instructions: TransactionInstruction[]) => void
  addEndInstruction: (...instructions: TransactionInstruction[]) => void
  addSigner: (...signers: Signer[]) => void
  spawnTransaction: () => Promise<Transaction>
}

export const createTransactionCollector = (defaultRawTransaction?: Transaction): TransactionPiecesCollector => {
  let innerTransaction: Transaction | null = null
  const innerSigners = [] as Signer[]

  const frontInstructions: TransactionInstruction[] = []
  const endInstructions: TransactionInstruction[] = []

  const collector: TransactionPiecesCollector = {
    setRawTransaction(rawTransaction: Transaction) {
      innerTransaction = rawTransaction
    },
    addInstruction(...instructions: TransactionInstruction[]) {
      frontInstructions.push(...instructions)
    },
    addEndInstruction(...instructions: TransactionInstruction[]) {
      endInstructions.push(...instructions)
    },
    addSigner(...signers: Signer[]) {
      innerSigners.push(...signers)
    },
    async spawnTransaction(): Promise<Transaction> {
      const rawTransaction = innerTransaction || (defaultRawTransaction ?? new Transaction())
      if (frontInstructions.length || endInstructions.length) {
        rawTransaction.add(...frontInstructions, ...endInstructions.reverse())
      }
      return partialSignTransacion(rawTransaction, innerSigners)
    },
  }

  return collector
}

const partialSignTransacion = async (transaction: Transaction, signers?: Signer[]): Promise<Transaction> => {
  if (signers?.length) {
    console.log('trade check 1-2-1')
    await attachRecentBlockhash(transaction)
    console.log('trade check 1-2-2',signers)
    console.log('trade check 1-2-2',transaction)

    transaction.partialSign(...signers)
    console.log('trade check 1-2-3')

    return transaction
  }
  return transaction
}
