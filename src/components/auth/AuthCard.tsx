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

type AuthMode = "login" | "register";

interface AuthCardProps {
  defaultMode?: AuthMode;
}

const AuthCard: React.FC<AuthCardProps> = ({ defaultMode = "login" }) => {
  const theme = useTheme();
  const [mode, setMode] = React.useState<AuthMode>(defaultMode);

  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [loginShowPassword, setLoginShowPassword] = React.useState(false);

  const [firstName, setFirstName] = React.useState("");
  const [secondName, setSecondName] = React.useState("");
  const [registerEmail, setRegisterEmail] = React.useState("");
  const [registerPassword, setRegisterPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [registerShowPassword, setRegisterShowPassword] = React.useState(false);
  const [registerShowConfirmPassword, setRegisterShowConfirmPassword] =
    React.useState(false);

  const isLoginValid = loginEmail.trim() !== "" && loginPassword.length >= 6;
  const isRegisterValid =
    firstName.trim() !== "" &&
    secondName.trim() !== "" &&
    registerEmail.trim() !== "" &&
    registerPassword.length >= 6 &&
    registerPassword === confirmPassword;

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoginValid) return;
    // plug your login logic here
    // console.log({ loginEmail, loginPassword, rememberMe });
  };

  const handleRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isRegisterValid) return;
    // plug your register logic here
    // console.log({ firstName, secondName, registerEmail, registerPassword });
  };

  const renderTabs = () => {
    const isLogin = mode === "login";

    const baseTabSx = {
      flex: 1,
      borderRadius: 999,
      textTransform: "none" as const,
      fontWeight: 600,
      fontSize: 14,
      py: 1.2,
      boxShadow: "none",
    };

    return (
      <Stack direction="row" spacing={1} mt={3}>
        <Button
          onClick={() => setMode("login")}
          disableRipple
          sx={{
            ...baseTabSx,
            backgroundImage: isLogin ? theme.palette.titleGradient : "none",
            backgroundColor: isLogin ? "transparent" : "#fff",
            color: isLogin ? "#fff" : theme.palette.text.primary,
            border: isLogin ? "none" : "1px solid rgba(211,219,239,1)",
          }}
        >
          Log In
        </Button>
        <Button
          onClick={() => setMode("register")}
          disableRipple
          sx={{
            ...baseTabSx,
            backgroundImage: !isLogin ? theme.palette.titleGradient : "none",
            backgroundColor: !isLogin ? "transparent" : "#fff",
            color: !isLogin ? "#fff" : theme.palette.text.primary,
            border: !isLogin ? "none" : "1px solid rgba(211,219,239,1)",
          }}
        >
          Register
        </Button>
      </Stack>
    );
  };

  const renderSocialButtons = () => (
    <Stack spacing={1.5} mt={3}>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<FacebookIcon />}
        disableRipple
        sx={{
          borderRadius: 2,
          height: 44,
          borderColor: "rgba(211,219,239,1)",
          textTransform: "none",
          fontWeight: 500,
          fontSize: 14,
          bgcolor: "#fff",
        }}
      >
        Facebook
      </Button>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<GoogleIcon />}
        disableRipple
        sx={{
          borderRadius: 2,
          height: 44,
          borderColor: "rgba(211,219,239,1)",
          textTransform: "none",
          fontWeight: 500,
          fontSize: 14,
          bgcolor: "#fff",
        }}
      >
        Google
      </Button>
    </Stack>
  );

  const renderDivider = () => (
    <Box mt={3}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Divider sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">
          or
        </Typography>
        <Divider sx={{ flex: 1 }} />
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

  const renderLoginForm = () => (
    <Box component="form" mt={3} onSubmit={handleLoginSubmit}>
      <Stack spacing={2}>
        <TextField
          label="E-mail"
          placeholder="youremail@gmail.com"
          fullWidth
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          InputProps={{ sx: { borderRadius: 2.5, bgcolor: "#fff" } }}
        />
        <TextField
          label="Password"
          type={loginShowPassword ? "text" : "password"}
          fullWidth
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          InputProps={{
            sx: { borderRadius: 2.5, bgcolor: "#fff" },
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
        mt={1.5}
        mb={2.5}
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
        <Link href="#" variant="body2" underline="none" color="text.secondary">
          Forgot password?
        </Link>
      </Stack>

      <Button
        type="submit"
        fullWidth
        disabled={!isLoginValid}
        sx={{
          borderRadius: 2.5,
          textTransform: "none",
          fontWeight: 600,
          fontSize: 15,
          py: 1.4,
          backgroundImage: theme.palette.ctaGradient,
          color: "#fff",
          boxShadow: "none",
          "&.Mui-disabled": {
            backgroundImage: "none",
            backgroundColor: "#E0E0E0",
            color: "#9E9E9E",
          },
          "&:hover": {
            boxShadow: "none",
            opacity: 0.95,
            backgroundImage: theme.palette.ctaGradient,
          },
        }}
      >
        Sign In
      </Button>
    </Box>
  );

  const renderRegisterForm = () => (
    <Box component="form" mt={3} onSubmit={handleRegisterSubmit}>
      <Stack spacing={2}>
        <TextField
          label="First name"
          placeholder="Enter your first name"
          fullWidth
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          InputProps={{ sx: { borderRadius: 2.5, bgcolor: "#fff" } }}
        />
        <TextField
          label="Second name"
          placeholder="Enter your second name"
          fullWidth
          value={secondName}
          onChange={(e) => setSecondName(e.target.value)}
          InputProps={{ sx: { borderRadius: 2.5, bgcolor: "#fff" } }}
        />
        <TextField
          label="E-mail"
          placeholder="youremail@gmail.com"
          fullWidth
          value={registerEmail}
          onChange={(e) => setRegisterEmail(e.target.value)}
          InputProps={{ sx: { borderRadius: 2.5, bgcolor: "#fff" } }}
        />
        <TextField
          label="Password"
          type={registerShowPassword ? "text" : "password"}
          fullWidth
          value={registerPassword}
          onChange={(e) => setRegisterPassword(e.target.value)}
          InputProps={{
            sx: { borderRadius: 2.5, bgcolor: "#fff" },
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
          onChange={(e) => setConfirmPassword(e.target.value)}
          InputProps={{
            sx: { borderRadius: 2.5, bgcolor: "#fff" },
            endAdornment: renderPasswordAdornment(
              registerShowConfirmPassword,
              () => setRegisterShowConfirmPassword((prev) => !prev),
            ),
          }}
        />
      </Stack>

      <Button
        type="submit"
        fullWidth
        disabled={!isRegisterValid}
        sx={{
          mt: 3,
          borderRadius: 2.5,
          textTransform: "none",
          fontWeight: 600,
          fontSize: 15,
          py: 1.4,
          backgroundImage: theme.palette.ctaGradient,
          color: "#fff",
          boxShadow: "none",
          "&.Mui-disabled": {
            backgroundImage: "none",
            backgroundColor: "#E0E0E0",
            color: "#9E9E9E",
          },
          "&:hover": {
            boxShadow: "none",
            opacity: 0.95,
            backgroundImage: theme.palette.ctaGradient,
          },
        }}
      >
        Sign In
      </Button>
    </Box>
  );

  return (
    <Card
      elevation={0}
      sx={{
        maxWidth: 480,
        width: "100%",
        borderRadius: 4,
        border: "1px solid rgba(211,219,239,0.9)",
        bgcolor: theme.palette.background.paper,
        boxShadow: "0px 32px 80px rgba(15,23,42,0.12)",
      }}
    >
      <CardContent
        sx={{
          p: { xs: 3, sm: 4.5 },
          "&:last-child": { pb: { xs: 3, sm: 4.5 } },
        }}
      >
        <Typography
          variant="h5"
          align="center"
          sx={{ fontWeight: 700, mb: 0.5 }}
        >
          Welcome to the Silicon Plan
        </Typography>
        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
        >
          Log in or register for Entrepreneurs
        </Typography>

        {renderTabs()}
        {renderSocialButtons()}
        {renderDivider()}
        {mode === "login" ? renderLoginForm() : renderRegisterForm()}
      </CardContent>
    </Card>
  );
};

export default AuthCard;
