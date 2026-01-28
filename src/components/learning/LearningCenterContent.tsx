// src/components/learning/LearningCenterContent.tsx
"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import PlayCircleOutlinedIcon from "@mui/icons-material/PlayCircleOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import type { ReactNode } from "react";

type VideoInfo = {
  src: string;
  title: string;
};

type LearningTopic = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  badge?: string;
  videos?: VideoInfo[];
  steps: {
    title: string;
    content: string;
    tip?: string;
  }[];
};

const learningTopics: LearningTopic[] = [
  {
    id: "getting-started",
    title: "Getting Started with Silicon Plan",
    description:
      "Learn how to create your first workspace and set up your business profile.",
    icon: <RocketLaunchOutlinedIcon sx={{ fontSize: 24, color: "#4C6AD2" }} />,
    badge: "Start Here",
    videos: [
      {
        src: "/learning-videos/registering + creating .mp4",
        title: "Registration & Creating Your First Workspace",
      },
    ],
    steps: [
      {
        title: "Create Your Workspace",
        content:
          "On the main page, you'll find a form to create a new workspace. Simply fill in your workspace name to get started. This workspace will contain all your business documents, plans, and AI-generated content.",
        tip: "Choose a clear, descriptive name that represents your business or project.",
      },
      {
        title: "Fill in Your Business Information",
        content:
          "After naming your workspace, you'll be guided through a form to provide details about your company's activities. This business data helps our AI understand your context and generate more relevant, personalized content for your documents.",
        tip: "The more details you provide about your business, the better the AI-generated content will be.",
      },
      {
        title: "Edit Your Workspace Anytime",
        content:
          "You can always update your workspace information later. Go to 'My Workspaces' tab, find your workspace, and click 'Edit Workspace'. From there, you can modify your workspace name, upload a logo, update business data, or manage team members.",
      },
      {
        title: "Navigate the Platform",
        content:
          "Use the left sidebar to switch between AI Documents, Consultants, Bookings, and Learning. Each workspace has its own management area where you can access your Business Plan, Pitch Deck, and Canvas Models.",
      },
    ],
  },
  {
    id: "ai-documents",
    title: "Adding AI Documents & Knowledge",
    description:
      "Train the AI with your custom knowledge to get more accurate and personalized content.",
    icon: <AutoAwesomeOutlinedIcon sx={{ fontSize: 24, color: "#7B4FD6" }} />,
    videos: [
      {
        src: "/learning-videos/ai knowledge.mp4",
        title: "Using the AI Knowledge Library",
      },
    ],
    steps: [
      {
        title: "Access My Workspaces",
        content:
          "From the main page, click on the 'My Workspaces' tab to see all your created workspaces. This is where you'll manage your workspace settings and AI knowledge library.",
      },
      {
        title: "Open Workspace Settings",
        content:
          "Find the workspace you want to enhance with AI knowledge and click the 'Edit Workspace' button. This will open your workspace settings where you can configure various options.",
      },
      {
        title: "Navigate to AI Library",
        content:
          "In the workspace settings, look at the secondary sidebar on the left. Click on the 'AI Library' tab to access your AI knowledge management area. This is where all your custom knowledge and documents are stored.",
      },
      {
        title: "Add AI Knowledge Notes",
        content:
          "In the AI Library, you can add knowledge notes - these are text snippets that contain important information about your business, industry insights, competitive advantages, or any context you want the AI to consider when generating content.",
        tip: "Add specific details like your unique selling points, target audience characteristics, or industry terminology.",
      },
      {
        title: "Upload AI Documents",
        content:
          "You can also upload documents to your AI Library. The platform works best with PDF or TXT files. These documents will be analyzed and used by the AI to generate more accurate and contextually relevant content for your business plan, pitch deck, and canvas models.",
        tip: "Upload market research, competitor analysis, or existing business documents to give the AI richer context.",
      },
    ],
  },
  {
    id: "business-plan",
    title: "Creating & Editing Your Business Plan",
    description:
      "Master the business plan editor - work manually or let AI assist you in building a comprehensive plan.",
    icon: <DescriptionOutlinedIcon sx={{ fontSize: 24, color: "#4C6AD2" }} />,
    videos: [
      {
        src: "/learning-videos/business-plan1.mp4",
        title: "Business Plan Overview",
      },
      {
        src: "/learning-videos/business-plan2.mp4",
        title: "AI-Assisted Content Generation",
      },
      {
        src: "/learning-videos/business-plan3.mp4",
        title: "Advanced Editing Features",
      },
      {
        src: "/learning-videos/editing.mp4",
        title: "Manual Editing Tips",
      },
    ],
    steps: [
      {
        title: "Accessing the Business Plan Editor",
        content:
          "From your workspace, click 'Manage' on the workspace card, then select 'Business Plan' from the sidebar. The editor provides a structured approach to building your business plan with multiple sections.",
      },
      {
        title: "Understanding Plan Sections",
        content:
          "Your business plan is divided into key sections: Executive Summary, Company Description, Market Analysis, Organization & Management, Products/Services, Marketing Strategy, Financial Projections, and Funding Request. Each section can be edited independently.",
      },
      {
        title: "Manual Editing",
        content:
          "Click on any section to expand it and start typing. Use the rich text editor to format your content with headings, bullet points, and emphasis. Changes are saved automatically as you type.",
        tip: "Write your executive summary last - it should summarize all other sections.",
      },
      {
        title: "AI-Assisted Writing",
        content:
          "Look for the AI button in each section. Click it to generate content based on your workspace information. The AI will create a draft that you can then customize. You can regenerate as many times as needed.",
        tip: "Edit the AI-generated content to add your unique insights and specific details.",
      },
      {
        title: "Reviewing and Exporting",
        content:
          "Use the preview mode to see how your complete business plan looks. When ready, you can export your plan as a PDF document for sharing with investors, partners, or team members.",
      },
    ],
  },
  {
    id: "pitch-deck",
    title: "Building Compelling Pitch Decks",
    description:
      "Create professional pitch decks that tell your story and impress investors.",
    icon: <SlideshowOutlinedIcon sx={{ fontSize: 24, color: "#7B4FD6" }} />,
    videos: [
      {
        src: "/learning-videos/pitch-deck.mp4",
        title: "Creating Your Pitch Deck",
      },
    ],
    steps: [
      {
        title: "Starting Your Pitch Deck",
        content:
          "Access the Pitch Deck builder from your workspace management area. Click 'Pitch Deck' in the sidebar to begin. The builder provides a proven slide structure that covers all essential elements investors expect to see.",
      },
      {
        title: "Essential Slides Structure",
        content:
          "Your pitch deck includes: Title/Cover, Problem, Solution, Market Opportunity, Business Model, Traction, Team, Competition, Financials, and Ask/Call to Action. Each slide has a specific purpose in your narrative.",
        tip: "Keep each slide focused on one key message - less text, more impact.",
      },
      {
        title: "Designing Your Slides",
        content:
          "Use the slide editor to add content, images, and charts. The platform provides templates optimized for investor presentations. Focus on visual clarity and ensure your key points stand out.",
      },
      {
        title: "AI Content Generation",
        content:
          "Click the AI button on any slide to generate content suggestions. The AI uses your business plan and knowledge library to create relevant talking points. Review and customize the generated content to match your voice.",
      },
      {
        title: "Presenting and Sharing",
        content:
          "Preview your deck in presentation mode to practice. When ready, export as PDF or share a direct link. Track who views your deck and gather feedback to improve.",
        tip: "Practice your 3-minute and 10-minute versions of the pitch.",
      },
    ],
  },
  {
    id: "canvas-models",
    title: "Working with Canvas Models",
    description:
      "Use visual canvas models to map out your business strategy and validate your ideas.",
    icon: <GridViewOutlinedIcon sx={{ fontSize: 24, color: "#4C6AD2" }} />,
    videos: [
      {
        src: "/learning-videos/canvas-models.mp4",
        title: "Working with Canvas Models",
      },
    ],
    steps: [
      {
        title: "Understanding Canvas Models",
        content:
          "Canvas models are visual frameworks that help you think through different aspects of your business on a single page. They're great for brainstorming, planning, and communicating your strategy quickly.",
      },
      {
        title: "Business Model Canvas",
        content:
          "The Business Model Canvas covers 9 building blocks: Customer Segments, Value Propositions, Channels, Customer Relationships, Revenue Streams, Key Resources, Key Activities, Key Partners, and Cost Structure. Fill each block to map your entire business model.",
        tip: "Start with Customer Segments and Value Propositions - they're the foundation of your business model.",
      },
      {
        title: "Lean Canvas",
        content:
          "The Lean Canvas is optimized for startups and focuses on: Problem, Solution, Key Metrics, Unique Value Proposition, Unfair Advantage, Channels, Customer Segments, Cost Structure, and Revenue Streams.",
      },
      {
        title: "Using AI with Canvas",
        content:
          "Each canvas block has an AI assist option. Click the magic wand to generate suggestions for that specific block. The AI considers your other filled blocks to provide contextually relevant ideas.",
        tip: "Use AI suggestions as starting points, then refine based on your market knowledge.",
      },
      {
        title: "Iterating Your Canvas",
        content:
          "Canvas models are meant to evolve. Save different versions as you validate assumptions and learn from customers. Compare versions to track how your business model develops over time.",
      },
    ],
  },
];

type VideoPlayerProps = {
  video: VideoInfo;
};

function VideoPlayer({ video }: VideoPlayerProps) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "#000",
      }}
    >
      <video
        controls
        width="100%"
        style={{
          display: "block",
          maxHeight: 360,
        }}
      >
        <source src={video.src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <Box
        sx={{
          bgcolor: "#1E293B",
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <VideocamOutlinedIcon sx={{ fontSize: 18, color: "#94A3B8" }} />
        <Typography sx={{ fontSize: 13, color: "#E2E8F0", fontWeight: 500 }}>
          {video.title}
        </Typography>
      </Box>
    </Box>
  );
}

export default function LearningCenterContent() {
  const [expanded, setExpanded] = useState<string | false>("getting-started");

  const handleChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        bgcolor: "#F7F8FC",
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #4C6AD2 0%, #7B4FD6 100%)",
          px: 4,
          py: 5,
          color: "#FFFFFF",
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: "auto", px: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <PlayCircleOutlinedIcon sx={{ fontSize: 32 }} />
            <Typography sx={{ fontSize: 28, fontWeight: 700 }}>
              Learning Center
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: 16,
              opacity: 0.9,
              maxWidth: 700,
              lineHeight: 1.6,
            }}
          >
            Master Silicon Plan with our comprehensive guides and video
            tutorials. Learn how to create AI-powered business documents, build
            compelling pitch decks, and visualize your strategy with canvas
            models.
          </Typography>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: 4,
          mt: -3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 3,
            bgcolor: "#FFFFFF",
            borderRadius: 3,
            p: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography
              sx={{ fontSize: 28, fontWeight: 700, color: "#4C6AD2" }}
            >
              5
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#64748B" }}>
              Learning Topics
            </Typography>
          </Box>
          <Box
            sx={{ width: "1px", bgcolor: "#E2E8F0", alignSelf: "stretch", my: 1 }}
          />
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography
              sx={{ fontSize: 28, fontWeight: 700, color: "#7B4FD6" }}
            >
              8
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#64748B" }}>
              Video Tutorials
            </Typography>
          </Box>
          <Box
            sx={{ width: "1px", bgcolor: "#E2E8F0", alignSelf: "stretch", my: 1 }}
          />
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography
              sx={{ fontSize: 28, fontWeight: 700, color: "#4C6AD2" }}
            >
              24
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#64748B" }}>
              Step-by-Step Guides
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Learning Topics */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: 4,
          py: 5,
        }}
      >
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 600,
            mb: 3,
            color: "#1E293B",
          }}
        >
          Choose a Topic to Learn
        </Typography>

        {learningTopics.map((topic) => (
          <Accordion
            key={topic.id}
            expanded={expanded === topic.id}
            onChange={handleChange(topic.id)}
            disableGutters
            sx={{
              mb: 2,
              borderRadius: "16px !important",
              border: "1px solid #E2E8F0",
              boxShadow: "none",
              bgcolor: "#FFFFFF",
              "&:before": { display: "none" },
              "&.Mui-expanded": {
                borderColor: "#4C6AD2",
                boxShadow: "0 4px 20px rgba(76, 106, 210, 0.12)",
              },
              overflow: "hidden",
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "#64748B" }} />}
              sx={{
                px: 3,
                py: 1,
                "&.Mui-expanded": {
                  borderBottom: "1px solid #E2E8F0",
                },
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: "#F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {topic.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
                      {topic.title}
                    </Typography>
                    {topic.badge && (
                      <Chip
                        label={topic.badge}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: 11,
                          fontWeight: 600,
                          bgcolor: "#DCFCE7",
                          color: "#16A34A",
                        }}
                      />
                    )}
                    {topic.videos && topic.videos.length > 0 && (
                      <Chip
                        icon={
                          <VideocamOutlinedIcon
                            sx={{ fontSize: 14, color: "#4C6AD2 !important" }}
                          />
                        }
                        label={`${topic.videos.length} video${topic.videos.length > 1 ? "s" : ""}`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: 11,
                          fontWeight: 600,
                          bgcolor: "#EEF2FF",
                          color: "#4C6AD2",
                          "& .MuiChip-icon": {
                            marginLeft: "6px",
                          },
                        }}
                      />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: 13, color: "#64748B", mt: 0.5 }}>
                    {topic.description}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, py: 3 }}>
              {/* Video Section */}
              {topic.videos && topic.videos.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1E293B",
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <VideocamOutlinedIcon sx={{ fontSize: 18 }} />
                    Video Tutorial{topic.videos.length > 1 ? "s" : ""}
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        topic.videos.length === 1
                          ? "1fr"
                          : "repeat(2, 1fr)",
                      gap: 2,
                    }}
                  >
                    {topic.videos.map((video, idx) => (
                      <VideoPlayer key={idx} video={video} />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Steps Section */}
              <Box>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1E293B",
                    mb: 2,
                  }}
                >
                  Step-by-Step Guide
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {topic.steps.map((step, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #4C6AD2 0%, #7B4FD6 100%)",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "#1E293B",
                            mb: 1,
                          }}
                        >
                          {step.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 14,
                            color: "#475569",
                            lineHeight: 1.7,
                          }}
                        >
                          {step.content}
                        </Typography>
                        {step.tip && (
                          <Box
                            sx={{
                              mt: 2,
                              p: 2,
                              borderRadius: 2,
                              bgcolor: "#FEF3C7",
                              border: "1px solid #FDE68A",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#92400E",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 1,
                              }}
                            >
                              <Box
                                component="span"
                                sx={{ fontWeight: 600, flexShrink: 0 }}
                              >
                                Tip:
                              </Box>
                              {step.tip}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Need Help Section */}
        <Box
          sx={{
            mt: 4,
            p: 4,
            borderRadius: 3,
            bgcolor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 1 }}>
            Need More Help?
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#64748B", mb: 2 }}>
            Our team is here to assist you. Book a session with one of our
            consultants for personalized guidance.
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              color: "#4C6AD2",
              fontWeight: 500,
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Browse Consultants →
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
