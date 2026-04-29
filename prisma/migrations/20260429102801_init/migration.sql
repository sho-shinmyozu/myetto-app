-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "name" TEXT,
    "nickname" TEXT,
    "gender" TEXT,
    "goalType" TEXT,
    "birthDate" DATETIME,
    "heightCm" REAL,
    "weightKg" REAL,
    "targetWeightKg" REAL,
    "paceType" TEXT,
    "approachType" TEXT,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dailyCalorieTarget" INTEGER NOT NULL,
    "breakfastCalories" INTEGER NOT NULL,
    "lunchCalories" INTEGER NOT NULL,
    "dinnerCalories" INTEGER NOT NULL,
    "snackCalories" INTEGER NOT NULL,
    "dailyStepsTarget" INTEGER NOT NULL,
    "estimatedBmr" INTEGER NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GenericFood" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "foodCode" TEXT,
    "nameJa" TEXT NOT NULL,
    "nameEn" TEXT,
    "category" TEXT,
    "caloriesKcal" REAL NOT NULL,
    "proteinG" REAL,
    "fatG" REAL,
    "carbG" REAL,
    "fiberG" REAL,
    "sodiumMg" REAL,
    "source" TEXT NOT NULL DEFAULT 'mext',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BrandedFood" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "restaurantChain" TEXT,
    "caloriesKcal" REAL NOT NULL,
    "servingSizeG" REAL,
    "proteinG" REAL,
    "fatG" REAL,
    "carbG" REAL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserFood" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "caloriesKcal" REAL NOT NULL,
    "proteinG" REAL,
    "fatG" REAL,
    "carbG" REAL,
    "defaultServingG" REAL NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserFood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FoodServing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "genericFoodId" TEXT,
    "brandedFoodId" TEXT,
    "servingName" TEXT NOT NULL,
    "servingG" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FoodServing_genericFoodId_fkey" FOREIGN KEY ("genericFoodId") REFERENCES "GenericFood" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FoodServing_brandedFoodId_fkey" FOREIGN KEY ("brandedFoodId") REFERENCES "BrandedFood" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FoodAlias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alias" TEXT NOT NULL,
    "genericFoodId" TEXT,
    "brandedFoodId" TEXT,
    CONSTRAINT "FoodAlias_genericFoodId_fkey" FOREIGN KEY ("genericFoodId") REFERENCES "GenericFood" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FoodAlias_brandedFoodId_fkey" FOREIGN KEY ("brandedFoodId") REFERENCES "BrandedFood" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "logDate" DATETIME NOT NULL,
    "totalCalories" REAL NOT NULL DEFAULT 0,
    "totalProtein" REAL NOT NULL DEFAULT 0,
    "totalFat" REAL NOT NULL DEFAULT 0,
    "totalCarb" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MealLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealLogItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealLogId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "foodType" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "quantityG" REAL NOT NULL,
    "calories" REAL NOT NULL,
    "proteinG" REAL,
    "fatG" REAL,
    "carbG" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MealLogItem_mealLogId_fkey" FOREIGN KEY ("mealLogId") REFERENCES "MealLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BodyRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recordDate" DATETIME NOT NULL,
    "weightKg" REAL,
    "chestCm" REAL,
    "waistCm" REAL,
    "hipCm" REAL,
    "upperArmCm" REAL,
    "calfCm" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BodyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailySummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "summaryDate" DATETIME NOT NULL,
    "totalCalories" REAL NOT NULL DEFAULT 0,
    "calorieGoal" INTEGER NOT NULL,
    "isGoalAchieved" BOOLEAN NOT NULL DEFAULT false,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailySummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
