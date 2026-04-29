export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSoloUserId } from "@/lib/solo-user";

export default async function RootPage() {
  const userId = await getSoloUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingDone: true },
  });

  if (!user?.onboardingDone) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
