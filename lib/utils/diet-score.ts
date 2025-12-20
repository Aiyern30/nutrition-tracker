/**
 * Calculate diet quality score based on macro ratios and goal adherence
 * Returns a letter grade (A+, A, B+, B, C+, C, D, F)
 */
export function calculateDietScore(
  consumedCalories: number,
  consumedProtein: number,
  consumedCarbs: number,
  consumedFats: number,
  calorieGoal: number,
  proteinGoal: number,
  carbsGoal: number,
  fatsGoal: number
): string {
  if (consumedCalories === 0) return "B"; // No data yet

  let score = 100;

  // Calorie adherence (30 points)
  const calorieRatio = consumedCalories / calorieGoal;
  if (calorieRatio > 1.2 || calorieRatio < 0.7) {
    score -= 30;
  } else if (calorieRatio > 1.1 || calorieRatio < 0.8) {
    score -= 15;
  } else if (calorieRatio >= 0.9 && calorieRatio <= 1.1) {
    score += 5; // Bonus for perfect adherence
  }

  // Protein adherence (25 points) - higher weight because protein is crucial
  const proteinRatio = consumedProtein / proteinGoal;
  if (proteinRatio < 0.7) {
    score -= 25;
  } else if (proteinRatio < 0.9) {
    score -= 10;
  } else if (proteinRatio >= 0.9 && proteinRatio <= 1.2) {
    score += 5; // Bonus for meeting protein
  }

  // Carbs adherence (20 points)
  const carbsRatio = consumedCarbs / carbsGoal;
  if (carbsRatio > 1.3 || carbsRatio < 0.6) {
    score -= 20;
  } else if (carbsRatio > 1.15 || carbsRatio < 0.75) {
    score -= 10;
  }

  // Fats adherence (20 points)
  const fatsRatio = consumedFats / fatsGoal;
  if (fatsRatio > 1.3 || fatsRatio < 0.6) {
    score -= 20;
  } else if (fatsRatio > 1.15 || fatsRatio < 0.75) {
    score -= 10;
  }

  // Macro balance (5 points) - reward balanced intake
  const allMacrosInRange =
    proteinRatio >= 0.8 &&
    proteinRatio <= 1.2 &&
    carbsRatio >= 0.8 &&
    carbsRatio <= 1.2 &&
    fatsRatio >= 0.8 &&
    fatsRatio <= 1.2;
  if (allMacrosInRange) {
    score += 5;
  }

  // Convert score to letter grade
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 60) return "D";
  return "F";
}

/**
 * Get color variant for diet score
 */
export function getDietScoreColor(
  score: string
): "success" | "primary" | "warning" | "destructive" {
  if (score.startsWith("A")) return "success";
  if (score.startsWith("B")) return "primary";
  if (score.startsWith("C")) return "warning";
  return "destructive";
}
