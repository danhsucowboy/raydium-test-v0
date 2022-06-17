import parseNumberInfo from 'functions/numberish/parseNumberInfo'
import { Numberish } from 'types/constants'
import { Fraction } from 'entity/fraction'
import { Price } from 'entity/price'
import { ZERO } from 'entity/constant'
import { TokenAmount } from 'entity/amount'
import { Percent } from 'entity/percent'
import tryCatch from 'functions/tryCatch'

export default function toFraction(value: Numberish): Fraction {
  //  to complete math format(may have decimal), not int
  if (value instanceof Percent) return new Fraction(value.numerator, value.denominator)

  if (value instanceof Price) return value.adjusted

  // to complete math format(may have decimal), not BN
  if (value instanceof TokenAmount)
    return tryCatch(
      () => toFraction(value.toExact()),
      () => new Fraction(ZERO)
    )

  // do not ideal with other fraction value
  if (value instanceof Fraction) return value

  // wrap to Fraction
  const n = String(value)
  const details = parseNumberInfo(n)
  return new Fraction(details.numerator, details.denominator)
}

export function toFractionWithDecimals(value: Numberish): { fr: Fraction; decimals?: number } {
  //  to complete math format(may have decimal), not int
  if (value instanceof Percent) return { fr: new Fraction(value.numerator, value.denominator) }

  if (value instanceof Price) return { fr: value.adjusted }

  // to complete math format(may have decimal), not BN
  if (value instanceof TokenAmount) return { fr: toFraction(value.toExact()), decimals: value.token.decimals }

  // do not ideal with other fraction value
  if (value instanceof Fraction) return { fr: value }

  // wrap to Fraction
  const n = String(value)
  const details = parseNumberInfo(n)
  return { fr: new Fraction(details.numerator, details.denominator), decimals: details.dec?.length }
}
