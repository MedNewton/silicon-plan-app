// src/app/workspaces/join/page.tsx
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import JoinWorkspaceClient from "./JoinWorkspaceClient";

type JoinPageProps = {
  searchParams: Promise<{ invite?: string }>;
};

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

export default async function JoinWorkspacePage({
  searchParams,
}: JoinPageProps) {
  const { invite } = await searchParams;
  const inviteId = invite ?? "";

  // No invite token -> nothing to do here
  if (!inviteId) {
    redirect("/");
  }

  const user = await currentUser();
  const joinUrl = `/workspaces/join?invite=${encodeURIComponent(inviteId)}`;

  // 1) Not authenticated → go to /auth, but keep where we came from in ?next=
  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(joinUrl)}`);
  }

  // 2) Authenticated but not onboarded → go through onboarding, then come back here
  const metadata = user.unsafeMetadata;
  const onboardingCompleted =
    hasOnboardingMetadata(metadata) && metadata.onboardingCompleted === true;

  if (!onboardingCompleted) {
    redirect(`/onboarding?next=${encodeURIComponent(joinUrl)}`);
  }

  // 3) Authenticated + onboarded → show the join page
  return <JoinWorkspaceClient inviteId={inviteId} />;
}
