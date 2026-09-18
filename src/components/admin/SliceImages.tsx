"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import NavigateBeforeRoundedIcon from "@mui/icons-material/NavigateBeforeRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import {
  Box,
  CircularProgress,
  Dialog,
  IconButton,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";

export interface SliceImagesProps {
  open: boolean;
  images: string[];
  onClose: () => void;
}

function useDialogImageSize(open: boolean): number {
  const [size, setSize] = useState(720);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const recompute = () => setSize(Math.round(window.innerWidth * 0.9 * 0.8));
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [open]);

  return size;
}

export function SliceImages({ open, images, onClose }: SliceImagesProps) {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loadedImage, setLoadedImage] = useState<string | null>(null);
  const imageSize = useDialogImageSize(open);
  const maxSteps = images.length;

  useEffect(() => {
    if (open) setActiveStep(0);
  }, [open]);

  const handlePrev = () =>
    setActiveStep((prev) => (prev - 1 + maxSteps) % maxSteps);
  const handleNext = () => setActiveStep((prev) => (prev + 1) % maxSteps);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        setActiveStep((prev) => (prev - 1 + maxSteps) % maxSteps);
      } else if (event.key === "ArrowRight") {
        setActiveStep((prev) => (prev + 1) % maxSteps);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, maxSteps]);

  const currentImage = images[activeStep];
  const loading = currentImage !== undefined && currentImage !== loadedImage;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      slotProps={{
        paper: {
          sx: {
            bgcolor: "transparent",
            boxShadow: "none",
            overflow: "visible",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 320,
          minHeight: 320,
        }}
      >
        <IconButton
          onClick={onClose}
          aria-label="Đóng"
          sx={{
            position: "absolute",
            top: -16,
            right: -16,
            zIndex: 1,
            bgcolor: theme.palette.background.paper,
            boxShadow: theme.shadows[3],
            "&:hover": { bgcolor: theme.palette.background.paper },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>

        {maxSteps > 1 && (
          <IconButton
            onClick={handlePrev}
            aria-label="Ảnh trước"
            sx={{
              position: "absolute",
              left: 8,
              zIndex: 1,
              bgcolor: alpha(theme.palette.common.black, 0.4),
              color: theme.palette.common.white,
              "&:hover": {
                bgcolor: alpha(theme.palette.common.black, 0.6),
              },
            }}
          >
            <NavigateBeforeRoundedIcon />
          </IconButton>
        )}

        {loading && (
          <CircularProgress
            size={32}
            sx={{ position: "absolute", color: theme.palette.common.white }}
          />
        )}

        {currentImage && (
          // biome-ignore lint/performance/noImgElement: remote Google Drive URL, not an optimizable local asset
          <img
            key={currentImage}
            src={`${currentImage}&sz=s${imageSize}`}
            alt={`Ảnh mẫu ${activeStep + 1}/${maxSteps}`}
            onLoad={() => setLoadedImage(currentImage)}
            onError={() => setLoadedImage(currentImage)}
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              display: "block",
              borderRadius: theme.shape.borderRadius,
              opacity: loading ? 0 : 1,
              transition: "opacity 0.15s ease-in",
            }}
          />
        )}

        {maxSteps > 1 && (
          <IconButton
            onClick={handleNext}
            aria-label="Ảnh sau"
            sx={{
              position: "absolute",
              right: 8,
              zIndex: 1,
              bgcolor: alpha(theme.palette.common.black, 0.4),
              color: theme.palette.common.white,
              "&:hover": {
                bgcolor: alpha(theme.palette.common.black, 0.6),
              },
            }}
          >
            <NavigateNextRoundedIcon />
          </IconButton>
        )}

        {maxSteps > 1 && (
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              bottom: 8,
              left: "50%",
              transform: "translateX(-50%)",
              px: 1.5,
              py: 0.25,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.common.black, 0.4),
              color: theme.palette.common.white,
            }}
          >
            {activeStep + 1}/{maxSteps}
          </Typography>
        )}
      </Box>
    </Dialog>
  );
}
