import NumberFlow from "@number-flow/react";

const numberFormat: Intl.NumberFormatOptions = {};
const currencyFormat: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export function AnimatedNumber({ value }: { value: number }) {
  return <NumberFlow value={value} format={numberFormat} />;
}

export function AnimatedCurrency({ value }: { value: number }) {
  return <NumberFlow value={value} format={currencyFormat} />;
}
