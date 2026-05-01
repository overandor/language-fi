export function correlation(a: number[], b: number[]) {
  const n = a.length
  if (n === 0) return 0
  const avgA = a.reduce((x, y) => x + y) / n
  const avgB = b.reduce((x, y) => x + y) / n
  let num = 0
  let denA = 0
  let denB = 0
  for (let i = 0; i < n; i++) {
    num += (a[i] - avgA) * (b[i] - avgB)
    denA += (a[i] - avgA) ** 2
    denB += (b[i] - avgB) ** 2
  }
  const denominator = Math.sqrt(denA * denB)
  if (denominator === 0) return 0
  return num / denominator
}
