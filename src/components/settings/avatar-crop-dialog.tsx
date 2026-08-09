"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Minus, Plus, RotateCcw } from "lucide-react";

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

const VIEWPORT_SIZE = 288; // px - the visible crop frame
const PREVIEW_SIZE = 64; // px - mini live preview of the crop
const EXPORT_SIZE = 512; // px - exported square avatar
const MAX_ZOOM = 6;

type Size = { w: number; h: number };
type Offset = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Scale at which the image covers a square viewport of `size` px. */
function coverScale(natural: Size, size: number) {
  return size / Math.min(natural.w, natural.h);
}

/** Clamp panning so the image always covers the viewport. */
function clampOffset(
  offset: Offset,
  natural: Size,
  zoom: number,
  viewportSize: number,
): Offset {
  const base = coverScale(natural, viewportSize);
  const displayW = natural.w * base * zoom;
  const displayH = natural.h * base * zoom;
  const slackX = Math.max(0, (displayW - viewportSize) / 2);
  const slackY = Math.max(0, (displayH - viewportSize) / 2);
  return {
    x: clamp(offset.x, -slackX, slackX),
    y: clamp(offset.y, -slackY, slackY),
  };
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [natural, setNatural] = useState<Size | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset whenever a new image is opened.
  useEffect(() => {
    if (open) {
      setNatural(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setSaving(false);
      setError(null);
    }
  }, [open, imageUrl]);

  /** Zoom by `factor` (or to an absolute value), anchored at `anchor` px in
   *  the viewport (defaults to the center). */
  const changeZoom = useCallback(
    (target: number, anchor?: { x: number; y: number }) => {
      if (!natural) return;
      const z = clamp(target, 1, MAX_ZOOM);
      if (z === zoom) return;
      let next = offset;
      if (anchor) {
        const base = coverScale(natural, VIEWPORT_SIZE);
        const dw = natural.w * base;
        const dh = natural.h * base;
        // Image coords under the anchor before the zoom...
        const ix =
          (anchor.x - (VIEWPORT_SIZE / 2 - (dw * zoom) / 2 + offset.x)) /
          (base * zoom);
        const iy =
          (anchor.y - (VIEWPORT_SIZE / 2 - (dh * zoom) / 2 + offset.y)) /
          (base * zoom);
        // ...and the offset that keeps that point fixed after the zoom.
        next = {
          x: anchor.x - VIEWPORT_SIZE / 2 + (dw * z) / 2 - ix * base * z,
          y: anchor.y - VIEWPORT_SIZE / 2 + (dh * z) / 2 - iy * base * z,
        };
      }
      setOffset(clampOffset(next, natural, z, VIEWPORT_SIZE));
      setZoom(z);
    },
    [natural, zoom, offset],
  );

  // Wheel zoom must be non-passive to preventDefault (page scroll).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !open) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      changeZoom(zoom * Math.pow(1.002, -event.deltaY), {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, zoom, changeZoom]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    setDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || !natural) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    setOffset(
      clampOffset(
        { x: drag.offsetX + dx, y: drag.offsetY + dy },
        natural,
        zoom,
        VIEWPORT_SIZE,
      ),
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
    setDragging(false);
  }

  async function handleSave() {
    const img = imgRef.current;
    if (!img || !natural || saving) return;
    setSaving(true);
    try {
      const total = coverScale(natural, VIEWPORT_SIZE) * zoom;
      const visible = VIEWPORT_SIZE / total; // image px inside the frame
      let sx = natural.w / 2 - offset.x / total - visible / 2;
      let sy = natural.h / 2 - offset.y / total - visible / 2;
      sx = clamp(sx, 0, Math.max(0, natural.w - visible));
      sy = clamp(sy, 0, Math.max(0, natural.h - visible));

      const canvas = document.createElement("canvas");
      canvas.width = EXPORT_SIZE;
      canvas.height = EXPORT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not supported in this browser.");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        img,
        sx,
        sy,
        visible,
        visible,
        0,
        0,
        EXPORT_SIZE,
        EXPORT_SIZE,
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
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

  const mainTransform = natural
    ? `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`
    : undefined;

  // The mini preview mirrors the crop using the same math at its own size.
  const previewTransform = (() => {
    if (!natural) return undefined;
    // Both viewports are square, so pan offsets scale linearly between them.
    const ratio = PREVIEW_SIZE / VIEWPORT_SIZE;
    const ox = offset.x * ratio;
    const oy = offset.y * ratio;
    return `translate(-50%, -50%) translate(${ox}px, ${oy}px) scale(${zoom})`;
  })();

  const center = { x: VIEWPORT_SIZE / 2, y: VIEWPORT_SIZE / 2 };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust your photo</DialogTitle>
          <DialogDescription>
            Drag to move, scroll or use the slider to zoom. Only the framed area
            is saved.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={viewportRef}
          className={cn(
            "bg-muted/50 relative mx-auto h-72 w-72 cursor-move touch-none overflow-hidden rounded-xl select-none",
            dragging && "cursor-grabbing",
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {imageUrl && (
            // Canvas crop needs the raw element - next/image's sizing/srcset
            // would break the pixel math.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={imageUrl}
              alt=""
              draggable={false}
              className="absolute top-1/2 left-1/2 max-w-none select-none"
              style={{
                width: natural
                  ? natural.w * coverScale(natural, VIEWPORT_SIZE)
                  : undefined,
                height: natural
                  ? natural.h * coverScale(natural, VIEWPORT_SIZE)
                  : undefined,
                transform: mainTransform,
                transformOrigin: "center",
              }}
              onLoad={(event) =>
                setNatural({
                  w: event.currentTarget.naturalWidth,
                  h: event.currentTarget.naturalHeight,
                })
              }
            />
          )}
          {/* The frame itself: what ends up in the avatar */}
          <div className="ring-primary/70 pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset" />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Zoom out"
            disabled={zoom <= 1}
            onClick={() => changeZoom(zoom / 1.25, center)}
          >
            <Minus className="size-4" />
          </Button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            aria-label="Zoom"
            onChange={(event) => changeZoom(Number(event.target.value), center)}
            className="accent-foreground h-2 flex-1 cursor-pointer"
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Zoom in"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => changeZoom(zoom * 1.25, center)}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Reset zoom and position"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-xs">Preview</span>
          <div className="bg-muted/50 ring-border relative h-16 w-16 overflow-hidden rounded-lg ring-1">
            {imageUrl && (
              // Same reason as the main viewport: raw element for the crop.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                draggable={false}
                className="absolute top-1/2 left-1/2 max-w-none select-none"
                style={{
                  width: natural
                    ? natural.w * coverScale(natural, PREVIEW_SIZE)
                    : undefined,
                  height: natural
                    ? natural.h * coverScale(natural, PREVIEW_SIZE)
                    : undefined,
                  transform: previewTransform,
                  transformOrigin: "center",
                }}
              />
            )}
          </div>
          <span className="text-muted-foreground text-xs">
            {natural ? `${natural.w} × ${natural.h}px` : "Loading image…"}
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
          <Button
            onClick={() => void handleSave()}
            disabled={!natural || saving}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
