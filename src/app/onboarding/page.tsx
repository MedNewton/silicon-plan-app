"use client";

import { useEffect, useState } from "react";
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

  const activeStep = STEPS[activeStepIndex];
  const isLastStep = activeStepIndex === STEPS.length - 1;

  const onboardingCompleted =
    user &&
    hasOnboardingMetadata(user.unsafeMetadata) &&
    user.unsafeMetadata.onboardingCompleted === true;

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace("/auth");
      return;
    }

    if (onboardingCompleted) {
      router.replace("/");
    }
  }, [isLoaded, user, onboardingCompleted, router]);

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

  // while Clerk user is loading we just render an empty shell (no flicker)
  if (!isLoaded || !user || onboardingCompleted) {
    return null;
  }

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
      <Box
        sx={{
          maxWidth: 1100,
          width: "100%",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 96,
            height: 4,
            borderRadius: 999,
            mx: "auto",
            mb: 4,
            background:
              "linear-gradient(90deg, rgba(101,71,165,0.3) 0%, rgba(63,109,221,0.9) 100%)",
          }}
        />

        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: 24, md: 32 },
            mb: 2,
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
            mb: 5,
          }}
        >
          {activeStep?.description ?? ""}
        </Typography>

        <Box
          sx={{
            borderRadius: 4,
            border: "1px solid rgba(211,219,239,1)",
            overflow: "hidden",
            mx: "auto",
            maxWidth: 1000,
            mb: 5,
            bgcolor: "#FFFFFF",
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
              style={{ objectFit: "cover" }}
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
            variant="outlined"
            onClick={handleSkip}
            disabled={completing}
            sx={{
              minWidth: 160,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "rgba(211,219,239,1)",
              color: theme.palette.text.primary,
              bgcolor: "#FFFFFF",
            }}
          >
            Getting Started
          </Button>
          <Button
            onClick={handleNext}
            disabled={completing}
            sx={{
              minWidth: 160,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 600,
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

        <Stack direction="row" justifyContent="center" spacing={1} mt={3}>
          {STEPS.map((step, index) => (
            <Box
              key={step.id}
              sx={{
                width: index === activeStepIndex ? 24 : 8,
                height: 8,
                borderRadius: 999,
                transition: "all 0.2s ease",
                backgroundColor:
                  index === activeStepIndex
                    ? "rgba(63,109,221,1)"
                    : "rgba(211,219,239,1)",
              }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
