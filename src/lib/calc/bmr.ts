export type Gender = "male" | "female";
export type PaceType = "hard" | "soft";
export type ApproachType = "diet_only" | "diet_exercise" | "exercise_only";

const ACTIVITY_FACTOR: Record<ApproachType, number> = {
  diet_only: 1.2,
  diet_exercise: 1.375,
  exercise_only: 1.55,
};

const DAILY_DEFICIT: Record<PaceType, number> = {
  soft: 250,
  hard: 500,
};

const STEPS_TARGET: Record<ApproachType, number> = {
  diet_only: 5000,
  diet_exercise: 8000,
  exercise_only: 12000,
};

export function calcAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export function calcBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

export interface GoalResult {
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  breakfastCalories: number;
  lunchCalories: number;
  dinnerCalories: number;
  snackCalories: number;
  dailyStepsTarget: number;
  targetDate: Date;
  daysToGoal: number;
}

export function calcGoals(params: {
  gender: Gender;
  weightKg: number;
  targetWeightKg: number;
  heightCm: number;
  birthDate: Date;
  paceType: PaceType;
  approachType: ApproachType;
}): GoalResult {
  const age = calcAge(params.birthDate);
  const bmr = calcBMR(params.gender, params.weightKg, params.heightCm, age);
  const tdee = Math.round(bmr * ACTIVITY_FACTOR[params.approachType]);
  const deficit = DAILY_DEFICIT[params.paceType];
  const dailyCalorieTarget = Math.max(1200, tdee - deficit);

  // 朝3:昼4:夜3 配分
  const breakfast = Math.round(dailyCalorieTarget * 0.3);
  const lunch = Math.round(dailyCalorieTarget * 0.4);
  const dinner = Math.round(dailyCalorieTarget * 0.25);
  const snack = dailyCalorieTarget - breakfast - lunch - dinner;

  // 目標体重までの日数（1kg = 7200kcal）
  const weightDiff = Math.max(0, params.weightKg - params.targetWeightKg);
  const daysToGoal = Math.ceil((weightDiff * 7200) / deficit);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysToGoal);

  return {
    bmr,
    tdee,
    dailyCalorieTarget,
    breakfastCalories: breakfast,
    lunchCalories: lunch,
    dinnerCalories: dinner,
    snackCalories: Math.max(0, snack),
    dailyStepsTarget: STEPS_TARGET[params.approachType],
    targetDate,
    daysToGoal,
  };
}
