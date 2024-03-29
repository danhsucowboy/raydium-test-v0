import { PublicKey, SystemProgram } from '@solana/web3.js'

// import { Logger } from "./logger";

// const logger = Logger.from("common/pubkey");

/* ================= global public keys ================= */
export { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
export { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'

export const SYSTEM_PROGRAM_ID = SystemProgram.programId
export const MEMO_PROGRAM_ID = new PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo')

/* ================= validate public key ================= */
export type PublicKeyish = PublicKey | string

export function validateAndParsePublicKey(publicKey: PublicKeyish) {
  if (publicKey instanceof PublicKey) {
    return publicKey
  }

  if (typeof publicKey === 'string') {
    try {
      const key = new PublicKey(publicKey)
      return key
    } catch {
      throw Error(`invalid public key: ${publicKey}`)
    }
  }

  throw Error(`invalid public key: ${publicKey}`)
}

export async function findProgramAddress(seeds: Array<Buffer | Uint8Array>, programId: PublicKey) {
  const [publicKey, nonce] = await PublicKey.findProgramAddress(seeds, programId)
  return { publicKey, nonce }
}

export function AccountMeta(publicKey: PublicKey, isSigner: boolean) {
  return {
    pubkey: publicKey,
    isWritable: true,
    isSigner,
  }
}

export function AccountMetaReadonly(publicKey: PublicKey, isSigner: boolean) {
  return {
    pubkey: publicKey,
    isWritable: false,
    isSigner,
  }
}
