import { Token as _Token, u64 as _u64 } from "@solana/spl-token";
import {
  Commitment, Connection, Keypair, PublicKey, Signer, SystemProgram, TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";

import { validateAndParsePublicKey } from "common/pubkey";
import { TOKEN_PROGRAM_ID } from "common/pubkey";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "common/pubkey";
import { BigNumberish, parseBigNumberish } from "entity/bignumber";
import { u64 } from "../marshmallow";

import { SPL_ACCOUNT_LAYOUT } from "./layout";

// https://github.com/solana-labs/solana-program-library/tree/master/token/js/client
export class Spl {
  static getAssociatedTokenAccount({ mint, owner }: { mint: PublicKey; owner: PublicKey }) {
    return _Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, owner, true);
  }

  static makeCreateAssociatedTokenAccountInstruction({
    mint,
    associatedAccount,
    owner,
    payer,
  }: {
    mint: PublicKey;
    associatedAccount: PublicKey;
    owner: PublicKey;
    payer: PublicKey;
  }) {
    return _Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      associatedAccount,
      owner,
      payer,
    );
  }

  static makeInitMintInstruction({
    mint,
    decimals,
    mintAuthority,
    freezeAuthority = null,
  }: {
    mint: PublicKey;
    decimals: number;
    mintAuthority: PublicKey;
    freezeAuthority?: PublicKey | null;
  }) {
    return _Token.createInitMintInstruction(TOKEN_PROGRAM_ID, mint, decimals, mintAuthority, freezeAuthority);
  }

  static makeMintToInstruction({
    mint,
    dest,
    authority,
    amount,
    multiSigners = [],
  }: {
    mint: PublicKey;
    dest: PublicKey;
    authority: PublicKey;
    amount: BigNumberish;
    multiSigners?: Signer[];
  }) {
    const LAYOUT = u64("amount");
    const data = Buffer.alloc(LAYOUT.span);
    LAYOUT.encode(parseBigNumberish(amount), data);

    return _Token.createMintToInstruction(TOKEN_PROGRAM_ID, mint, dest, authority, multiSigners, _u64.fromBuffer(data));
  }

  static makeInitAccountInstruction({
    mint,
    tokenAccount,
    owner,
  }: {
    mint: PublicKey;
    tokenAccount: PublicKey;
    owner: PublicKey;
  }) {
    return _Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, mint, tokenAccount, owner);
  }

  static makeTransferInstruction({
    source,
    destination,
    owner,
    amount,
    multiSigners = [],
  }: {
    source: PublicKey;
    destination: PublicKey;
    owner: PublicKey;
    amount: BigNumberish;
    multiSigners?: Signer[];
  }) {
    const LAYOUT = u64("amount");
    const data = Buffer.alloc(LAYOUT.span);
    LAYOUT.encode(parseBigNumberish(amount), data);

    return _Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      source,
      destination,
      owner,
      multiSigners,
      _u64.fromBuffer(data),
    );
  }

  static makeCloseAccountInstruction({
    tokenAccount,
    owner,
    payer,
    multiSigners = [],
  }: {
    tokenAccount: PublicKey;
    owner: PublicKey;
    payer: PublicKey;
    multiSigners?: Signer[];
  }) {
    return _Token.createCloseAccountInstruction(TOKEN_PROGRAM_ID, tokenAccount, payer, owner, multiSigners);
  }
}