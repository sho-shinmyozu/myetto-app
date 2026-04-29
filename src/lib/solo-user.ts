import { prisma } from "@/lib/db";

export const SOLO_USER_ID = "solo-user";

export async function getSoloUserId(): Promise<string> {
  await prisma.user.upsert({
    where: { id: SOLO_USER_ID },
    create: {
      id: SOLO_USER_ID,
      email: "solo@myetto.local",
      onboardingDone: false,
    },
    update: {},
  });
  return SOLO_USER_ID;
}
