"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useSignIn, useSignUp } from "@clerk/nextjs";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  firstName: string;
  secondName: string;
  email: string;
  password: string;
};

type ForgotPasswordStartPayload = {
  email: string;
};

type ForgotPasswordResetPayload = {
  code: string;
  password: string;
};

type LoadingKey =
  | "login"
  | "register"
  | "google"
  | "facebook"
  | "forgotRequest"
  | "forgotReset";

type LoadingState = Record<LoadingKey, boolean>;

type Provider = Extract<LoadingKey, "google" | "facebook">;

type ClerkErrorShape = {
  errors?: Array<{ message?: string }>;
};

function hasClerkErrors(error: unknown): error is ClerkErrorShape {
  if (typeof error !== "object" || error === null) return false;
  if (!("errors" in error)) return false;

  const maybeErrors = (error as { errors?: unknown }).errors;
  if (!Array.isArray(maybeErrors)) return false;

  return maybeErrors.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      ("message" in item || item === undefined),
  );
}

function extractClerkErrorMessage(error: unknown): string {
  if (hasClerkErrors(error) && error.errors && error.errors.length > 0) {
    const first = error.errors[0];
    if (first && typeof first.message === "string" && first.message.length > 0) {
      return first.message;
    }
  }
  return "Something went wrong. Please try again.";
}

export function useAuthCardController() {
  const router = useRouter();

  const { isSignedIn } = useAuth();
  const {
    signIn,
    isLoaded: isSignInLoaded,
    setActive: setActiveFromSignIn,
  } = useSignIn();
  const {
    signUp,
    isLoaded: isSignUpLoaded,
    setActive: setActiveFromSignUp,
  } = useSignUp();

  const [loading, setLoading] = useState<LoadingState>({
    login: false,
    register: false,
    google: false,
    facebook: false,
    forgotRequest: false,
    forgotReset: false,
  });

  const [error, setError] = useState<string | null>(null);

  const resetError = (): void => setError(null);

  const handleLogin = async ({
    email,
    password,
  }: LoginPayload): Promise<void> => {
    if (!isSignInLoaded || !signIn) return;

    resetError();
    setLoading((prev) => ({ ...prev, login: true }));

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActiveFromSignIn({ session: result.createdSessionId });
        router.replace("/");
        return;
      }

      setError("Additional steps are required to complete sign in.");
    } catch (err: unknown) {
      setError(extractClerkErrorMessage(err));
    } finally {
      setLoading((prev) => ({ ...prev, login: false }));
    }
  };

  const handleRegister = async ({
    firstName,
    secondName,
    email,
    password,
  }: RegisterPayload): Promise<void> => {
    if (!isSignUpLoaded || !signUp) return;

    resetError();
    setLoading((prev) => ({ ...prev, register: true }));

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName: secondName,
      });

      if (result.status === "complete") {
        await setActiveFromSignUp({ session: result.createdSessionId });
        router.replace("/");
        return;
      }

      setError("Additional steps are required to complete registration.");
    } catch (err: unknown) {
      setError(extractClerkErrorMessage(err));
    } finally {
      setLoading((prev) => ({ ...prev, register: false }));
    }
  };

  const handleProvider = async (provider: Provider): Promise<void> => {
    if (!isSignInLoaded || !signIn) return;

    resetError();
    setLoading((prev) => ({ ...prev, [provider]: true }));

    const strategy =
      provider === "google" ? "oauth_google" : "oauth_facebook";

    let redirectUrlComplete = "/";
    try {
      const url = new URL(window.location.href);
      redirectUrlComplete = url.searchParams.get("redirect_url") ?? "/";
    } catch {
      // ignore, keep "/"
    }

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete,
      });
    } catch (err: unknown) {
      setError(extractClerkErrorMessage(err));
      setLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleGoogle = (): Promise<void> => handleProvider("google");
  const handleFacebook = (): Promise<void> => handleProvider("facebook");

  const handleForgotPasswordSendCode = async ({
    email,
  }: ForgotPasswordStartPayload): Promise<boolean> => {
    if (!isSignInLoaded || !signIn) return false;

    resetError();
    setLoading((prev) => ({ ...prev, forgotRequest: true }));

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      return true;
    } catch (err: unknown) {
      setError(extractClerkErrorMessage(err));
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, forgotRequest: false }));
    }
  };

  const handleForgotPasswordReset = async ({
    code,
    password,
  }: ForgotPasswordResetPayload): Promise<boolean> => {
    if (!isSignInLoaded || !signIn) return false;

    resetError();
    setLoading((prev) => ({ ...prev, forgotReset: true }));

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password,
      });

      if (result.status === "complete") {
        await setActiveFromSignIn({ session: result.createdSessionId });
        router.replace("/");
        return true;
      }

      if (result.status === "needs_second_factor") {
        setError("Additional verification is required to complete reset.");
      } else {
        setError("Could not reset password. Please try again.");
      }

      return false;
    } catch (err: unknown) {
      setError(extractClerkErrorMessage(err));
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, forgotReset: false }));
    }
  };

  return {
    isSignedIn: Boolean(isSignedIn),
    loading,
    error,
    resetError,
    handleLogin,
    handleRegister,
    handleGoogle,
    handleFacebook,
    handleForgotPasswordSendCode,
    handleForgotPasswordReset,
  };
}
