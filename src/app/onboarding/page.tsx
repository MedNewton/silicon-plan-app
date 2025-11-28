"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";

import step1 from "@/assets/onboarding/step1.png";
import step2 from "@/assets/onboarding/step2.png";
import step3 from "@/assets/onboarding/step3.png";

type OnboardingStep = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
};

type OnboardingMetadata = {
  onboardingCompleted?: boolean;
};

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    title:
      "Welcome to Silicon Plan – the place where your ideas turn into real business",
    subtitle: "Create smart AI-powered documents",
    description:
      "Bring your business vision to life with ease. Generate professional business plans, lean canvas models, and pitch decks in minutes.",
    image: step1.src,
  },
  {
    id: 2,
    title:
      "Welcome to Silicon Plan – the place where your ideas turn into real business",
    subtitle: "Explore the expert marketplace",
    description:
      "Connect with specialists from different industries — from finance and marketing to design and legal services. Find the right partner to strengthen your project and scale faster.",
    image: step2.src,
  },
  {
    id: 3,
    title:
      "Welcome to Silicon Plan – the place where your ideas turn into real business",
    subtitle: "Explore the expert marketplace",
    description:
      "Book tailored consultations with vetted experts. Validate your ideas, refine your strategy, and unlock new growth opportunities for your business.",
    image: step3.src,
  },
];

function hasOnboardingMetadata(
  metadata: unknown,
): metadata is OnboardingMetadata {
  if (typeof metadata !== "object" || metadata === null) return false;
  const value = (metadata as OnboardingMetadata).onboardingCompleted;
  return value === undefined || typeof value === "boolean";
}

export default function OnboardingPage() {
  const theme = useTheme();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [completing, setCompleting] = useState<boolean>(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  const activeStep = STEPS[activeStepIndex];
  const isLastStep = activeStepIndex === STEPS.length - 1;

  const onboardingCompleted = useMemo(() => {
    if (!user) return false;
    const metadata = user.unsafeMetadata;
    if (!hasOnboardingMetadata(metadata)) return false;
    return metadata.onboardingCompleted === true;
  }, [user]);

  // === REDIRECT LOGIC ========================================================
  useEffect(() => {
    if (!isLoaded) return;

    // Not signed in -> go to auth
    if (!user && !hasRedirected) {
      setHasRedirected(true);
      router.replace("/auth");
      return;
    }

    // Already completed onboarding -> go to home
    if (user && onboardingCompleted && !hasRedirected) {
      setHasRedirected(true);
      router.replace("/");
    }
  }, [isLoaded, user, onboardingCompleted, hasRedirected, router]);

  // === LOADING / REDIRECT STATES ============================================
  if (!isLoaded || !user || onboardingCompleted || hasRedirected) {
    // While Clerk is loading OR we are mid-redirect, show a simple loader instead of blank screen
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
        <Typography variant="body1" color="text.secondary">
          Preparing your workspace...
        </Typography>
      </Box>
    );
  }

  // === NORMAL ONBOARDING UI ==================================================
  const markOnboardingCompleted = async () => {
    if (!user || completing) return;

    setCompleting(true);

    try {
      const currentMetadata = user.unsafeMetadata;
      const baseMetadata: Record<string, unknown> =
        typeof currentMetadata === "object" && currentMetadata !== null
          ? (currentMetadata as Record<string, unknown>)
          : {};

      await user.update({
        unsafeMetadata: {
          ...baseMetadata,
          onboardingCompleted: true,
        },
      });

      router.replace("/");
    } finally {
      setCompleting(false);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setActiveStepIndex((prev) => prev + 1);
      return;
    }

    void markOnboardingCompleted();
  };

  const handleSkip = () => {
    void markOnboardingCompleted();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, md: 4 },
        py: 8,
      }}
    >
      <Box
        sx={{
          maxWidth: 1120,
          width: "100%",
          textAlign: "center",
        }}
      >
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
          sx={{ mb: 5 }}
        >
          {STEPS.map((step, index) => (
            <Box
              key={step.id}
              sx={{
                width: 40,
                height: 4,
                borderRadius: 999,
                transition: "all 0.2s ease",
                background:
                  index === activeStepIndex
                    ? "linear-gradient(90deg, #6547A5 0%, #3F6DDD 100%)"
                    : "rgba(211,219,239,1)",
              }}
            />
          ))}
        </Stack>

        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: 24, md: 28 },
            mb: 2,
            width: "75%",
            textAlign: "center",
            mx: "auto",
          }}
        >
          {activeStep?.title ?? ""}
        </Typography>

        <Typography
          sx={{
            fontWeight: 600,
            fontSize: { xs: 18, md: 22 },
            mb: 1.5,
            color: theme.palette.text.secondary,
          }}
        >
          {activeStep?.subtitle ?? ""}
        </Typography>

        <Typography
          sx={{
            maxWidth: 720,
            mx: "auto",
            fontSize: { xs: 14, md: 16 },
            color: theme.palette.text.secondary,
          }}
        >
          {activeStep?.description ?? ""}
        </Typography>

        <Box
          sx={{
            overflow: "hidden",
            mx: "auto",
            maxWidth: 800,
            mb: 5,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              pt: "55%",
            }}
          >
            <Image
              src={activeStep?.image ?? ""}
              alt={activeStep?.subtitle ?? ""}
              fill
              style={{ objectFit: "contain" }}
              sizes="(max-width: 1200px) 100vw, 1000px"
              priority={activeStepIndex === 0}
            />
          </Box>
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={2}
        >
          <Button
            variant="contained"
            onClick={handleSkip}
            disabled={completing}
            sx={{
              minWidth: 180,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 16,
              color: "#FFFFFF",
              backgroundImage: theme.palette.ctaGradient,
              px: 4,
              py: 1.4,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
                opacity: 0.96,
                backgroundImage: theme.palette.ctaGradient,
              },
            }}
          >
            Getting Started
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            disabled={completing}
            sx={{
              minWidth: 180,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 16,
              color: "#FFFFFF",
              backgroundImage: theme.palette.ctaGradient,
              px: 4,
              py: 1.4,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
                opacity: 0.96,
                backgroundImage: theme.palette.ctaGradient,
              },
            }}
          >
            Next
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
