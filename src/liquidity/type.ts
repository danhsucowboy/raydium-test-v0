export type LiquidityVersion = 4 | 5;

/* ================= json file ================= */
export interface LiquidityPoolJsonInfo {
    // base
    readonly id: string;
    readonly baseMint: string;
    readonly quoteMint: string;
    readonly lpMint: string;
    // version
    readonly version: number;
    readonly programId: string;
    // keys
    readonly authority: string;
    readonly baseVault: string;
    readonly quoteVault: string;
    readonly lpVault: string;
    readonly openOrders: string;
    readonly targetOrders: string;
    readonly withdrawQueue: string;
    // market version
    readonly marketVersion: number;
    readonly marketProgramId: string;
    // market keys
    readonly marketId: string;
    readonly marketAuthority: string;
    readonly marketBaseVault: string;
    readonly marketQuoteVault: string;
    readonly marketBids: string;
    readonly marketAsks: string;
    readonly marketEventQueue: string;
  }