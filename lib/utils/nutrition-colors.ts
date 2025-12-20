/**
 * Determine progress color based on current value vs goal
 *
 * Color Philosophy:
 * - CALORIES/FATS/CARBS: Stay within or below goal (these are limits)
 *   - Green: 70-95% (healthy range)
 *   - Yellow: 95-100% (approaching limit)
 *   - Red: >100% (exceeded limit - bad)
 *
 * - PROTEIN: Meet or slightly exceed goal (this is a target)
 *   - Green: 90-120% (optimal range)
 *   - Yellow: 70-90% or 120-130% (suboptimal but okay)
 *   - Red: <50% or >150% (unhealthy extremes)
 *
 * @param current - Current value consumed
 * @param goal - Target goal value
 * @param type - Type of nutrient (affects color logic)
 */
export function getProgressColor(
  current: number,
  goal: number,
  type:
    | "calories"
    | "protein"
    | "carbs"
    | "fats"
    | "water"
    | "default" = "default"
): "destructive" | "success" | "warning" | "primary" {
  if (goal === 0) return "primary";

  const percentage = (current / goal) * 100;

  // LIMIT nutrients: Calories, Fats, Carbs (stay below or at goal)
  if (type === "calories" || type === "fats" || type === "carbs") {
    if (current > goal * 1.15) return "destructive"; // >115% = very bad
    if (current > goal) return "destructive"; // >100% = exceeded
    if (percentage >= 95) return "warning"; // 95-100% = approaching limit
    if (percentage >= 70) return "success"; // 70-95% = healthy range
    if (percentage >= 50) return "primary"; // 50-70% = on track
    return "primary"; // <50% = just started
  }

  // TARGET nutrient: Protein (aim to meet goal, slightly over is fine)
  if (type === "protein") {
    if (percentage < 50) return "destructive"; // <50% = way too low
    if (percentage < 70) return "warning"; // 50-70% = below target
    if (percentage < 90) return "primary"; // 70-90% = getting there
    if (percentage <= 120) return "success"; // 90-120% = optimal!
    if (percentage <= 150) return "warning"; // 120-150% = bit high
    return "destructive"; // >150% = too much
  }

  // HYDRATION: Water (more is generally better, up to a point)
  if (type === "water") {
    if (percentage >= 100) return "success"; // Met goal = great
    if (percentage >= 75) return "primary"; // 75-100% = on track
    if (percentage >= 50) return "warning"; // 50-75% = need more
    return "destructive"; // <50% = dehydrated
  }

  // DEFAULT: Standard progress (closer to goal is better)
  if (percentage >= 100) return "success"; // Met or exceeded
  if (percentage >= 80) return "primary"; // Close to goal
  if (percentage >= 50) return "warning"; // Halfway there
  return "destructive"; // Far from goal
}

/**
 * Get text color class based on progress
 */
export function getTextColor(
  current: number,
  goal: number,
  type:
    | "calories"
    | "protein"
    | "carbs"
    | "fats"
    | "water"
    | "default" = "default"
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
  type:
    | "calories"
    | "protein"
    | "carbs"
    | "fats"
    | "water"
    | "default" = "default"
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

/**
 * Get background color with opacity for cards/badges
 */
export function getBgColor(
  current: number,
  goal: number,
  type:
    | "calories"
    | "protein"
    | "carbs"
    | "fats"
    | "water"
    | "default" = "default"
): string {
  const colorType = getProgressColor(current, goal, type);

  const colorMap = {
    destructive: "bg-red-500/10",
    success: "bg-green-500/10",
    warning: "bg-yellow-500/10",
    primary: "bg-primary/10",
  };

  return colorMap[colorType];
}

/**
 * Get a human-readable status message
 */
export function getStatusMessage(
  current: number,
  goal: number,
  type:
    | "calories"
    | "protein"
    | "carbs"
    | "fats"
    | "water"
    | "default" = "default"
): string {
  if (goal === 0) return "No goal set";

  const percentage = (current / goal) * 100;
  const remaining = Math.max(0, goal - current);

  if (type === "calories" || type === "fats" || type === "carbs") {
    if (current > goal) {
      const excess = current - goal;
      return `${excess.toFixed(0)} over goal`;
    }
    return `${remaining.toFixed(0)} remaining`;
  }

  if (type === "protein") {
    if (percentage >= 90 && percentage <= 120) return "Optimal intake!";
    if (current > goal * 1.2) return "Above recommended";
    if (current < goal * 0.7) return "Below target";
    return `${remaining.toFixed(0)}g to goal`;
  }

  if (type === "water") {
    if (percentage >= 100) return "Goal reached!";
    return `${remaining.toFixed(0)} glasses left`;
  }

  if (current >= goal) return "Goal achieved!";
  return `${(((goal - current) / goal) * 100).toFixed(0)}% remaining`;
}
