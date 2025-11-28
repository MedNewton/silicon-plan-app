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

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) return;

    const next = searchParams.get("next");
    // Avoid redirecting to external URLs; only allow in-app paths
    const target = next?.startsWith("/") ? next : "/";

    router.replace(target);
  }, [isLoaded, user, router, searchParams]);

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
