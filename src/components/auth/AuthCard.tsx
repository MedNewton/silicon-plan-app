"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Link,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import GoogleIcon from "@mui/icons-material/Google";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAuthCardController } from "@/hooks/useAuthCardController";

type AuthMode = "login" | "register";

interface AuthCardProps {
  defaultMode?: AuthMode;
}

const BORDER_COLOR = "rgba(211,219,239,1)";

const AuthCard: React.FC<AuthCardProps> = ({ defaultMode = "login" }) => {
  const theme = useTheme();
  const [mode, setMode] = React.useState<AuthMode>(defaultMode);

  const [loginEmail, setLoginEmail] = React.useState<string>("");
  const [loginPassword, setLoginPassword] = React.useState<string>("");
  const [rememberMe, setRememberMe] = React.useState<boolean>(false);
  const [loginShowPassword, setLoginShowPassword] =
    React.useState<boolean>(false);
  const [forgotOpen, setForgotOpen] = React.useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = React.useState<string>("");
  const [forgotCodeSent, setForgotCodeSent] = React.useState<boolean>(false);
  const [forgotCode, setForgotCode] = React.useState<string>("");
  const [forgotPassword, setForgotPassword] = React.useState<string>("");
  const [forgotConfirmPassword, setForgotConfirmPassword] =
    React.useState<string>("");
  const [forgotShowPassword, setForgotShowPassword] =
    React.useState<boolean>(false);
  const [forgotShowConfirmPassword, setForgotShowConfirmPassword] =
    React.useState<boolean>(false);
  const [forgotInfo, setForgotInfo] = React.useState<string | null>(null);

  const [firstName, setFirstName] = React.useState<string>("");
  const [secondName, setSecondName] = React.useState<string>("");
  const [registerEmail, setRegisterEmail] = React.useState<string>("");
  const [registerPassword, setRegisterPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const [registerShowPassword, setRegisterShowPassword] =
    React.useState<boolean>(false);
  const [registerShowConfirmPassword, setRegisterShowConfirmPassword] =
    React.useState<boolean>(false);

  const {
    loading,
    error,
    resetError,
    handleLogin,
    handleRegister,
    handleGoogle,
    handleFacebook,
    handleForgotPasswordSendCode,
    handleForgotPasswordReset,
  } = useAuthCardController();

  const isLoginValid =
    loginEmail.trim().length > 0 && loginPassword.trim().length >= 6;

  const isRegisterValid =
    firstName.trim().length > 0 &&
    secondName.trim().length > 0 &&
    registerEmail.trim().length > 0 &&
    registerPassword.trim().length >= 6 &&
    registerPassword === confirmPassword;

  const isForgotRequestValid = forgotEmail.trim().length > 0;
  const isForgotResetValid =
    forgotCode.trim().length > 0 &&
    forgotPassword.trim().length >= 6 &&
    forgotPassword === forgotConfirmPassword;

  const resetForgotState = (): void => {
    setForgotOpen(false);
    setForgotCodeSent(false);
    setForgotCode("");
    setForgotPassword("");
    setForgotConfirmPassword("");
    setForgotShowPassword(false);
    setForgotShowConfirmPassword(false);
    setForgotInfo(null);
  };

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!isLoginValid) return;
    void handleLogin({ email: loginEmail, password: loginPassword });
  };

  const handleRegisterSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ): void => {
    event.preventDefault();
    if (!isRegisterValid) return;
    void handleRegister({
      firstName,
      secondName,
      email: registerEmail,
      password: registerPassword,
    });
  };

  const handleSwitchMode = (nextMode: AuthMode): void => {
    if (mode === nextMode) return;
    resetError();
    resetForgotState();
    setMode(nextMode);
  };

  const handleOpenForgotPassword = (): void => {
    resetError();
    setForgotOpen(true);
    setForgotEmail((prev) => (prev.trim().length > 0 ? prev : loginEmail));
    setForgotCodeSent(false);
    setForgotCode("");
    setForgotPassword("");
    setForgotConfirmPassword("");
    setForgotInfo(null);
  };

  const handleBackToLogin = (): void => {
    resetError();
    resetForgotState();
  };

  const handleForgotPasswordRequestSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (!isForgotRequestValid) return;

    const success = await handleForgotPasswordSendCode({ email: forgotEmail });
    if (!success) return;

    setForgotCodeSent(true);
    setForgotInfo("We sent a password reset code to your email.");
  };

  const handleForgotPasswordResetSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (!isForgotResetValid) return;

    const success = await handleForgotPasswordReset({
      code: forgotCode,
      password: forgotPassword,
    });

    if (!success) return;
    setForgotInfo("Password reset completed.");
  };

  const textFieldSx = {
    borderRadius: 2.5,
    bgcolor: "#FFFFFF",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: BORDER_COLOR,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: BORDER_COLOR,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: BORDER_COLOR,
    },
  };

  const renderTabs = (): React.ReactNode => {
    const isLogin = mode === "login";

    return (
      <Box
        mt={4}
        sx={{
          borderRadius: 3,
          border: `1px solid ${BORDER_COLOR}`,
          bgcolor: "#FFFFFF",
          p: 0.5,
          display: "flex",
          gap: 0.5,
        }}
      >
        <Button
          onClick={() => handleSwitchMode("login")}
          disableRipple
          sx={{
            flex: 1,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 14,
            py: 1.2,
            minWidth: 0,
            boxShadow: "none",
            backgroundImage: isLogin ? theme.palette.titleGradient : "none",
            backgroundColor: "transparent",
            color: isLogin ? "#FFFFFF" : theme.palette.text.primary,
          }}
        >
          Log In
        </Button>
        <Button
          onClick={() => handleSwitchMode("register")}
          disableRipple
          sx={{
            flex: 1,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 14,
            py: 1.2,
            minWidth: 0,
            boxShadow: "none",
            backgroundImage: !isLogin ? theme.palette.titleGradient : "none",
            backgroundColor: "transparent",
            color: !isLogin ? "#FFFFFF" : theme.palette.text.primary,
          }}
        >
          Register
        </Button>
      </Box>
    );
  };

  const renderSocialButtons = (): React.ReactNode => (
    <Stack spacing={1.5} mt={3}>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<FacebookIcon sx={{ color: "#1877F2" }} />}
        disableRipple
        onClick={() => void handleFacebook()}
        disabled={loading.facebook}
        sx={{
          borderRadius: 2.5,
          height: 52,
          borderColor: BORDER_COLOR,
          textTransform: "none",
          fontWeight: 500,
          fontSize: 14,
          bgcolor: "#FFFFFF",
        }}
      >
        Facebook
      </Button>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<GoogleIcon sx={{ color: "#EA4335" }} />}
        disableRipple
        onClick={() => void handleGoogle()}
        disabled={loading.google}
        sx={{
          borderRadius: 2.5,
          height: 52,
          borderColor: BORDER_COLOR,
          textTransform: "none",
          fontWeight: 500,
          fontSize: 14,
          bgcolor: "#FFFFFF",
        }}
      >
        Google
      </Button>
    </Stack>
  );

  const renderDivider = (): React.ReactNode => (
    <Box mt={3.5}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Divider sx={{ flex: 1, borderColor: BORDER_COLOR }} />
        <Typography variant="body2" color="text.secondary">
          or
        </Typography>
        <Divider sx={{ flex: 1, borderColor: BORDER_COLOR }} />
      </Stack>
    </Box>
  );

  const renderPasswordAdornment = (
    visible: boolean,
    toggle: () => void,
  ): React.ReactNode => (
    <IconButton
      size="small"
      onClick={toggle}
      edge="end"
      sx={{ color: "text.secondary" }}
    >
      {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
    </IconButton>
  );

  const renderError = (): React.ReactNode => {
    if (!error) return null;

    return (
      <Box mt={2}>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.error.main, textAlign: "left" }}
        >
          {error}
        </Typography>
      </Box>
    );
  };

  const renderLoginForm = (): React.ReactNode => (
    <Box component="form" mt={3.5} onSubmit={handleLoginSubmit}>
      <Stack spacing={2.5}>
        <TextField
          label="E-mail"
          placeholder="youremail@gmail.com"
          fullWidth
          value={loginEmail}
          onChange={(e) => {
            resetError();
            setLoginEmail(e.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          InputProps={{ sx: textFieldSx }}
        />
        <TextField
          label="Password"
          type={loginShowPassword ? "text" : "password"}
          fullWidth
          value={loginPassword}
          onChange={(e) => {
            resetError();
            setLoginPassword(e.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            sx: textFieldSx,
            endAdornment: renderPasswordAdornment(
              loginShowPassword,
              () => setLoginShowPassword((prev) => !prev),
            ),
          }}
        />
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mt={1.8}
        mb={3}
      >
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Remember me
            </Typography>
          }
        />
        <Link
          component="button"
          type="button"
          variant="body2"
          underline="none"
          color="text.secondary"
          onClick={handleOpenForgotPassword}
          sx={{
            border: "none",
            background: "none",
            p: 0,
            m: 0,
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Forgot password?
        </Link>
      </Stack>

      {renderError()}

      <Button
        type="submit"
        fullWidth
        disabled={!isLoginValid || loading.login}
        sx={{
          mt: error ? 2 : 0,
          borderRadius: 3,
          textTransform: "none",
          fontWeight: 600,
          fontSize: 16,
          py: 1.5,
          backgroundImage: theme.palette.ctaGradient,
          color: "#FFFFFF",
          boxShadow: "none",
          "&.Mui-disabled": {
            backgroundImage: "none",
            backgroundColor: "#E0E0E0",
            color: "#9E9E9E",
          },
          "&:hover": {
            boxShadow: "none",
            opacity: 0.96,
            backgroundImage: theme.palette.ctaGradient,
          },
        }}
      >
        {loading.login ? "Signing in..." : "Sign In"}
      </Button>
    </Box>
  );

  const renderForgotPasswordForm = (): React.ReactNode => (
    <Box
      component="form"
      mt={3.5}
      onSubmit={
        forgotCodeSent
          ? handleForgotPasswordResetSubmit
          : handleForgotPasswordRequestSubmit
      }
    >
      <Stack spacing={2.5}>
        <TextField
          label="E-mail"
          placeholder="youremail@gmail.com"
          fullWidth
          value={forgotEmail}
          onChange={(e) => {
            resetError();
            setForgotInfo(null);
            setForgotEmail(e.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          InputProps={{ sx: textFieldSx }}
          disabled={forgotCodeSent}
        />

        {forgotCodeSent ? (
          <>
            <TextField
              label="Reset code"
              placeholder="Enter the code from your email"
              fullWidth
              value={forgotCode}
              onChange={(e) => {
                resetError();
                setForgotInfo(null);
                setForgotCode(e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: textFieldSx }}
            />

            <TextField
              label="New password"
              type={forgotShowPassword ? "text" : "password"}
              fullWidth
              value={forgotPassword}
              onChange={(e) => {
                resetError();
                setForgotInfo(null);
                setForgotPassword(e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: textFieldSx,
                endAdornment: renderPasswordAdornment(
                  forgotShowPassword,
                  () => setForgotShowPassword((prev) => !prev),
                ),
              }}
            />

            <TextField
              label="Confirm new password"
              type={forgotShowConfirmPassword ? "text" : "password"}
              fullWidth
              value={forgotConfirmPassword}
              onChange={(e) => {
                resetError();
                setForgotInfo(null);
                setForgotConfirmPassword(e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: textFieldSx,
                endAdornment: renderPasswordAdornment(
                  forgotShowConfirmPassword,
                  () => setForgotShowConfirmPassword((prev) => !prev),
                ),
              }}
            />
          </>
        ) : null}
      </Stack>

      {forgotInfo ? (
        <Box mt={2}>
          <Typography variant="body2" color="success.main">
            {forgotInfo}
          </Typography>
        </Box>
      ) : null}

      {renderError()}

      <Stack direction="row" spacing={1.5} mt={error || forgotInfo ? 2 : 3}>
        <Button
          type="button"
          onClick={handleBackToLogin}
          sx={{
            flex: 1,
            borderRadius: 3,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 15,
            py: 1.4,
            border: `1px solid ${BORDER_COLOR}`,
            color: "text.secondary",
          }}
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={
            forgotCodeSent
              ? !isForgotResetValid || loading.forgotReset
              : !isForgotRequestValid || loading.forgotRequest
          }
          sx={{
            flex: 1,
            borderRadius: 3,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 15,
            py: 1.4,
            backgroundImage: theme.palette.ctaGradient,
            color: "#FFFFFF",
            boxShadow: "none",
            "&.Mui-disabled": {
              backgroundImage: "none",
              backgroundColor: "#E0E0E0",
              color: "#9E9E9E",
            },
            "&:hover": {
              boxShadow: "none",
              opacity: 0.96,
              backgroundImage: theme.palette.ctaGradient,
            },
          }}
        >
          {forgotCodeSent
            ? loading.forgotReset
              ? "Resetting..."
              : "Reset Password"
            : loading.forgotRequest
              ? "Sending..."
              : "Send Code"}
        </Button>
      </Stack>
    </Box>
  );

  const renderRegisterForm = (): React.ReactNode => (
    <Box component="form" mt={3.5} onSubmit={handleRegisterSubmit}>
      <Stack spacing={2.5}>
        <TextField
          label="First name"
          placeholder="Enter your first name"
          fullWidth
          value={firstName}
          onChange={(e) => {
            resetError();
            setFirstName(e.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          InputProps={{ sx: textFieldSx }}
        />
        <TextField
          label="Second name"
          placeholder="Enter your second name"
          fullWidth
          value={secondName}
          onChange={(e) => {
            resetError();
            setSecondName(e.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          InputProps={{ sx: textFieldSx }}
        />
        <TextField
          label="E-mail"
          placeholder="youremail@gmail.com"
          fullWidth
          value={registerEmail}
          onChange={(e) => {
            resetError();
            setRegisterEmail(e.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          InputProps={{ sx: textFieldSx }}
        />
        <TextField
          label="Password"
          type={registerShowPassword ? "text" : "password"}
          fullWidth
          value={registerPassword}
          onChange={(e) => {
            resetError();
            setRegisterPassword(e.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            sx: textFieldSx,
            endAdornment: renderPasswordAdornment(
              registerShowPassword,
              () => setRegisterShowPassword((prev) => !prev),
            ),
          }}
        />
        <TextField
          label="Confirm your password"
          type={registerShowConfirmPassword ? "text" : "password"}
          fullWidth
          value={confirmPassword}
          onChange={(e) => {
            resetError();
            setConfirmPassword(e.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            sx: textFieldSx,
            endAdornment: renderPasswordAdornment(
              registerShowConfirmPassword,
              () => setRegisterShowConfirmPassword((prev) => !prev),
            ),
          }}
        />
      </Stack>

      {renderError()}

      <Button
        type="submit"
        fullWidth
        disabled={!isRegisterValid || loading.register}
        sx={{
          mt: error ? 2 : 3,
          borderRadius: 3,
          textTransform: "none",
          fontWeight: 600,
          fontSize: 16,
          py: 1.5,
          backgroundImage: theme.palette.ctaGradient,
          color: "#FFFFFF",
          boxShadow: "none",
          "&.Mui-disabled": {
            backgroundImage: "none",
            backgroundColor: "#E0E0E0",
            color: "#9E9E9E",
          },
          "&:hover": {
            boxShadow: "none",
            opacity: 0.96,
            backgroundImage: theme.palette.ctaGradient,
          },
        }}
      >
        {loading.register ? "Registering..." : "Register"}
      </Button>
    </Box>
  );

  return (
    <Card
      elevation={0}
      sx={{
        maxWidth: 520,
        width: "100%",
        borderRadius: 6,
        border: `1px solid ${BORDER_COLOR}`,
        bgcolor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <CardContent
        sx={{
          p: { xs: 3, sm: 4.5 },
          "&:last-child": { pb: { xs: 3, sm: 4.5 } },
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            textAlign: "left",
            fontSize: { xs: 26, sm: 30 },
            mb: 1,
          }}
        >
          Welcome to the Silicon Plan
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center" }}
        >
          Log In or register for Enterpreneurs
        </Typography>

        {renderTabs()}
        {renderSocialButtons()}
        {renderDivider()}
        {mode === "login"
          ? forgotOpen
            ? renderForgotPasswordForm()
            : renderLoginForm()
          : renderRegisterForm()}
      </CardContent>
    </Card>
  );
};

export default AuthCard;
