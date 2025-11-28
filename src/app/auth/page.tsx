// src/app/auth/page.tsx
"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Box } from "@mui/material";
import AuthCard from "@/components/auth/AuthCard";

export default function AuthPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get("next");

  useEffect(() => {
    if (!isLoaded || !user) return;

    // If we came here with a target (e.g. /workspaces/join?invite=...)
    if (next) {
      router.replace(next);
    } else {
      // Normal login flow
      router.replace("/");
    }
  }, [isLoaded, user, router, next]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
        py: 4,
      }}
    >
      <AuthCard />
    </Box>
  );
}
