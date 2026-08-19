"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { type GenericId } from "convex/values";
import { Camera, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AvatarCropDialog } from "./avatar-crop-dialog";

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
  const t = useTranslations("avatar");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropUrl, setCropUrl] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.avatars.generateAvatarUploadUrl);
  const setAvatar = useMutation(api.avatars.setAvatar);
  const removeAvatar = useMutation(api.avatars.removeAvatar);

  const initial = (name || "U").charAt(0).toUpperCase();
  const current = preview ?? image;

  // Revoke any leftover crop object URL if we unmount mid-editor.
  useEffect(() => {
    return () => {
      if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
    };
  }, []);

  /** Validate the picked file, then open the crop editor (no upload yet). */
  function handleFile(file: File) {
    if (uploading) return; // ignore drops while an upload is in flight
    setError(null);

    // Fast client-side checks (the server re-validates).
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t("invalidType"));
      // The error renders inside the photo dialog - open it if a bad file
      // was dropped straight onto the avatar so the message is visible.
      setPhotoOpen(true);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(t("tooLarge"));
      setPhotoOpen(true);
      return;
    }

    if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
    const url = URL.createObjectURL(file);
    cropUrlRef.current = url;
    setCropUrl(url);
    // Close the photo dialog so the crop editor can open on top of it.
    setPhotoOpen(false);
    setCropOpen(true);
  }

  function closeEditor() {
    setCropOpen(false);
    setCropUrl(null);
    const url = cropUrlRef.current;
    cropUrlRef.current = null;
    if (url) {
      // Defer so the closing dialog's <img> can finish fading out before
      // its object URL is revoked.
      setTimeout(() => URL.revokeObjectURL(url), 250);
    }
  }

  /** Upload the cropped avatar (a WebP from the canvas, PNG fallback).
   *  Errors are re-thrown so the crop dialog can display them above the
   *  modal. */
  async function handleSaveCrop(blob: Blob) {
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      // The content type sent here is what Convex records for the stored
      // file - send the blob's real type (image/webp, or image/png where
      // WebP encoding isn't available) so the server allowlist passes.
      const contentType = blob.type || "image/webp";
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: blob,
      });
      if (!result.ok) {
        throw new Error(t("uploadFailed"));
      }
      const data = (await result.json()) as { storageId: string };
      const storageId = data.storageId as GenericId<"_storage">;
      const url = await setAvatar({ storageId });
      // Show the new image immediately; the session refetch below
      // converges on the same URL, so there's no flash of the old one.
      setPreview(url ?? null);
      await onAvatarChanged();
      setPreview(null);
      closeEditor();
    } finally {
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
      setError(err instanceof Error ? err.message : t("removeFailed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "-m-1.5 rounded-xl p-1.5 transition-colors",
          dragging && "bg-primary/5 ring-primary/50 ring-2 ring-inset",
        )}
        onDragOver={(event) => {
          if (uploading) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          // Ignore leaving into a child element - only clear when the
          // pointer actually leaves the drop zone.
          if (event.currentTarget.contains(event.relatedTarget as Node)) {
            return;
          }
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
      >
        <button
          type="button"
          aria-label={image ? t("changePhoto") : t("addPhoto")}
          aria-haspopup="dialog"
          className="group focus-visible:ring-ring relative block cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          onClick={() => setPhotoOpen(true)}
        >
          <Avatar className="size-20 rounded-lg">
            {current ? (
              <AvatarImage src={current} alt={name} />
            ) : (
              <AvatarFallback className="rounded-lg text-xl">
                {initial}
              </AvatarFallback>
            )}
          </Avatar>
          {/* Hover / focus overlay: "click to change" affordance */}
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <Camera className="size-5" />
          </span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          // Allow re-selecting the same file later.
          event.target.value = "";
        }}
      />

      {/* All photo controls live in this dialog, keeping the profile clean. */}
      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("changePhotoTitle")}</DialogTitle>
            <DialogDescription>{t("changePhotoDescription")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="size-16 rounded-lg">
                  {current ? (
                    <AvatarImage src={current} alt={name} />
                  ) : (
                    <AvatarFallback className="rounded-lg text-lg">
                      {initial}
                    </AvatarFallback>
                  )}
                </Avatar>
                {image && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    aria-label={t("removePhoto")}
                    title={t("removePhoto")}
                    disabled={uploading}
                    onClick={() => void handleRemove()}
                    className="ring-background bg-destructive text-destructive-foreground hover:bg-destructive/90 absolute -top-1.5 -right-1.5 rounded-full ring-2"
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="text-muted-foreground text-xs">
                  {t("formatsHint")}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "border-border flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                dragging && "border-primary bg-primary/5",
              )}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                if (uploading) return;
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node)) {
                  return;
                }
                setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              role="button"
              tabIndex={0}
              aria-label={t("uploadNewPhoto")}
            >
              {uploading ? (
                <LoaderCircle className="size-5 animate-spin" />
              ) : (
                <ImagePlus className="size-5" />
              )}
              <span className="text-sm font-medium">
                {uploading ? t("uploading") : t("uploadNewPhoto")}
              </span>
              <span className="text-muted-foreground text-xs">
                {t("dragDropHint")}
              </span>
            </div>

            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPhotoOpen(false)}
            >
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AvatarCropDialog
        open={cropOpen}
        imageUrl={cropUrl}
        onClose={closeEditor}
        onSave={handleSaveCrop}
      />
    </>
  );
}
