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
  const caloriePercent = (nutrition.total_calories / goals.daily_calorie_goal) * 100;
  const proteinPercent = (nutrition.total_protein / goals.daily_protein_goal) * 100;
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
    (calorieScore * 0.3) + 
    (proteinScore * 0.35) + 
    (carbsScore * 0.2) + 
    (fatsScore * 0.15);

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
    "A": 95,
    "B+": 90,
    "B": 85,
    "C+": 75,
    "C": 65,
    "D": 50,
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
