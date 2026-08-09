"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { type GenericId } from "convex/values";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Mirrors the server-side allowlist in convex/avatars.ts (no SVG - XSS).
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

type AvatarUploaderProps = {
  image: string | null | undefined;
  name: string;
  onAvatarChanged: () => Promise<void> | void;
};

export function AvatarUploader({
  image,
  name,
  onAvatarChanged,
}: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.avatars.generateAvatarUploadUrl);
  const setAvatar = useMutation(api.avatars.setAvatar);
  const removeAvatar = useMutation(api.avatars.removeAvatar);

  const initial = (name || "U").charAt(0).toUpperCase();
  const current = preview ?? image;

  async function handleFile(file: File) {
    setError(null);

    // Fast client-side checks (the server re-validates).
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only PNG, JPEG, WEBP or GIF images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) {
        throw new Error("Upload failed. Please try again.");
      }
      const data = (await result.json()) as { storageId: string };
      const storageId = data.storageId as GenericId<"_storage">;
      const url = await setAvatar({ storageId });
      // Show the new image immediately; the session refetch below
      // converges on the same URL, so there's no flash of the old one.
      setPreview(url ?? null);
      await onAvatarChanged();
      setPreview(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't upload the image.",
      );
    } finally {
      URL.revokeObjectURL(objectUrl);
      setUploading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setUploading(true);
    try {
      await removeAvatar();
      await onAvatarChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't remove the image.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-20 rounded-lg">
          {current ? (
            <AvatarImage src={current} alt={name} />
          ) : (
            <AvatarFallback className="rounded-lg text-xl">
              {initial}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-col items-start gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {uploading ? "Uploading…" : "Change photo"}
            </Button>
            {image && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                disabled={uploading}
                onClick={() => void handleRemove()}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            JPG, PNG, WEBP or GIF - 5 MB max.
          </p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          // Allow re-selecting the same file later.
          event.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
