/**
 * Utility function to calculate the final price of a product after applying a percentage discount.
 * @param originalPrice - The starting price of the product
 * @param discountPercentage - Optional discount percentage (0 to 100)
 * @returns The final discounted price, rounded to the nearest integer
 */
export function calculateFinalPrice(originalPrice: number, discountPercentage?: number | null): number {
  if (!discountPercentage || discountPercentage <= 0) {
    return originalPrice;
  }
  const discount = (originalPrice * discountPercentage) / 100;
  return Math.round(originalPrice - discount);
}