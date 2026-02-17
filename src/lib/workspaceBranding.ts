// src/lib/workspaceBranding.ts
// Client-side helpers to load workspace branding for exports.

import type { Workspace } from "@/types/workspaces";

export type WorkspaceBranding = {
  workspaceName: string;
  logoUrl: string | null;
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read image data."));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read image data."));
    };
    reader.readAsDataURL(blob);
  });

export const fetchWorkspaceBranding = async (
  workspaceId: string
): Promise<WorkspaceBranding | null> => {
  try {
    const response = await fetch(`/api/workspaces/${workspaceId}`);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { workspace?: Workspace };
    const workspace = payload.workspace;
    if (!workspace) {
      return null;
    }

    return {
      workspaceName: workspace.name,
      logoUrl: workspace.image_url,
    };
  } catch {
    return null;
  }
};

export const fetchImageAsDataUrl = async (
  imageUrl: string | null | undefined
): Promise<string | null> => {
  if (!imageUrl) return null;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
};

export const fetchImageAsUint8Array = async (
  imageUrl: string | null | undefined
): Promise<Uint8Array | null> => {
  if (!imageUrl) return null;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return null;
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
};
