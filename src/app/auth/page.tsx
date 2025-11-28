// src/app/auth/page.tsx
"use client";

import { Suspense, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Box } from "@mui/material";
import AuthCard from "@/components/auth/AuthCard";

// ---- Inner content that actually uses useSearchParams -----------------------
function AuthPageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) return;

    // We standardize on ?redirect_url=... everywhere
    const redirectParam = searchParams.get("redirect_url");
    const target = redirectParam?.startsWith("/") ? redirectParam : "/";

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

// ---- Default export wrapped in Suspense ------------------------------------
export default function AuthPage() {
  return (
    <Suspense
      fallback={
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
          {/* simple loader instead of blank page */}
          Loading...
        </Box>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
