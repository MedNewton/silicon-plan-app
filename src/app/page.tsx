// src/app/page.tsx
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import AIDocumentsPage from "@/components/ai-documents/AIDocumentsPage";

type OnboardingMetadata = {
  onboardingCompleted?: boolean;
};

function hasOnboardingMetadata(
  metadata: unknown,
): metadata is OnboardingMetadata {
  if (typeof metadata !== "object" || metadata === null) return false;
  const value = (metadata as OnboardingMetadata).onboardingCompleted;
  return value === undefined || typeof value === "boolean";
}

export default async function HomePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/auth");
  }

  const metadata = user.unsafeMetadata;
  const needsOnboarding =
    !hasOnboardingMetadata(metadata) ||
    metadata.onboardingCompleted !== true;

  if (needsOnboarding) {
    redirect("/onboarding");
  }


  return (
    <AIDocumentsPage />
  );
}
