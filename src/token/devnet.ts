import { LpTokens} from "./type";


export const DEVNET_LP_TOKENS: LpTokens = {
  *[Symbol.iterator]() {
    yield* Object.values(this);
  },
};
