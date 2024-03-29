import { Token as _Token, u64 as _u64 } from '@solana/spl-token'
import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js'
import BN from 'bn.js'

import { validateAndParsePublicKey } from 'common/pubkey'
import { TOKEN_PROGRAM_ID } from 'common/pubkey'
import { ASSOCIATED_TOKEN_PROGRAM_ID } from 'common/pubkey'
import { BigNumberish, parseBigNumberish } from 'entity/bignumber'
import { u64 } from '../marshmallow'

import { SPL_ACCOUNT_LAYOUT } from './layout'
import { WSOL } from 'token'

// https://github.com/solana-labs/solana-program-library/tree/master/token/js/client
export class Spl {
  static getAssociatedTokenAccount({ mint, owner }: { mint: PublicKey; owner: PublicKey }) {
    return _Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, owner, true)
  }

  static async makeCreateWrappedNativeAccountInstructionsTest({
    connection,
    owner,
    payer,
    amount,
    // baseRentExemption,
    commitment,
  }: {
    connection: Connection
    owner: PublicKey
    payer: PublicKey
    amount: BigNumberish
    // baseRentExemption?: number;
    commitment?: Commitment
  }) {
    const instructions: TransactionInstruction[] = []

    // Allocate memory for the account
    // baseRentExemption = getMinimumBalanceForRentExemption size is 0
    // -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0", "id":1, "method":"getMinimumBalanceForRentExemption", "params":[0]}'
    // baseRentExemption = perByteRentExemption * 128
    // balanceNeeded = baseRentExemption / 128 * (dataSize + 128)
    const balanceNeeded = await connection.getMinimumBalanceForRentExemption(SPL_ACCOUNT_LAYOUT.span, commitment)

    // Create a new account
    const lamports = parseBigNumberish(amount).add(new BN(balanceNeeded))
    const newAccount = Keypair.generate()
    // instructions.push(
    //   SystemProgram.createAccount({
    //     fromPubkey: payer,
    //     newAccountPubkey: newAccount.publicKey,
    //     lamports: lamports.toNumber(),
    //     space: SPL_ACCOUNT_LAYOUT.span,
    //     programId: TOKEN_PROGRAM_ID,
    //   })
    // )

    // * merge this instruction into SystemProgram.createAccount
    // * will save transaction size ~17(441-424) bytes
    // Send lamports to it (these will be wrapped into native tokens by the token program)
    // instructions.push(
    //   SystemProgram.transfer({
    //     fromPubkey: payer,
    //     toPubkey: newAccount.publicKey,
    //     lamports: parseBigNumberish(amount).toNumber(),
    //   }),
    // );

    // Assign the new account to the native token mint.
    // the account will be initialized with a balance equal to the native token balance.
    // (i.e. amount)
    instructions.push(
      this.makeInitAccountInstruction({
        mint: validateAndParsePublicKey(WSOL.mint),
        tokenAccount: newAccount.publicKey,
        owner,
      })
    )

    return { newAccount, instructions }
  }

  static async insertCreateWrappedNativeAccountInstructionsTest({
    connection,
    owner,
    payer,
    amount,
    instructions,
    signers,
    commitment,
  }: {
    connection: Connection
    owner: PublicKey
    payer: PublicKey
    amount: BigNumberish
    instructions: TransactionInstruction[]
    signers: Signer[]
    commitment?: Commitment
  }) {
    const { newAccount, instructions: newInstructions } = await this.makeCreateWrappedNativeAccountInstructionsTest({
      connection,
      owner,
      payer,
      amount,
      commitment,
    })

    instructions.push(...newInstructions)
    signers.push(newAccount)
    // signers.push(newAccount);

    return newAccount.publicKey
  }

  static makeCreateAssociatedTokenAccountInstruction({
    mint,
    associatedAccount,
    owner,
    payer,
  }: {
    mint: PublicKey
    associatedAccount: PublicKey
    owner: PublicKey
    payer: PublicKey
  }) {
    return _Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      associatedAccount,
      owner,
      payer
    )
  }

  // https://github.com/solana-labs/solana-program-library/blob/master/token/js/client/token.js
  static async makeCreateWrappedNativeAccountInstructions({
    connection,
    owner,
    payer,
    amount,
    // baseRentExemption,
    commitment,
  }: {
    connection: Connection
    owner: PublicKey
    payer: PublicKey
    amount: BigNumberish
    // baseRentExemption?: number;
    commitment?: Commitment
  }) {
    const instructions: TransactionInstruction[] = []

    // Allocate memory for the account
    // baseRentExemption = getMinimumBalanceForRentExemption size is 0
    // -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0", "id":1, "method":"getMinimumBalanceForRentExemption", "params":[0]}'
    // baseRentExemption = perByteRentExemption * 128
    // balanceNeeded = baseRentExemption / 128 * (dataSize + 128)
    const balanceNeeded = await connection.getMinimumBalanceForRentExemption(SPL_ACCOUNT_LAYOUT.span, commitment)

    // Create a new account
    const lamports = parseBigNumberish(amount).add(new BN(balanceNeeded))
    const newAccount = Keypair.generate()
    instructions.push(
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: newAccount.publicKey,
        lamports: lamports.toNumber(),
        space: SPL_ACCOUNT_LAYOUT.span,
        programId: TOKEN_PROGRAM_ID,
      })
    )

    // * merge this instruction into SystemProgram.createAccount
    // * will save transaction size ~17(441-424) bytes
    // Send lamports to it (these will be wrapped into native tokens by the token program)
    // instructions.push(
    //   SystemProgram.transfer({
    //     fromPubkey: payer,
    //     toPubkey: newAccount.publicKey,
    //     lamports: parseBigNumberish(amount).toNumber(),
    //   }),
    // );

    // Assign the new account to the native token mint.
    // the account will be initialized with a balance equal to the native token balance.
    // (i.e. amount)
    instructions.push(
      this.makeInitAccountInstruction({
        mint: validateAndParsePublicKey(WSOL.mint),
        tokenAccount: newAccount.publicKey,
        owner,
      })
    )

    return { newAccount, instructions }
  }

  static async insertCreateWrappedNativeAccountInstructions({
    connection,
    owner,
    payer,
    amount,
    instructions,
    signers,
    commitment,
  }: {
    connection: Connection
    owner: PublicKey
    payer: PublicKey
    amount: BigNumberish
    instructions: TransactionInstruction[]
    signers: Signer[]
    commitment?: Commitment
  }) {
    const { newAccount, instructions: newInstructions } = await this.makeCreateWrappedNativeAccountInstructions({
      connection,
      owner,
      payer,
      amount,
      commitment,
    })

    instructions.push(...newInstructions)
    signers.push(newAccount)
    // signers.push(newAccount);

    return newAccount.publicKey
  }

  static makeInitMintInstruction({
    mint,
    decimals,
    mintAuthority,
    freezeAuthority = null,
  }: {
    mint: PublicKey
    decimals: number
    mintAuthority: PublicKey
    freezeAuthority?: PublicKey | null
  }) {
    return _Token.createInitMintInstruction(TOKEN_PROGRAM_ID, mint, decimals, mintAuthority, freezeAuthority)
  }

  static makeMintToInstruction({
    mint,
    dest,
    authority,
    amount,
    multiSigners = [],
  }: {
    mint: PublicKey
    dest: PublicKey
    authority: PublicKey
    amount: BigNumberish
    multiSigners?: Signer[]
  }) {
    const LAYOUT = u64('amount')
    const data = Buffer.alloc(LAYOUT.span)
    LAYOUT.encode(parseBigNumberish(amount), data)

    return _Token.createMintToInstruction(TOKEN_PROGRAM_ID, mint, dest, authority, multiSigners, _u64.fromBuffer(data))
  }

  static makeInitAccountInstruction({
    mint,
    tokenAccount,
    owner,
  }: {
    mint: PublicKey
    tokenAccount: PublicKey
    owner: PublicKey
  }) {
    return _Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, mint, tokenAccount, owner)
  }

  static makeTransferInstruction({
    source,
    destination,
    owner,
    amount,
    multiSigners = [],
  }: {
    source: PublicKey
    destination: PublicKey
    owner: PublicKey
    amount: BigNumberish
    multiSigners?: Signer[]
  }) {
    const LAYOUT = u64('amount')
    const data = Buffer.alloc(LAYOUT.span)
    LAYOUT.encode(parseBigNumberish(amount), data)

    return _Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      source,
      destination,
      owner,
      multiSigners,
      _u64.fromBuffer(data)
    )
  }

  static makeCloseAccountInstruction({
    tokenAccount,
    owner,
    payer,
    multiSigners = [],
  }: {
    tokenAccount: PublicKey
    owner: PublicKey
    payer: PublicKey
    multiSigners?: Signer[]
  }) {
    return _Token.createCloseAccountInstruction(TOKEN_PROGRAM_ID, tokenAccount, payer, owner, multiSigners)
  }
}
