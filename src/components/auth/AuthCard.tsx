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

const BORDER_COLOR = "rgba(211,219,239,1)";

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
    };

    const handleRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isRegisterValid) return;
    };

    const renderTabs = () => {
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
                    onClick={() => setMode("login")}
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
                        backgroundColor: isLogin ? "transparent" : "transparent",
                        color: isLogin ? "#FFFFFF" : theme.palette.text.primary,
                    }}
                >
                    Log In
                </Button>
                <Button
                    onClick={() => setMode("register")}
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
                        backgroundColor: !isLogin ? "transparent" : "transparent",
                        color: !isLogin ? "#FFFFFF" : theme.palette.text.primary,
                    }}
                >
                    Register
                </Button>
            </Box>
        );
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

    const renderSocialButtons = () => (
        <Stack spacing={1.5} mt={3}>
            <Button
                variant="outlined"
                fullWidth
                startIcon={<FacebookIcon sx={{ color: "#1877F2" }} />} // Facebook blue
                disableRipple
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
                startIcon={<GoogleIcon sx={{ color: "#EA4335" }} />} // Google red (G icon)
                disableRipple
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


    const renderDivider = () => (
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

    const renderLoginForm = () => (
        <Box component="form" mt={3.5} onSubmit={handleLoginSubmit}>
            <Stack spacing={2.5}>
                <TextField
                    label="E-mail"
                    placeholder="youremail@gmail.com"
                    fullWidth
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: textFieldSx }}
                />
                <TextField
                    label="Password"
                    type={loginShowPassword ? "text" : "password"}
                    fullWidth
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
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
                <Link href="#" variant="body2" underline="none" color="text.secondary">
                    Forgot password?
                </Link>
            </Stack>

            <Button
                type="submit"
                fullWidth
                disabled={!isLoginValid}
                sx={{
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
                Sign In
            </Button>
        </Box>
    );

    const renderRegisterForm = () => (
        <Box component="form" mt={3.5} onSubmit={handleRegisterSubmit}>
            <Stack spacing={2.5}>
                <TextField
                    label="First name"
                    placeholder="Enter your first name"
                    fullWidth
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: textFieldSx }}
                />
                <TextField
                    label="Second name"
                    placeholder="Enter your second name"
                    fullWidth
                    value={secondName}
                    onChange={(e) => setSecondName(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: textFieldSx }}
                />
                <TextField
                    label="E-mail"
                    placeholder="youremail@gmail.com"
                    fullWidth
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: textFieldSx }}
                />
                <TextField
                    label="Password"
                    type={registerShowPassword ? "text" : "password"}
                    fullWidth
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
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
                    onChange={(e) => setConfirmPassword(e.target.value)}
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

            <Button
                type="submit"
                fullWidth
                disabled={!isRegisterValid}
                sx={{
                    mt: 3,
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
                Register
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
                {mode === "login" ? renderLoginForm() : renderRegisterForm()}
            </CardContent>
        </Card>
    );
};

export default AuthCard;
