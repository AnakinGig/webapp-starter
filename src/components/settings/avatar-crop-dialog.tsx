"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { LoaderCircle, Minus, Plus, RotateCcw, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PREVIEW_SIZE = 64; // px - mini live preview of the crop
const EXPORT_SIZE = 512; // px - exported square avatar
const MAX_ZOOM = 6;
const ROTATION_STEP = 90;
const MAX_BOX_SIDE = 288; // px - the editor frame never exceeds this
const MIN_BOX_SIDE = 64; // px - ...and never gets thinner than this

type Size = { width: number; height: number };

async function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Could not load the image.")),
    );
    image.src = src;
  });
}

/** Bounding-box size of `width` x `height` rotated by `rotation` degrees. */
function rotateSize(width: number, height: number, rotation: number): Size {
  const rad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

/** Render the rotated image, then extract the crop area scaled to `size`. */
async function renderCropWithImage(
  image: HTMLImageElement,
  pixelCrop: Area,
  rotation: number,
  size: number,
): Promise<HTMLCanvasElement> {
  const rotRad = (rotation * Math.PI) / 180;
  const bbox = rotateSize(image.naturalWidth, image.naturalHeight, rotation);

  // 1. Draw the image rotated into a canvas the size of its bounding box.
  const rotated = document.createElement("canvas");
  rotated.width = Math.round(bbox.width);
  rotated.height = Math.round(bbox.height);
  const rctx = rotated.getContext("2d");
  if (!rctx) throw new Error("Canvas is not supported in this browser.");
  rctx.translate(rotated.width / 2, rotated.height / 2);
  rctx.rotate(rotRad);
  rctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  // 2. Extract the cropped area (react-easy-crop reports it in natural
  //    rotated-bbox pixels) and scale it to the requested output size.
  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas is not supported in this browser.");
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";
  octx.drawImage(
    rotated,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  );
  return out;
}

type AvatarCropDialogProps = {
  open: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onSave: (blob: Blob) => Promise<void> | void;
};

export function AvatarCropDialog({
  open,
  imageUrl,
  onClose,
  onSave,
}: AvatarCropDialogProps) {
  const previewRef = useRef<HTMLCanvasElement>(null);
  // The decoded image is cached per URL so preview redraws don't re-decode.
  const imageCacheRef = useRef<{ url: string; image: HTMLImageElement } | null>(
    null,
  );

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null);
  const [natural, setNatural] = useState<Size | null>(null);
  const [cropSize, setCropSize] = useState<Size | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset whenever a new image is opened.
  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setPixelCrop(null);
      setNatural(null);
      setCropSize(null);
      setSaving(false);
      setError(null);
    }
  }, [open, imageUrl]);

  const handleCropAreaChange = useCallback((_area: Area, pixels: Area) => {
    setPixelCrop(pixels);
  }, []);

  // The editor box hugs the image's own aspect ratio so there are no gray
  // bars around it at 0/180 degrees. Extreme aspect ratios (panoramas,
  // posters) still get a usable box via the MIN_BOX_SIDE floor. Note: on
  // 90/270-degree rotation the image rotates in place inside this box
  // (react-easy-crop contain-fits the media, then rotates it) - the crop
  // frame stays fully covered and the export is correct, so the box must
  // NOT be swapped to the rotated ratio (that would letterbox it).
  const boxSize = useMemo(() => {
    if (!natural) return null;
    const scale = Math.min(
      MAX_BOX_SIDE / natural.width,
      MAX_BOX_SIDE / natural.height,
    );
    const width = Math.max(natural.width * scale, MIN_BOX_SIDE);
    const height = Math.max(natural.height * scale, MIN_BOX_SIDE);
    return { width, height };
  }, [natural]);
  const box = boxSize ?? { width: MAX_BOX_SIDE, height: MAX_BOX_SIDE };
  const atDefault =
    zoom === 1 && rotation === 0 && crop.x === 0 && crop.y === 0;

  // Live mini preview mirrors the crop (same math at PREVIEW_SIZE).
  useEffect(() => {
    const ctx = previewRef.current?.getContext("2d");
    if (!open || !imageUrl || !pixelCrop) {
      ctx?.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      return;
    }
    if (!ctx) return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      void (async () => {
        try {
          // Reuse the cached decoded image when the URL hasn't changed.
          let image =
            imageCacheRef.current?.url === imageUrl
              ? imageCacheRef.current.image
              : null;
          if (!image) {
            image = await createImage(imageUrl);
            imageCacheRef.current = { url: imageUrl, image };
          }
          const out = await renderCropWithImage(
            image,
            pixelCrop,
            rotation,
            PREVIEW_SIZE,
          );
          if (cancelled) return;
          ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
          ctx.drawImage(out, 0, 0);
        } catch {
          // Best-effort preview; the real crop validates on save.
        }
      })();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [open, imageUrl, pixelCrop, rotation]);

  async function handleSave() {
    if (!imageUrl || !pixelCrop || saving) return;
    setSaving(true);
    try {
      const image =
        imageCacheRef.current?.url === imageUrl
          ? imageCacheRef.current.image
          : await createImage(imageUrl);
      const out = await renderCropWithImage(
        image,
        pixelCrop,
        rotation,
        EXPORT_SIZE,
      );
      // WebP is the best size/quality trade-off for photos. Browsers that
      // cannot encode WebP return null from toBlob - fall back to PNG.
      const webp = await new Promise<Blob | null>((resolve) =>
        out.toBlob(resolve, "image/webp", 0.9),
      );
      const blob =
        webp ??
        (await new Promise<Blob | null>((resolve) =>
          out.toBlob(resolve, "image/png"),
        ));
      if (!blob) throw new Error("Could not process the image.");
      await onSave(blob);
    } catch (err) {
      // Show upload/processing failures inside the dialog so they are
      // actually visible (the uploader's own error sits behind the modal).
      setError(err instanceof Error ? err.message : "Couldn't save the photo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust your photo</DialogTitle>{" "}
          <DialogDescription>
            The whole photo is shown with the avatar frame overlaid - the dimmed
            area will not be in the avatar. Drag to move, scroll or use the
            slider to zoom, and rotate with the button.
          </DialogDescription>
        </DialogHeader>

        <div
          className="bg-muted/50 relative mx-auto touch-none overflow-hidden rounded-xl select-none"
          style={{ width: box.width, height: box.height }}
        >
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              minZoom={1}
              maxZoom={MAX_ZOOM}
              objectFit="contain"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropAreaChange={handleCropAreaChange}
              onCropSizeChange={setCropSize}
              onMediaLoaded={(media) =>
                setNatural({
                  width: media.naturalWidth,
                  height: media.naturalHeight,
                })
              }
              // The overlay ring marks the frame - drop the lib's own 1px
              // white border so there's a single clean outline.
              style={{ cropAreaStyle: { border: "none" } }}
            />
          )}
          {/* The frame: what ends up in the avatar. react-easy-crop dims
              everything outside its crop area and keeps it centered, so a
              centered overlay of the same size lines up exactly. */}
          {cropSize && (
            <div
              className="ring-primary/70 pointer-events-none absolute top-1/2 left-1/2 ring-2 ring-inset"
              style={{
                width: cropSize.width,
                height: cropSize.height,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Zoom out"
                disabled={zoom <= 1}
                onClick={() => setZoom(Math.max(1, zoom / 1.25))}
              >
                <Minus className="size-4" />
              </Button>
            </TooltipTrigger>
            {zoom <= 1 && (
              <TooltipContent>Already at minimum zoom.</TooltipContent>
            )}
          </Tooltip>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            aria-label="Zoom"
            onChange={(event) => setZoom(Number(event.target.value))}
            className="accent-foreground h-2 flex-1 cursor-pointer"
          />
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Zoom in"
                disabled={zoom >= MAX_ZOOM}
                onClick={() => setZoom(Math.min(MAX_ZOOM, zoom * 1.25))}
              >
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            {zoom >= MAX_ZOOM && (
              <TooltipContent>Already at maximum zoom.</TooltipContent>
            )}
          </Tooltip>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Rotate 90 degrees"
            onClick={() => setRotation((r) => (r + ROTATION_STEP) % 360)}
          >
            <RotateCw className="size-4" />
          </Button>
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Reset zoom, position and rotation"
                disabled={atDefault}
                onClick={() => {
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                  setRotation(0);
                }}
              >
                <RotateCcw className="size-4" />
              </Button>
            </TooltipTrigger>
            {atDefault && <TooltipContent>Nothing to reset.</TooltipContent>}
          </Tooltip>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-xs">Preview</span>
          <div className="bg-muted/50 ring-border relative h-16 w-16 overflow-hidden rounded-lg ring-1">
            <canvas
              ref={previewRef}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              className="size-full"
            />
          </div>
          <span className="text-muted-foreground text-xs">
            {natural
              ? `${natural.width} × ${natural.height}px`
              : "Loading image…"}
          </span>
        </div>

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button
                onClick={() => void handleSave()}
                disabled={!pixelCrop || saving}
              >
                {saving ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save photo"
                )}
              </Button>
            </TooltipTrigger>
            {!saving && !pixelCrop && (
              <TooltipContent>Adjust your photo before saving.</TooltipContent>
            )}
          </Tooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
