interface NutritionData {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
}

interface Goals {
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fats_goal: number;
}

/**
 * Calculate diet quality score based on nutrition goals
 * @param nutrition - Current nutrition data
 * @param goals - User's nutrition goals
 * @returns Diet score (A+, A, B+, B, C+, C, D) and explanation
 */
export function calculateDietScore(
  nutrition: NutritionData,
  goals: Goals
): { score: string; explanation: string } {
  // Calculate percentage of each macro achieved
  const caloriePercent =
    (nutrition.total_calories / goals.daily_calorie_goal) * 100;
  const proteinPercent =
    (nutrition.total_protein / goals.daily_protein_goal) * 100;
  const carbsPercent = (nutrition.total_carbs / goals.daily_carbs_goal) * 100;
  const fatsPercent = (nutrition.total_fats / goals.daily_fats_goal) * 100;

  // Calculate balance score (0-100)
  // Ideal range: 90-110% of each goal
  const calorieScore = Math.max(0, 100 - Math.abs(caloriePercent - 100));
  const proteinScore = Math.max(0, 100 - Math.abs(proteinPercent - 100));
  const carbsScore = Math.max(0, 100 - Math.abs(carbsPercent - 100));
  const fatsScore = Math.max(0, 100 - Math.abs(fatsPercent - 100));

  // Weighted average (protein is more important)
  const totalScore =
    calorieScore * 0.3 +
    proteinScore * 0.35 +
    carbsScore * 0.2 +
    fatsScore * 0.15;

  // Determine letter grade
  let score: string;
  let explanation: string;

  if (totalScore >= 95) {
    score = "A+";
    explanation = "Excellent! Your nutrition is perfectly balanced.";
  } else if (totalScore >= 90) {
    score = "A";
    explanation = "Outstanding balance across all macros.";
  } else if (totalScore >= 85) {
    score = "B+";
    explanation = "Very good! Minor adjustments needed.";
  } else if (totalScore >= 80) {
    score = "B";
    explanation = "Good balance, room for improvement.";
  } else if (totalScore >= 70) {
    score = "C+";
    explanation = "Fair balance, consider adjusting intake.";
  } else if (totalScore >= 60) {
    score = "C";
    explanation = "Needs improvement for better balance.";
  } else {
    score = "D";
    explanation = "Significant imbalance, review your goals.";
  }

  return { score, explanation };
}

/**
 * Calculate diet quality score based on macro ratios and goal adherence
 * Returns a letter grade (A+, A, B+, B, C+, C, D, F)
 */
export function calculateDietScoreV2(
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
 * Get diet score trend indicator
 * @param currentScore - Current diet score
 * @param previousScore - Previous diet score
 * @returns Trend value and direction
 */
export function getDietScoreTrend(
  currentScore: string,
  previousScore: string
): { value: number; isPositive: boolean } | undefined {
  const scoreValues: Record<string, number> = {
    "A+": 100,
    A: 95,
    "B+": 90,
    B: 85,
    "C+": 75,
    C: 65,
    D: 50,
  };

  const current = scoreValues[currentScore] || 0;
  const previous = scoreValues[previousScore] || 0;
  const diff = current - previous;

  if (diff === 0) return undefined;

  return {
    value: Math.abs(diff),
    isPositive: diff > 0,
  };
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
