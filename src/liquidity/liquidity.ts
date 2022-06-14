import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js'
import { LiquidityPoolJsonInfo } from './type';

export type LiquidityPoolKeysV4 = {
    [T in keyof LiquidityPoolJsonInfo]: string extends LiquidityPoolJsonInfo[T] ? PublicKey : LiquidityPoolJsonInfo[T];
  };
  

/**
 * Full liquidity pool keys that build transaction need
 */
 export type LiquidityPoolKeys = LiquidityPoolKeysV4;

/* ================= pool info ================= */
/**
 * Liquidity pool info
 * @remarks
 * same data type with layouts
 */
 export interface LiquidityPoolInfo {
    status: BN;
    baseDecimals: number;
    quoteDecimals: number;
    lpDecimals: number;
    baseReserve: BN;
    quoteReserve: BN;
    lpSupply: BN;
    startTime: BN;
  }