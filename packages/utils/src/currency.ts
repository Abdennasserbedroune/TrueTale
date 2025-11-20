export function formatPrice(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function parsePriceToCents(price: number): number {
  return Math.round(price * 100);
}

export function centsToPrice(cents: number): number {
  return cents / 100;
}
