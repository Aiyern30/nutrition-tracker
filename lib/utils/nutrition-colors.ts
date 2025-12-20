/**
 * Determine progress color based on current value vs goal
 * For most macros: green when approaching goal, red when exceeding
 * @param current - Current value consumed
 * @param goal - Target goal value
 * @param type - Type of nutrient (affects color logic)
 */
export function getProgressColor(
  current: number,
  goal: number,
  type: "calories" | "protein" | "carbs" | "fats" | "default" = "default"
): "destructive" | "success" | "warning" | "primary" {
  if (goal === 0) return "primary";
  
  const percentage = (current / goal) * 100;

  // For fats, carbs, and calories: red when exceeding (bad), yellow when close
  if (type === "fats" || type === "carbs" || type === "calories") {
    if (current > goal) return "destructive"; // Over goal = bad
    if (percentage >= 90) return "warning"; // Close to limit = caution
    if (percentage >= 75) return "primary";
    return "primary";
  }

  // For protein: green when close to goal (good), red when exceeding still bad
  if (type === "protein") {
    if (current > goal * 1.2) return "destructive"; // Way over = bad
    if (current > goal) return "warning"; // Slightly over = caution
    if (percentage >= 80) return "success"; // Close to goal = good
    if (percentage >= 60) return "primary";
    return "primary";
  }

  // Default behavior
  if (current > goal) return "destructive";
  if (percentage >= 90) return "success";
  if (percentage >= 75) return "warning";
  return "primary";
}

/**
 * Get text color class based on progress
 */
export function getTextColor(
  current: number,
  goal: number,
  type: "calories" | "protein" | "carbs" | "fats" | "default" = "default"
): string {
  const colorType = getProgressColor(current, goal, type);
  
  const colorMap = {
    destructive: "text-red-500",
    success: "text-green-500",
    warning: "text-yellow-500",
    primary: "text-primary",
  };

  return colorMap[colorType];
}

/**
 * Get progress bar color class based on progress
 */
export function getBarColor(
  current: number,
  goal: number,
  type: "calories" | "protein" | "carbs" | "fats" | "default" = "default"
): string {
  const colorType = getProgressColor(current, goal, type);
  
  const colorMap = {
    destructive: "bg-red-500 animate-pulse",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    primary: "bg-primary",
  };

  return colorMap[colorType];
}
