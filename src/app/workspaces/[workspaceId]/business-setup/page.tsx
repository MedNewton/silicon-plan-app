// src/app/workspaces/[workspaceId]/business-setup/page.tsx
"use client";

import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";

import type { WorkspaceBusinessProfile } from "@/types/workspaces";

type NavKey =
  | "ai-documents"
  | "consultants"
  | "bookings"
  | "session-history"
  | "learning"
  | "settings";

type ActiveTab = "create" | "myWorkspaces";

type BusinessProfileResponse = {
  businessProfile: WorkspaceBusinessProfile | null;
  redirectTo?: string;
};

export default function WorkspaceBusinessSetupPage() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();

  const workspaceId =
    typeof params.workspaceId === "string"
      ? params.workspaceId
      : Array.isArray(params.workspaceId)
        ? params.workspaceId[0]
        : "";

  const [activeNav, setActiveNav] = useState<NavKey>("ai-documents");
  const [activeTab, setActiveTab] = useState<ActiveTab>("create");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tagline, setTagline] = useState("");
  const [isOperating, setIsOperating] = useState("");
  const [industry, setIndustry] = useState("");
  const [companyStage, setCompanyStage] = useState("");

  const [problemShort, setProblemShort] = useState("");
  const [problemLong, setProblemLong] = useState("");
  const [solutionAndUniqueness, setSolutionAndUniqueness] = useState("");
  const [teamAndRoles, setTeamAndRoles] = useState("");
  const [financialProjections, setFinancialProjections] = useState("");
  const [risksAndMitigation, setRisksAndMitigation] = useState("");
  const [successMetrics, setSuccessMetrics] = useState("");
  const [growthPartnerships, setGrowthPartnerships] = useState("");

  const isSubmitDisabled = saving || loading || !workspaceId;

  useEffect(() => {
    if (!workspaceId) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/workspaces/${workspaceId}/business-profile`,
        );
        if (!response.ok) {
          setLoading(false);
          return;
        }

        const json = (await response.json()) as BusinessProfileResponse;
        const profile = json.businessProfile;

        if (profile) {
          setTagline(profile.tagline ?? "");
          if (profile.is_operating === true) setIsOperating("yes");
          if (profile.is_operating === false) setIsOperating("no");
          setIndustry(profile.industry ?? "");
          setCompanyStage(profile.company_stage ?? "");
          setProblemShort(profile.problem_short ?? "");
          setProblemLong(profile.problem_long ?? "");
          setSolutionAndUniqueness(profile.solution_and_uniqueness ?? "");
          setTeamAndRoles(profile.team_and_roles ?? "");
          setFinancialProjections(profile.financial_projections ?? "");
          setRisksAndMitigation(profile.risks_and_mitigation ?? "");
          setSuccessMetrics(profile.success_metrics ?? "");
          setGrowthPartnerships(profile.growth_partnerships ?? "");
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to load business profile", error);
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [workspaceId]);


  const inputBaseSx = {
    borderRadius: 2.5,
    bgcolor: "#FFFFFF",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#D3DBEF",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#C3CDE8",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#8A9FE4",
    },
    fontSize: 14.5,
  };

  const multilineFieldSx = {
    ...inputBaseSx,
    alignItems: "flex-start",
    "& textarea": {
      fontSize: 14.5,
    },
  };

  const selectBaseSx = {
    ...inputBaseSx,
    "& .MuiSelect-select": {
      fontSize: 14.5,
      py: 1.3,
    },
  };

  const magicIconAdornment = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        pr: 1.2,
        color: "#8A9FE4",
        cursor: "pointer",
      }}
    >
      <AutoAwesomeOutlinedIcon sx={{ fontSize: 20 }} />
    </Box>
  );

  const sidebar = () => {
    const itemBaseStyles = {
      height: 64,
      px: 3,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      fontSize: 15,
      fontWeight: 500,
      cursor: "pointer",
      borderRadius: 0,
    } as const;

    const makeItem = (key: NavKey, label: string, icon: ReactNode) => {
      const isActive = activeNav === key;
      return (
        <Box
          key={key}
          onClick={() => setActiveNav(key)}
          sx={{
            ...itemBaseStyles,
            color: isActive
              ? theme.palette.primary.main
              : theme.palette.text.secondary,
            borderLeft: isActive ? "3px solid #4C6AD2" : "3px solid transparent",
            bgcolor: isActive ? "rgba(76,106,210,0.06)" : "transparent",
            "&:hover": {
              bgcolor: isActive ? "rgba(76,106,210,0.08)" : "rgba(15,23,42,0.02)",
            },
          }}
        >
          <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>{icon}</Box>
          <Typography sx={{ fontSize: 15, fontWeight: 500 }}>{label}</Typography>
        </Box>
      );
    };

    return (
      <Box
        component="aside"
        sx={{
          width: 260,
          height: "100vh",
          borderRight: "1px solid rgba(226,232,240,1)",
          bgcolor: "#FBFCFF",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            height: 72,
            px: 3,
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid rgba(226,232,240,1)",
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              mr: 1.5,
              background:
                "radial-gradient(circle at 0% 0%, #8CC2FF 0%, #4C6AD2 45%, #7F54D9 100%)",
            }}
          />
          <Typography
            sx={{ fontWeight: 700, fontSize: 18, letterSpacing: 0.1 }}
          >
            Silicon Plan
          </Typography>
        </Box>

        <Box sx={{ flex: 1, pt: 2 }}>
          {makeItem(
            "ai-documents",
            "AI Documents",
            <DescriptionOutlinedIcon sx={{ fontSize: 22 }} />,
          )}
          {makeItem(
            "consultants",
            "Consultants",
            <PersonOutlineOutlinedIcon sx={{ fontSize: 22 }} />,
          )}
          {makeItem(
            "bookings",
            "My Bookings",
            <BookmarkBorderOutlinedIcon sx={{ fontSize: 22 }} />,
          )}
          {makeItem(
            "session-history",
            "Session History",
            <HistoryOutlinedIcon sx={{ fontSize: 22 }} />,
          )}
          {makeItem(
            "learning",
            "Learning",
            <MenuBookOutlinedIcon sx={{ fontSize: 22 }} />,
          )}
        </Box>

        <Box
          sx={{
            borderTop: "1px solid rgba(226,232,240,1)",
            py: 1.5,
            mb: 1,
          }}
        >
          <Box
            onClick={() => setActiveNav("settings")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 3,
              cursor: "pointer",
              color:
                activeNav === "settings"
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
            }}
          >
            <SettingsOutlinedIcon sx={{ fontSize: 22 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 500 }}>
              Settings
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const topTabs = () => {
    const tabBaseStyles = {
      display: "inline-flex",
      alignItems: "center",
      gap: 1,
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      fontWeight: 600,
      fontSize: 13,
      px: 2,
      pb: 1.2,
      borderRadius: 0,
      borderBottomWidth: 2,
      borderBottomStyle: "solid",
      borderColor: "transparent",
      bgcolor: "transparent",
      boxShadow: "none",
      "&:hover": {
        bgcolor: "transparent",
      },
    };

    return (
      <Box
        sx={{
          width: "100%",
          borderBottom: "1px solid rgba(226,232,240,1)",
          display: "flex",
          justifyContent: "center",
          pt: 3,
          pb: 1,
          bgcolor: "#FFFFFF",
        }}
      >
        <Stack
          direction="row"
          spacing={6}
          alignItems="flex-end"
          justifyContent="center"
        >
          <Button
            disableRipple
            onClick={() => setActiveTab("create")}
            sx={{
              ...tabBaseStyles,
              color:
                activeTab === "create"
                  ? theme.palette.text.secondary
                  : theme.palette.text.primary,
              borderColor: activeTab === "create" ? "#4C6AD2" : "transparent",
            }}
          >
            <AddCircleOutlineRoundedIcon sx={{ fontSize: 20, mr: 0.5 }} />
            Create
          </Button>

          <Button
            disableRipple
            onClick={() => setActiveTab("myWorkspaces")}
            sx={{
              ...tabBaseStyles,
              color:
                activeTab === "myWorkspaces"
                  ? theme.palette.text.secondary
                  : theme.palette.text.primary,
              borderColor:
                activeTab === "myWorkspaces" ? "#4C6AD2" : "transparent",
            }}
          >
            <BusinessCenterOutlinedIcon sx={{ fontSize: 20, mr: 0.5 }} />
            My Workspaces (0)
          </Button>
        </Stack>
      </Box>
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitDisabled || !workspaceId) return;

    try {
      setSaving(true);

      const payload = {
        workspaceId,
        tagline: tagline || undefined,
        isOperating:
          isOperating === ""
            ? undefined
            : isOperating === "yes"
              ? true
              : false,
        industry: industry || undefined,
        companyStage: companyStage || undefined,
        problemShort: problemShort || undefined,
        problemLong: problemLong || undefined,
        solutionAndUniqueness: solutionAndUniqueness || undefined,
        teamAndRoles: teamAndRoles || undefined,
        financialProjections: financialProjections || undefined,
        risksAndMitigation: risksAndMitigation || undefined,
        successMetrics: successMetrics || undefined,
        growthPartnerships: growthPartnerships || undefined,
        rawFormData: {
          tagline,
          isOperating,
          industry,
          companyStage,
          problemShort,
          problemLong,
          solutionAndUniqueness,
          teamAndRoles,
          financialProjections,
          risksAndMitigation,
          successMetrics,
          growthPartnerships,
        },
      };

      const response = await fetch(
        `/api/workspaces/${workspaceId}/business-profile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save business profile");
      }

      const json = (await response.json()) as BusinessProfileResponse;

      if (json.redirectTo) {
        router.push(json.redirectTo);
      } else {
        router.push("/?tab=my-workspaces");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleIndustryChange = (event: SelectChangeEvent) => {
    setIndustry(event.target.value);
  };

  const handleStageChange = (event: SelectChangeEvent) => {
    setCompanyStage(event.target.value);
  };

  const handleProblemShortChange = (event: SelectChangeEvent) => {
    setProblemShort(event.target.value);
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        bgcolor: "#F7F8FC",
      }}
    >
      {sidebar()}

      <Box
        component="main"
        sx={{
          flex: 1,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#FFFFFF",
          minWidth: 0,
        }}
      >
        {topTabs()}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            minHeight: 0,
            bgcolor: "#FFFFFF",
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              width: "100%",
              minHeight: 0,
              justifyContent: "space-between",
            }}
          >
            <Box
              sx={{
                flex: "0 0 45%",
                bgcolor: "#FFFFFF",
                px: 6,
                pt: 6,
              }}
            >
              <Typography
                sx={{ fontSize: 26, fontWeight: 700, mb: 1.5, lineHeight: 1.3 }}
              >
                Tell us about your business
              </Typography>

              <Typography
                sx={{
                  fontSize: 16,
                  color: theme.palette.text.secondary,
                  mb: 3,
                }}
              >
                Fill in a short form — it only takes a minute.
              </Typography>

              <Box
                component="ul"
                sx={{
                  pl: 2.4,
                  mb: 4,
                  color: theme.palette.text.secondary,
                  fontSize: 15,
                  "& li": { mb: 1.1 },
                }}
              >
                <li>generate a tailored business plan;</li>
                <li>adjust the tone and structure to your needs;</li>
                <li>keep numbers and facts relevant to your case.</li>
              </Box>

              <Box
                sx={{
                  mt: 1,
                  p: 2.4,
                  borderRadius: 3,
                  bgcolor: "rgba(143, 152, 227, 0.12)",
                  color: theme.palette.text.secondary,
                  fontSize: 14,
                }}
              >
                Later you’ll be able to edit this business
                <br />
                or add more businesses anytime.
              </Box>
            </Box>

            <Box
              sx={{
                flex: "0 0 55%",
                bgcolor: "#F6F8FF",
                display: "flex",
                justifyContent: "center",
                minHeight: 0,
              }}
            >
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    flexShrink: 0,
                    pt: 5,
                    pb: 2,
                    px: 4,
                    borderBottom: "1px solid rgba(226,232,240,1)",
                    bgcolor: "#F6F8FF",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 22,
                      fontWeight: 700,
                    }}
                  >
                    Tell us about your business activities
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    px: 4,
                    pt: 3,
                    pb: 4,
                    minHeight: 0,
                    "&::-webkit-scrollbar": { display: "none" },
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <Box mb={3}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}
                    >
                      What&apos;s your business tagline?
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder={"Ex. McDonald's: I'm Lovin' It."}
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      InputProps={{ sx: inputBaseSx }}
                    />
                  </Box>
                  <Box mb={3}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}
                    >
                      Is this company currently in operation?
                    </Typography>
                    <RadioGroup
                      row
                      value={isOperating}
                      onChange={(_, value) => setIsOperating(value)}
                    >
                      <FormControlLabel
                        value="yes"
                        control={<Radio size="small" />}
                        label="Yes"
                      />
                      <FormControlLabel
                        value="no"
                        control={<Radio size="small" />}
                        label="No"
                      />
                    </RadioGroup>
                  </Box>
                  <Box mb={3}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}
                    >
                      Select an industry in which your company is operated
                    </Typography>
                    <Select
                      fullWidth
                      displayEmpty
                      value={industry}
                      onChange={handleIndustryChange}
                      sx={selectBaseSx}
                      renderValue={(selected) =>
                        selected ? selected : "Select"
                      }
                    >
                      <MenuItem disabled value="">
                        <Typography color="text.secondary">Select</Typography>
                      </MenuItem>
                      <MenuItem value="Business Software / SaaS">
                        Business Software / SaaS
                      </MenuItem>
                      <MenuItem value="E-commerce">E-commerce</MenuItem>
                      <MenuItem value="FinTech">FinTech</MenuItem>
                      <MenuItem value="Health & Wellness">
                        Health &amp; Wellness
                      </MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </Box>
                  <Box mb={3}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}
                    >
                      Company stage
                    </Typography>
                    <Select
                      fullWidth
                      displayEmpty
                      value={companyStage}
                      onChange={handleStageChange}
                      sx={selectBaseSx}
                      renderValue={(selected) =>
                        selected ? selected : "Select"
                      }
                    >
                      <MenuItem disabled value="">
                        <Typography color="text.secondary">Select</Typography>
                      </MenuItem>
                      <MenuItem value="Idea / Pre-seed">
                        Idea / Pre-seed
                      </MenuItem>
                      <MenuItem value="Early Growth (Seed to Series A)">
                        Early Growth (Seed to Series A)
                      </MenuItem>
                      <MenuItem value="Scale-up">Scale-up</MenuItem>
                      <MenuItem value="Established">Established</MenuItem>
                    </Select>
                  </Box>
                  <Box mb={3}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}
                    >
                      What problem do you solve, and for whom
                    </Typography>
                    <Select
                      fullWidth
                      displayEmpty
                      value={problemShort}
                      onChange={handleProblemShortChange}
                      sx={selectBaseSx}
                      renderValue={(selected) =>
                        selected ? selected : "Select"
                      }
                    >
                      <MenuItem disabled value="">
                        <Typography color="text.secondary">Select</Typography>
                      </MenuItem>
                      <MenuItem value="Founders who need structured business plans">
                        Founders who need structured business plans
                      </MenuItem>
                      <MenuItem value="Small businesses needing funding-ready docs">
                        Small businesses needing funding-ready docs
                      </MenuItem>
                      <MenuItem value="Consultants serving SME clients">
                        Consultants serving SME clients
                      </MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </Box>
                  <Box mb={3}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}
                    >
                      What problem do you solve, and for whom
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder="Describe"
                      value={problemLong}
                      onChange={(e) => setProblemLong(e.target.value)}
                      InputProps={{
                        sx: multilineFieldSx,
                        endAdornment: magicIconAdornment,
                      }}
                    />
                  </Box>
                  <Box mb={3}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}
                    >
                      What&apos;s your solution, and what makes it unique?
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder="Describe"
                      value={solutionAndUniqueness}
                      onChange={(e) =>
                        setSolutionAndUniqueness(e.target.value)
                      }
                      InputProps={{
                        sx: multilineFieldSx,
                        endAdornment: magicIconAdornment,
                      }}
                    />
                  </Box>
                  <Box mb={3}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}
                    >
                      Who&apos;s on your team, and what are their roles?
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder="Describe"
                      value={teamAndRoles}
                      onChange={(e) => setTeamAndRoles(e.target.value)}
                      InputProps={{
                        sx: multilineFieldSx,
                        endAdornment: magicIconAdornment,
                      }}
                    />
                  </Box>
                  <Box mb={3}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}
                    >
                      What are your 3–5 year financial projections?
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder="Describe"
                      value={financialProjections}
                      onChange={(e) =>
                        setFinancialProjections(e.target.value)
                      }
                      InputProps={{
                        sx: multilineFieldSx,
                        endAdornment: magicIconAdornment,
                      }}
                    />
                  </Box>
                  <Box mb={3}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}
                    >
                      What risks do you face, and how will you manage them?
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder="Describe"
                      value={risksAndMitigation}
                      onChange={(e) =>
                        setRisksAndMitigation(e.target.value)
                      }
                      InputProps={{
                        sx: multilineFieldSx,
                        endAdornment: magicIconAdornment,
                      }}
                    />
                  </Box>
                  <Box mb={3}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}
                    >
                      How will you measure success?
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder="Describe"
                      value={successMetrics}
                      onChange={(e) => setSuccessMetrics(e.target.value)}
                      InputProps={{
                        sx: multilineFieldSx,
                        endAdornment: magicIconAdornment,
                      }}
                    />
                  </Box>
                  <Box mb={1}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}
                    >
                      What partnerships will help your business grow?
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder="Describe"
                      value={growthPartnerships}
                      onChange={(e) =>
                        setGrowthPartnerships(e.target.value)
                      }
                      InputProps={{
                        sx: multilineFieldSx,
                        endAdornment: magicIconAdornment,
                      }}
                    />
                  </Box>
                </Box>
                <Box
                  sx={{
                    flexShrink: 0,
                    px: 4,
                    py: 3,
                    borderTop: "1px solid rgba(226,232,240,1)",
                    bgcolor: "#F6F8FF",
                  }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    disabled={isSubmitDisabled}
                    sx={{
                      borderRadius: 999,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: 16,
                      py: 1.6,
                      backgroundImage:
                        "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
                      color: "#FFFFFF",
                      boxShadow: "none",
                      "&.Mui-disabled": {
                        backgroundImage: "none",
                        backgroundColor: "#E5E7EB",
                        color: "#9CA3AF",
                      },
                      "&:hover": {
                        boxShadow: "none",
                        opacity: 0.96,
                        backgroundImage:
                          "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
                      },
                    }}
                  >
                    Create Workspace
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
