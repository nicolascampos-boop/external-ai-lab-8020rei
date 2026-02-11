export function getRatingColor(rating: number | null): string {
  if (!rating) return 'bg-gray-200'
  if (rating >= 4) return 'bg-green-500'
  if (rating >= 3) return 'bg-blue-500'
  if (rating >= 2) return 'bg-yellow-500'
  return 'bg-red-500'
}
