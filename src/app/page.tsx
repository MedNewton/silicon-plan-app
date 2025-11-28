// src/app/page.tsx
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Box, Typography } from "@mui/material";

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

  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName ?? user.username ?? "there";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 720, width: "100%" }}>
        <Typography
          sx={{
            fontSize: { xs: 28, md: 34 },
            fontWeight: 700,
            mb: 1,
          }}
        >
          Welcome back, {displayName}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520 }}>
          Onboarding is completed. Replace this content with your main dashboard
          or workspace UI.
        </Typography>
      </Box>
    </Box>
  );
}
