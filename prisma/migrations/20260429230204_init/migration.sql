-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT,
    "nickname" TEXT,
    "gender" TEXT,
    "goalType" TEXT,
    "birthDate" TIMESTAMP(3),
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "targetWeightKg" DOUBLE PRECISION,
    "paceType" TEXT,
    "approachType" TEXT,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyCalorieTarget" INTEGER NOT NULL,
    "breakfastCalories" INTEGER NOT NULL,
    "lunchCalories" INTEGER NOT NULL,
    "dinnerCalories" INTEGER NOT NULL,
    "snackCalories" INTEGER NOT NULL,
    "dailyStepsTarget" INTEGER NOT NULL,
    "estimatedBmr" INTEGER NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenericFood" (
    "id" TEXT NOT NULL,
    "foodCode" TEXT,
    "nameJa" TEXT NOT NULL,
    "nameEn" TEXT,
    "category" TEXT,
    "caloriesKcal" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION,
    "fatG" DOUBLE PRECISION,
    "carbG" DOUBLE PRECISION,
    "fiberG" DOUBLE PRECISION,
    "sodiumMg" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'mext',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenericFood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandedFood" (
    "id" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "restaurantChain" TEXT,
    "caloriesKcal" DOUBLE PRECISION NOT NULL,
    "servingSizeG" DOUBLE PRECISION,
    "proteinG" DOUBLE PRECISION,
    "fatG" DOUBLE PRECISION,
    "carbG" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandedFood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFood" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "caloriesKcal" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION,
    "fatG" DOUBLE PRECISION,
    "carbG" DOUBLE PRECISION,
    "defaultServingG" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodServing" (
    "id" TEXT NOT NULL,
    "genericFoodId" TEXT,
    "brandedFoodId" TEXT,
    "servingName" TEXT NOT NULL,
    "servingG" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FoodServing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodAlias" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "genericFoodId" TEXT,
    "brandedFoodId" TEXT,

    CONSTRAINT "FoodAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "logDate" TIMESTAMP(3) NOT NULL,
    "totalCalories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalProtein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCarb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealLogItem" (
    "id" TEXT NOT NULL,
    "mealLogId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "foodType" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "quantityG" DOUBLE PRECISION NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION,
    "fatG" DOUBLE PRECISION,
    "carbG" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MealLogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "chestCm" DOUBLE PRECISION,
    "waistCm" DOUBLE PRECISION,
    "hipCm" DOUBLE PRECISION,
    "upperArmCm" DOUBLE PRECISION,
    "calfCm" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summaryDate" TIMESTAMP(3) NOT NULL,
    "totalCalories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calorieGoal" INTEGER NOT NULL,
    "isGoalAchieved" BOOLEAN NOT NULL DEFAULT false,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserGoal_userId_isActive_idx" ON "UserGoal"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "GenericFood_foodCode_key" ON "GenericFood"("foodCode");

-- CreateIndex
CREATE INDEX "GenericFood_nameJa_idx" ON "GenericFood"("nameJa");

-- CreateIndex
CREATE UNIQUE INDEX "BrandedFood_barcode_key" ON "BrandedFood"("barcode");

-- CreateIndex
CREATE INDEX "BrandedFood_name_idx" ON "BrandedFood"("name");

-- CreateIndex
CREATE INDEX "UserFood_userId_name_idx" ON "UserFood"("userId", "name");

-- CreateIndex
CREATE INDEX "FoodAlias_alias_idx" ON "FoodAlias"("alias");

-- CreateIndex
CREATE INDEX "MealLog_userId_logDate_idx" ON "MealLog"("userId", "logDate");

-- CreateIndex
CREATE UNIQUE INDEX "MealLog_userId_mealType_logDate_key" ON "MealLog"("userId", "mealType", "logDate");

-- CreateIndex
CREATE INDEX "BodyRecord_userId_recordDate_idx" ON "BodyRecord"("userId", "recordDate");

-- CreateIndex
CREATE UNIQUE INDEX "BodyRecord_userId_recordDate_key" ON "BodyRecord"("userId", "recordDate");

-- CreateIndex
CREATE INDEX "DailySummary_userId_summaryDate_idx" ON "DailySummary"("userId", "summaryDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_userId_summaryDate_key" ON "DailySummary"("userId", "summaryDate");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGoal" ADD CONSTRAINT "UserGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFood" ADD CONSTRAINT "UserFood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodServing" ADD CONSTRAINT "FoodServing_genericFoodId_fkey" FOREIGN KEY ("genericFoodId") REFERENCES "GenericFood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodServing" ADD CONSTRAINT "FoodServing_brandedFoodId_fkey" FOREIGN KEY ("brandedFoodId") REFERENCES "BrandedFood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodAlias" ADD CONSTRAINT "FoodAlias_genericFoodId_fkey" FOREIGN KEY ("genericFoodId") REFERENCES "GenericFood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodAlias" ADD CONSTRAINT "FoodAlias_brandedFoodId_fkey" FOREIGN KEY ("brandedFoodId") REFERENCES "BrandedFood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealLogItem" ADD CONSTRAINT "MealLogItem_mealLogId_fkey" FOREIGN KEY ("mealLogId") REFERENCES "MealLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyRecord" ADD CONSTRAINT "BodyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySummary" ADD CONSTRAINT "DailySummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
