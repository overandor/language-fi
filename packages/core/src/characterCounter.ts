/**
 * Character counting service
 * Counts occurrences of letters, numbers, spaces, and symbols in text
 */

export interface CharacterCounts {
  [char: string]: number;
}

export interface CountResult {
  counts: CharacterCounts;
  totalCount: number;
  uniqueCharacters: number;
}

/**
 * Count characters in text (letters, numbers, spaces only)
 * Normalizes to uppercase for consistency
 */
export function countCharacters(text: string): CountResult {
  const normalized = text.toUpperCase();
  const counts: CharacterCounts = {};
  let totalCount = 0;

  for (const char of normalized) {
    // Only count alphanumeric characters and spaces
    if (/^[A-Z0-9 ]$/.test(char)) {
      counts[char] = (counts[char] || 0) + 1;
      totalCount++;
    }
  }

  return {
    counts,
    totalCount,
    uniqueCharacters: Object.keys(counts).length,
  };
}

/**
 * Get dominant character in text
 */
export function getDominantCharacter(text: string): string | null {
  const result = countCharacters(text);
  if (result.totalCount === 0) return null;

  let maxCount = 0;
  let dominantChar = null;

  for (const [char, count] of Object.entries(result.counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantChar = char;
    }
  }

  return dominantChar;
}

/**
 * Calculate character frequency distribution
 */
export function getFrequencyDistribution(text: string): Map<string, number> {
  const result = countCharacters(text);
  const distribution = new Map<string, number>();

  for (const [char, count] of Object.entries(result.counts)) {
    distribution.set(char, count / result.totalCount);
  }

  return distribution;
}
