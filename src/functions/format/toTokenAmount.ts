import BN from 'bn.js'

// import { HydratedTokenJsonInfo } from 'application/token/type'
import { HydratedTokenJsonInfo } from 'applications/token/type'
import { QuantumSOLToken, QuantumSOLAmount, toQuantumSolAmount } from 'applications/token/utils/quantumSOL'
import { isQuantumSOL, isQuantumSOLVersionSOL } from 'applications/token/utils/quantumSOL'

// import {
//   isQuantumSOL,
//   isQuantumSOLVersionSOL,
//   QuantumSOLAmount,
//   toQuantumSolAmount,
//   WSOLMint
// } from '@/application/token/utils/quantumSOL'
import parseNumberInfo from 'functions/numberish/parseNumberInfo'

import toBN from 'functions/numberish/toBN'
import { Numberish } from 'types/constants'
import { Fraction } from 'entity/fraction'
import { Token } from 'entity/currency'
import { TokenAmount } from 'entity/amount'

import { isToken } from '../judgers/dateType'
import toFraction from '../numberish/toFraction'

/**
 *
 * @param token
 * @param amount amount can already decimaled
 * @returns
 */
export function toTokenAmount(
  token: QuantumSOLToken,
  amount: Numberish | undefined,
  options?: {
    /**
     * without this options, inputed wsol will be quantumSol
     * normally you should not use it
     */
    exact?: boolean
    /** defaultly {@link toTokenAmount} accept BN, use this to accpet pure number like:3.11 */
    alreadyDecimaled?: boolean // may cause bug, havn't test it
  }
): QuantumSOLAmount
export function toTokenAmount(
  token: HydratedTokenJsonInfo | Token,
  amount: Numberish | undefined,
  options?: {
    /**
     * without this options, inputed wsol will be quantumSol
     * normally you should not use it
     */
    exact?: boolean
    /** defaultly {@link toTokenAmount} accept BN, use this to accpet pure number like:3.11 */
    alreadyDecimaled?: boolean // may cause bug, havn't test it
  }
): TokenAmount
export function toTokenAmount(
  token: HydratedTokenJsonInfo | Token | QuantumSOLToken,
  amount: Numberish | undefined,
  options?: {
    /**
     * without this options, inputed wsol will be quantumSol
     * normally you should not use it
     */
    exact?: boolean
    /** defaultly {@link toTokenAmount} accept BN, use this to accpet pure number like:3.11 */
    alreadyDecimaled?: boolean // may cause bug, havn't test it
  }
): TokenAmount | QuantumSOLAmount {
  const parsedToken = isToken(token) && token

  const numberDetails = parseNumberInfo(amount)

  const amountBigNumber = toBN(
    options?.alreadyDecimaled
      ? new Fraction(numberDetails.numerator, numberDetails.denominator).mul(
          new BN(10).pow(new BN(parsedToken.decimals))
        )
      : amount
      ? toFraction(amount)
      : toFraction(0)
  )

  // const iswsol =
  //   (isQuantumSOL(parsedToken) && parsedToken.collapseTo === 'wsol') ||
  //   (!isQuantumSOL(parsedToken) && String(token.mint) === String(WSOLMint))

  const issol = isQuantumSOL(parsedToken) || isQuantumSOLVersionSOL(parsedToken)

  // if (iswsol && !options?.exact) {
  //   return toQuantumSolAmount({ wsolRawAmount: amountBigNumber })
  if (issol && !options?.exact) {
    return toQuantumSolAmount({ solRawAmount: amountBigNumber })
  } else {
    return new TokenAmount(parsedToken, amountBigNumber)
  }
}
