// src/components/workspaceManage/pitch-deck/SlidePreview.tsx
"use client";

import type { FC, ReactNode, CSSProperties } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import conceptBg from "@/assets/deck-bg/1.png";
import prototypeBg from "@/assets/deck-bg/2.png";
import growthBg from "@/assets/deck-bg/3.png";
import impactBg from "@/assets/deck-bg/4.png";
import innovationBg from "@/assets/deck-bg/5.png";
import corporateBg from "@/assets/deck-bg/6.png";
import type {
  PitchDeckSlide,
  PitchDeckTemplate,
  PitchDeckSlideContent,
  PitchDeckTitleOnlyContent,
  PitchDeckTitleBulletsContent,
  PitchDeckTitleImageContent,
  PitchDeckTitleTextContent,
  PitchDeckTwoColumnsContent,
  PitchDeckComparisonContent,
  PitchDeckTimelineContent,
  PitchDeckTeamGridContent,
  PitchDeckMetricsContent,
  PitchDeckQuoteContent,
} from "@/types/workspaces";

type SlidePreviewProps = {
  slide: PitchDeckSlide;
  template: PitchDeckTemplate | null;
  paperSize?: "16:9" | "4:3" | "A4";
  onEditRequest?: (target: SlideEditTarget) => void;
  workspaceName?: string | null;
  workspaceLogoDataUrl?: string | null;
};

export type SlideEditTarget = {
  slideId: string;
  label: string;
  text: string;
  formatHint?: string;
  apply: (text: string) => PitchDeckSlideContent;
};

const TEMPLATE_BG_MAP = {
  concept: conceptBg.src,
  prototype: prototypeBg.src,
  growth: growthBg.src,
  impact: impactBg.src,
  innovation: innovationBg.src,
  corporate: corporateBg.src,
} as const;

const getTemplateBackgroundImage = (template: PitchDeckTemplate | null): string | null => {
  const name = template?.name?.toLowerCase() ?? "";
  if (!name) return null;
  if (name.includes("concept")) return TEMPLATE_BG_MAP.concept;
  if (name.includes("prototype")) return TEMPLATE_BG_MAP.prototype;
  if (name.includes("growth")) return TEMPLATE_BG_MAP.growth;
  if (name.includes("impact")) return TEMPLATE_BG_MAP.impact;
  if (name.includes("innovation")) return TEMPLATE_BG_MAP.innovation;
  if (name.includes("corporate")) return TEMPLATE_BG_MAP.corporate;
  return null;
};

const parseLines = (value: string): string[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const serializeTable = (headers: string[], rows: string[][]): string => {
  const headerLine = headers.join(" | ");
  const rowLines = rows.map((row) => row.join(" | "));
  return [headerLine, ...rowLines].filter((line) => line.trim().length > 0).join("\n");
};

const parseTable = (text: string): { headers: string[]; rows: string[][] } => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  const splitLine = (line: string) => {
    if (line.includes("|")) {
      return line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
    }
    if (line.includes("\t")) {
      return line
        .split("\t")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
    }
    return line.split(",").map((cell) => cell.trim());
  };
  const headers = splitLine(lines[0] ?? "");
  const rows = lines.slice(1).map((line) => splitLine(line));
  return { headers, rows };
};

const AiEditable: FC<{
  onEdit?: () => void;
  fullWidth?: boolean;
  children: ReactNode;
}> = ({ onEdit, fullWidth = false, children }) => {
  if (!onEdit) return <>{children}</>;
  return (
    <Box
      sx={{
        position: "relative",
        display: fullWidth ? "block" : "inline-block",
        "&:hover .ai-edit-button": {
          opacity: 1,
          pointerEvents: "auto",
        },
      }}
    >
      {children}
      <IconButton
        size="small"
        className="ai-edit-button"
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
        sx={{
          position: "absolute",
          top: -10,
          right: -10,
          bgcolor: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 6px 16px rgba(15, 23, 42, 0.15)",
          opacity: 0,
          pointerEvents: "none",
          transition: "opacity 0.15s ease",
          "&:hover": {
            bgcolor: "#EEF2FF",
          },
        }}
      >
        <AutoFixHighRoundedIcon sx={{ fontSize: 16, color: "#4C6AD2" }} />
      </IconButton>
    </Box>
  );
};

// Get background style from template
const getBackgroundStyle = (
  template: PitchDeckTemplate | null,
  isCover: boolean
): CSSProperties => {
  const backgroundImage = getTemplateBackgroundImage(template);
  if (backgroundImage) {
    return {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }

  const design = isCover ? template?.cover_design : template?.slide_design;
  const bg = design?.background;

  if (!bg) {
    return {
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    };
  }

  if (bg.type === "gradient" && bg.gradient) {
    return { background: bg.gradient };
  }

  if (bg.type === "solid" && bg.color) {
    return { backgroundColor: bg.color };
  }

  return {
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  };
};

// Get text colors from template
const getTextColors = (template: PitchDeckTemplate | null, isCover: boolean) => {
  const design = isCover ? template?.cover_design : template?.slide_design;

  return {
    title: design?.titleStyle?.color ?? "#FFFFFF",
    content: isCover ? design?.titleStyle?.color : template?.slide_design?.contentStyle?.color ?? "#E5E7EB",
  };
};

const SlideBranding: FC<{
  workspaceName?: string | null;
  workspaceLogoDataUrl?: string | null;
}> = ({ workspaceName, workspaceLogoDataUrl }) => {
  const hasName = Boolean(workspaceName && workspaceName.trim().length > 0);
  const hasLogo = Boolean(workspaceLogoDataUrl);

  if (!hasName && !hasLogo) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 5,
        maxWidth: "38%",
        px: 1,
        py: 0.5,
        borderRadius: 1.2,
        bgcolor: "rgba(255,255,255,0.84)",
        border: "1px solid rgba(148, 163, 184, 0.36)",
        backdropFilter: "blur(3px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 0.25,
        pointerEvents: "none",
      }}
    >
      {hasLogo ? (
          <Box
          component="img"
          src={workspaceLogoDataUrl ?? undefined}
          alt={workspaceName?.trim() ?? "Workspace Logo"}
          sx={{
            maxWidth: 120,
            maxHeight: 22,
            objectFit: "contain",
          }}
        />
      ) : null}
      {hasName ? (
        <Typography
          sx={{
            fontSize: 10,
            lineHeight: 1.1,
            fontWeight: 700,
            color: "#334155",
            textTransform: "uppercase",
            letterSpacing: 0.3,
            textAlign: "right",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {workspaceName!.trim()}
        </Typography>
      ) : null}
    </Box>
  );
};

// Content renderers for each slide type
const TitleOnlyContent: FC<{
  content: PitchDeckTitleOnlyContent;
  colors: { title: string; content: string | undefined };
  onEdit?: (target: SlideEditTarget) => void;
  slideId: string;
}> = ({ content, colors, onEdit, slideId }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      textAlign: "center",
      px: 6,
    }}
  >
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Title",
                text: content.title,
                apply: (text) => ({ ...content, title: text }),
              })
          : undefined
      }
    >
      <Typography
        sx={{
          fontSize: 36,
          fontWeight: 700,
          color: colors.title,
          mb: content.subtitle ? 2 : 0,
        }}
      >
        {content.title}
      </Typography>
    </AiEditable>
    {content.subtitle ? (
      <AiEditable
        onEdit={
          onEdit
            ? () =>
                onEdit({
                  slideId,
                  label: "Subtitle",
                  text: content.subtitle ?? "",
                  apply: (text) => ({ ...content, subtitle: text }),
                })
            : undefined
        }
      >
        <Typography sx={{ fontSize: 18, color: colors.content, opacity: 0.8 }}>
          {content.subtitle}
        </Typography>
      </AiEditable>
    ) : null}
  </Box>
);

const TitleBulletsContent: FC<{
  content: PitchDeckTitleBulletsContent;
  colors: { title: string; content: string | undefined };
  onEdit?: (target: SlideEditTarget) => void;
  slideId: string;
}> = ({ content, colors, onEdit, slideId }) => (
  <Box sx={{ p: 5, height: "100%" }}>
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Title",
                text: content.title,
                apply: (text) => ({ ...content, title: text }),
              })
          : undefined
      }
      fullWidth
    >
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 600,
          color: colors.title,
          mb: 4,
          borderBottom: `1px solid ${colors.title}20`,
          pb: 2,
        }}
      >
        {content.title}
      </Typography>
    </AiEditable>
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Bullets",
                text: content.bullets.join("\n"),
                formatHint: "Return one bullet per line.",
                apply: (text) => ({ ...content, bullets: parseLines(text) }),
              })
          : undefined
      }
      fullWidth
    >
      <Box component="ul" sx={{ m: 0, pl: 3 }}>
        {content.bullets.map((bullet, idx) => (
          <Box
            component="li"
            key={idx}
            sx={{
              color: colors.content,
              fontSize: 16,
              mb: 2,
              lineHeight: 1.6,
              borderBottom: `1px solid ${colors.content}15`,
              pb: 2,
              listStyle: "none",
              "&::before": {
                content: '""',
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: colors.title,
                mr: 2,
                verticalAlign: "middle",
              },
            }}
          >
            {bullet}
          </Box>
        ))}
      </Box>
    </AiEditable>
  </Box>
);

const TitleTextContent: FC<{
  content: PitchDeckTitleTextContent;
  colors: { title: string; content: string | undefined };
  onEdit?: (target: SlideEditTarget) => void;
  slideId: string;
}> = ({ content, colors, onEdit, slideId }) => (
  <Box sx={{ p: 5, height: "100%" }}>
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Title",
                text: content.title,
                apply: (text) => ({ ...content, title: text }),
              })
          : undefined
      }
      fullWidth
    >
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 600,
          color: colors.title,
          mb: 3,
        }}
      >
        {content.title}
      </Typography>
    </AiEditable>
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Body text",
                text: content.text,
                apply: (text) => ({ ...content, text }),
              })
          : undefined
      }
      fullWidth
    >
      <Typography
        sx={{
          fontSize: 16,
          color: colors.content,
          lineHeight: 1.8,
        }}
      >
        {content.text}
      </Typography>
    </AiEditable>
  </Box>
);

const TitleImageContent: FC<{
  content: PitchDeckTitleImageContent;
  colors: { title: string; content: string | undefined };
  onEdit?: (target: SlideEditTarget) => void;
  slideId: string;
}> = ({ content, colors, onEdit, slideId }) => {
  const isColumn = content.imagePosition === "top" || content.imagePosition === "bottom";
  const isImageFirst = content.imagePosition === "top" || content.imagePosition === "left";

  const imageBox = content.imageUrl ? (
    <Box
      component="img"
      src={content.imageUrl}
      alt={content.imageAlt ?? "Slide image"}
      sx={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: 2,
        border: `1px solid ${colors.content}30`,
      }}
    />
  ) : (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        borderRadius: 2,
        border: `1px dashed ${colors.content}40`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.content,
        fontSize: 13,
      }}
    >
      No image provided
    </Box>
  );

  const textBox = (
    <Box sx={{ flex: 1 }}>
      <AiEditable
        onEdit={
          onEdit
            ? () =>
                onEdit({
                  slideId,
                  label: "Title",
                  text: content.title,
                  apply: (text) => ({ ...content, title: text }),
                })
            : undefined
        }
      >
        <Typography
          sx={{
            fontSize: 28,
            fontWeight: 600,
            color: colors.title,
            mb: 2,
          }}
        >
          {content.title}
        </Typography>
      </AiEditable>
      {content.imageAlt ? (
        <AiEditable
          onEdit={
            onEdit
              ? () =>
                  onEdit({
                    slideId,
                    label: "Image caption",
                    text: content.imageAlt ?? "",
                    apply: (text) => ({ ...content, imageAlt: text }),
                  })
              : undefined
          }
        >
          <Typography sx={{ fontSize: 14, color: colors.content, opacity: 0.8 }}>
            {content.imageAlt}
          </Typography>
        </AiEditable>
      ) : null}
    </Box>
  );

  return (
    <Box
      sx={{
        p: 5,
        height: "100%",
        display: "flex",
        flexDirection: isColumn ? "column" : "row",
        gap: 4,
        alignItems: "stretch",
      }}
    >
      {isImageFirst ? imageBox : textBox}
      {isImageFirst ? textBox : imageBox}
    </Box>
  );
};

const TwoColumnsContent: FC<{
  content: PitchDeckTwoColumnsContent;
  colors: { title: string; content: string | undefined };
  onEdit?: (target: SlideEditTarget) => void;
  slideId: string;
}> = ({ content, colors, onEdit, slideId }) => (
  <Box sx={{ p: 5, height: "100%" }}>
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Title",
                text: content.title,
                apply: (text) => ({ ...content, title: text }),
              })
          : undefined
      }
      fullWidth
    >
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 600,
          color: colors.title,
          mb: 4,
        }}
      >
        {content.title}
      </Typography>
    </AiEditable>
    <Box sx={{ display: "flex", gap: 4 }}>
      {[content.leftColumn, content.rightColumn].map((col, idx) => (
        <Box key={idx} sx={{ flex: 1 }}>
          {col.title ? (
            <AiEditable
              onEdit={
                onEdit
                  ? () =>
                      onEdit({
                        slideId,
                        label: idx === 0 ? "Left column title" : "Right column title",
                        text: col.title ?? "",
                        apply: (text) => ({
                          ...content,
                          [idx === 0 ? "leftColumn" : "rightColumn"]: {
                            ...col,
                            title: text,
                          },
                        }),
                      })
                  : undefined
              }
            >
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: colors.title,
                  mb: 2,
                }}
              >
                {col.title}
              </Typography>
            </AiEditable>
          ) : null}
          {col.text ? (
            <AiEditable
              onEdit={
                onEdit
                  ? () =>
                      onEdit({
                        slideId,
                        label: idx === 0 ? "Left column text" : "Right column text",
                        text: col.text ?? "",
                        apply: (text) => ({
                          ...content,
                          [idx === 0 ? "leftColumn" : "rightColumn"]: {
                            ...col,
                            text,
                          },
                        }),
                      })
                  : undefined
              }
              fullWidth
            >
              <Typography sx={{ fontSize: 14, color: colors.content, lineHeight: 1.6 }}>
                {col.text}
              </Typography>
            </AiEditable>
          ) : null}
          {col.bullets?.length ? (
            <AiEditable
              onEdit={
                onEdit
                  ? () =>
                      onEdit({
                        slideId,
                        label: idx === 0 ? "Left column bullets" : "Right column bullets",
                        text: col.bullets?.join("\n") ?? "",
                        formatHint: "Return one bullet per line.",
                        apply: (text) => ({
                          ...content,
                          [idx === 0 ? "leftColumn" : "rightColumn"]: {
                            ...col,
                            bullets: parseLines(text),
                          },
                        }),
                      })
                  : undefined
              }
              fullWidth
            >
              <Box>
                {col.bullets?.map((bullet, bidx) => (
                  <Typography
                    key={bidx}
                    sx={{
                      fontSize: 14,
                      color: colors.content,
                      mb: 1,
                      pl: 2,
                      "&::before": { content: '"• "' },
                    }}
                  >
                    {bullet}
                  </Typography>
                ))}
              </Box>
            </AiEditable>
          ) : null}
        </Box>
      ))}
    </Box>
  </Box>
);

const ComparisonContent: FC<{
  content: PitchDeckComparisonContent;
  colors: { title: string; content: string | undefined };
  onEdit?: (target: SlideEditTarget) => void;
  slideId: string;
}> = ({ content, colors, onEdit, slideId }) => (
  <Box sx={{ p: 5, height: "100%" }}>
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Title",
                text: content.title,
                apply: (text) => ({ ...content, title: text }),
              })
          : undefined
      }
      fullWidth
    >
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 600,
          color: colors.title,
          mb: 4,
        }}
      >
        {content.title}
      </Typography>
    </AiEditable>
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Table",
                text: serializeTable(content.headers, content.rows),
                formatHint:
                  "Return a table with the first line as headers and each next line as a row, using ' | ' as the separator.",
                apply: (text) => {
                  const parsed = parseTable(text);
                  const headers = parsed.headers.length > 0 ? parsed.headers : content.headers;
                  const rows = parsed.rows.map((row) => {
                    if (headers.length === 0) return row;
                    const next = row.slice(0, headers.length);
                    while (next.length < headers.length) next.push("");
                    return next;
                  });
                  return { ...content, headers, rows };
                },
              })
          : undefined
      }
      fullWidth
    >
      <Box sx={{ border: `1px solid ${colors.content}30`, borderRadius: 1, overflow: "hidden" }}>
        <Box sx={{ display: "flex", bgcolor: `${colors.title}20` }}>
          {content.headers.map((header, idx) => (
            <Box
              key={idx}
              sx={{
                flex: 1,
                p: 2,
                borderRight: idx < content.headers.length - 1 ? `1px solid ${colors.content}30` : "none",
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.title }}>
                {header}
              </Typography>
            </Box>
          ))}
        </Box>
        {content.rows.map((row, ridx) => (
          <Box key={ridx} sx={{ display: "flex", borderTop: `1px solid ${colors.content}30` }}>
            {row.map((cell, cidx) => (
              <Box
                key={cidx}
                sx={{
                  flex: 1,
                  p: 2,
                  borderRight: cidx < row.length - 1 ? `1px solid ${colors.content}30` : "none",
                }}
              >
                <Typography sx={{ fontSize: 13, color: colors.content }}>{cell}</Typography>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </AiEditable>
  </Box>
);

const TimelineContent: FC<{
  content: PitchDeckTimelineContent;
  colors: { title: string; content: string | undefined };
  onEdit?: (target: SlideEditTarget) => void;
  slideId: string;
}> = ({ content, colors, onEdit, slideId }) => (
  <Box sx={{ p: 5, height: "100%" }}>
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Title",
                text: content.title,
                apply: (text) => ({ ...content, title: text }),
              })
          : undefined
      }
      fullWidth
    >
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 600,
          color: colors.title,
          mb: 4,
        }}
      >
        {content.title}
      </Typography>
    </AiEditable>
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Timeline",
                text: content.entries
                  .map((entry) => [entry.date, entry.title, entry.description ?? ""].join(" | "))
                  .join("\n"),
                formatHint: "One entry per line: date | title | description",
                apply: (text) => ({
                  ...content,
                  entries: parseLines(text).map((line) => {
                    const [date, title, description] = line.split("|").map((item) => item.trim());
                    return {
                      date: date ?? "",
                      title: title ?? "",
                      description: description && description.length > 0 ? description : undefined,
                    };
                  }),
                }),
              })
          : undefined
      }
      fullWidth
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {content.entries.map((entry, idx) => (
          <Box key={idx} sx={{ display: "flex", gap: 3 }}>
            <Box
              sx={{
                width: 80,
                flexShrink: 0,
                textAlign: "right",
                color: colors.title,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {entry.date}
            </Box>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: colors.title,
                mt: 0.5,
                flexShrink: 0,
              }}
            />
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: colors.title }}>
                {entry.title}
              </Typography>
              {entry.description ? (
                <Typography sx={{ fontSize: 13, color: colors.content, mt: 0.5 }}>
                  {entry.description}
                </Typography>
              ) : null}
            </Box>
          </Box>
        ))}
      </Box>
    </AiEditable>
  </Box>
);

const TeamGridContent: FC<{
  content: PitchDeckTeamGridContent;
  colors: { title: string; content: string | undefined };
  onEdit?: (target: SlideEditTarget) => void;
  slideId: string;
}> = ({ content, colors, onEdit, slideId }) => (
  <Box sx={{ p: 5, height: "100%" }}>
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Title",
                text: content.title,
                apply: (text) => ({ ...content, title: text }),
              })
          : undefined
      }
      fullWidth
    >
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 600,
          color: colors.title,
          mb: 4,
        }}
      >
        {content.title}
      </Typography>
    </AiEditable>
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Team members",
                text: content.members
                  .map((member) => [member.name, member.role, member.bio ?? ""].join(" | "))
                  .join("\n"),
                formatHint: "One member per line: name | role | bio",
                apply: (text) => ({
                  ...content,
                  members: parseLines(text).map((line) => {
                    const [name, role, bio] = line.split("|").map((item) => item.trim());
                    return {
                      name: name ?? "",
                      role: role ?? "",
                      bio: bio && bio.length > 0 ? bio : undefined,
                    };
                  }),
                }),
              })
          : undefined
      }
      fullWidth
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {content.members.map((member, idx) => (
          <Box key={idx} sx={{ width: "calc(50% - 12px)", textAlign: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: `${colors.title}30`,
                mx: "auto",
                mb: 1,
              }}
            />
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: colors.title }}>
              {member.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: colors.content }}>{member.role}</Typography>
          </Box>
        ))}
      </Box>
    </AiEditable>
  </Box>
);

const MetricsContent: FC<{
  content: PitchDeckMetricsContent;
  colors: { title: string; content: string | undefined };
  onEdit?: (target: SlideEditTarget) => void;
  slideId: string;
}> = ({ content, colors, onEdit, slideId }) => (
  <Box sx={{ p: 5, height: "100%" }}>
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Title",
                text: content.title,
                apply: (text) => ({ ...content, title: text }),
              })
          : undefined
      }
      fullWidth
    >
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 600,
          color: colors.title,
          mb: 4,
        }}
      >
        {content.title}
      </Typography>
    </AiEditable>
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Metrics",
                text: content.metrics
                  .map((metric) => [metric.value, metric.label, metric.description ?? ""].join(" | "))
                  .join("\n"),
                formatHint: "One metric per line: value | label | description",
                apply: (text) => ({
                  ...content,
                  metrics: parseLines(text).map((line) => {
                    const [value, label, description] = line.split("|").map((item) => item.trim());
                    return {
                      value: value ?? "",
                      label: label ?? "",
                      description: description && description.length > 0 ? description : undefined,
                    };
                  }),
                }),
              })
          : undefined
      }
      fullWidth
    >
      <Box sx={{ display: "flex", gap: 4, justifyContent: "center" }}>
        {content.metrics.map((metric, idx) => (
          <Box key={idx} sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: 36, fontWeight: 700, color: colors.title }}>
              {metric.value}
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.content }}>
              {metric.label}
            </Typography>
            {metric.description ? (
              <Typography sx={{ fontSize: 12, color: colors.content, opacity: 0.7, mt: 0.5 }}>
                {metric.description}
              </Typography>
            ) : null}
          </Box>
        ))}
      </Box>
    </AiEditable>
  </Box>
);

const QuoteContent: FC<{
  content: PitchDeckQuoteContent;
  colors: { title: string; content: string | undefined };
  onEdit?: (target: SlideEditTarget) => void;
  slideId: string;
}> = ({ content, colors, onEdit, slideId }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      textAlign: "center",
      px: 8,
    }}
  >
    <AiEditable
      onEdit={
        onEdit
          ? () =>
              onEdit({
                slideId,
                label: "Quote",
                text: content.quote,
                apply: (text) => ({ ...content, quote: text }),
              })
          : undefined
      }
    >
      <Typography
        sx={{
          fontSize: 24,
          fontStyle: "italic",
          color: colors.title,
          mb: 3,
          "&::before": { content: '"""', fontSize: 48, opacity: 0.3 },
        }}
      >
        {content.quote}
      </Typography>
    </AiEditable>
    {content.author ? (
      <AiEditable
        onEdit={
          onEdit
            ? () =>
                onEdit({
                  slideId,
                  label: "Author",
                  text: [content.author, content.authorTitle ?? ""].filter(Boolean).join(" | "),
                  formatHint: "Return as: author | author title",
                  apply: (text) => {
                    const [author, authorTitle] = text.split("|").map((item) => item.trim());
                    return {
                      ...content,
                      author: author ?? "",
                      authorTitle: authorTitle && authorTitle.length > 0 ? authorTitle : undefined,
                    };
                  },
                })
            : undefined
        }
      >
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: colors.content }}>
          — {content.author}
          {content.authorTitle ? `, ${content.authorTitle}` : ""}
        </Typography>
      </AiEditable>
    ) : null}
  </Box>
);

// Main component
const SlidePreview: FC<SlidePreviewProps> = ({
  slide,
  template,
  paperSize = "16:9",
  onEditRequest,
  workspaceName,
  workspaceLogoDataUrl,
}) => {
  const isCover = slide.slide_type === "cover";
  const backgroundStyle = getBackgroundStyle(template, isCover);
  const colors = getTextColors(template, isCover);
  const aspectRatio = paperSize === "4:3" ? "4 / 3" : paperSize === "A4" ? "1 / 1.414" : "16 / 9";

  const renderContent = (content: PitchDeckSlideContent) => {
    switch (content.type) {
      case "title_only":
        return (
          <TitleOnlyContent
            content={content}
            colors={colors}
            onEdit={onEditRequest}
            slideId={slide.id}
          />
        );
      case "title_bullets":
        return (
          <TitleBulletsContent
            content={content}
            colors={colors}
            onEdit={onEditRequest}
            slideId={slide.id}
          />
        );
      case "title_image":
        return (
          <TitleImageContent
            content={content}
            colors={colors}
            onEdit={onEditRequest}
            slideId={slide.id}
          />
        );
      case "title_text":
        return (
          <TitleTextContent
            content={content}
            colors={colors}
            onEdit={onEditRequest}
            slideId={slide.id}
          />
        );
      case "two_columns":
        return (
          <TwoColumnsContent
            content={content}
            colors={colors}
            onEdit={onEditRequest}
            slideId={slide.id}
          />
        );
      case "comparison":
        return (
          <ComparisonContent
            content={content}
            colors={colors}
            onEdit={onEditRequest}
            slideId={slide.id}
          />
        );
      case "timeline":
        return (
          <TimelineContent
            content={content}
            colors={colors}
            onEdit={onEditRequest}
            slideId={slide.id}
          />
        );
      case "team_grid":
        return (
          <TeamGridContent
            content={content}
            colors={colors}
            onEdit={onEditRequest}
            slideId={slide.id}
          />
        );
      case "metrics":
        return (
          <MetricsContent
            content={content}
            colors={colors}
            onEdit={onEditRequest}
            slideId={slide.id}
          />
        );
      case "quote":
        return (
          <QuoteContent
            content={content}
            colors={colors}
            onEdit={onEditRequest}
            slideId={slide.id}
          />
        );
      case "blank":
        return null;
      default:
        return (
          <Box sx={{ p: 5 }}>
            <Typography sx={{ color: colors.title }}>Unsupported content type</Typography>
          </Box>
        );
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        aspectRatio,
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: "0 14px 32px rgba(15, 23, 42, 0.18)",
        border: "1px solid #E2E8F0",
        backgroundColor: "#FFFFFF",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          ...backgroundStyle,
        }}
      >
        <SlideBranding
          workspaceName={workspaceName}
          workspaceLogoDataUrl={workspaceLogoDataUrl}
        />
        {renderContent(slide.content)}
      </Box>
    </Box>
  );
};

export default SlidePreview;
