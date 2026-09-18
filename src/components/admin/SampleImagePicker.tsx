"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  useEffect,
  useState,
} from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { ORDER_IMAGE_LIMITS } from "./orderUtils";

export interface SampleImagePickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

const { maxFiles, maxSizeMb, acceptedTypes } = ORDER_IMAGE_LIMITS;

function isSameFile(a: File, b: File): boolean {
  return (
    a.name === b.name && a.size === b.size && a.lastModified === b.lastModified
  );
}

export function SampleImagePicker({
  files,
  onChange,
  disabled = false,
}: SampleImagePickerProps) {
  const theme = useTheme();
  const { notify } = useNotification();
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [files]);

  const addFiles = (incoming: File[]) => {
    if (disabled || incoming.length === 0) return;

    const wrongType = incoming.filter(
      (file) => !(acceptedTypes as readonly string[]).includes(file.type),
    );
    const valid = incoming.filter((file) =>
      (acceptedTypes as readonly string[]).includes(file.type),
    );
    const tooLarge = valid.filter(
      (file) => file.size > maxSizeMb * 1024 * 1024,
    );
    const sized = valid.filter((file) => file.size <= maxSizeMb * 1024 * 1024);
    const fresh = sized.filter(
      (file) => !files.some((existing) => isSameFile(existing, file)),
    );
    const room = maxFiles - files.length;
    const accepted = fresh.slice(0, Math.max(room, 0));

    if (wrongType.length > 0) {
      notify("Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.", "warning");
    }
    if (tooLarge.length > 0) {
      notify(`Mỗi ảnh tối đa ${maxSizeMb}MB.`, "warning");
    }
    if (fresh.length > accepted.length) {
      notify(`Tối đa ${maxFiles} ảnh.`, "warning");
    }
    if (accepted.length > 0) onChange([...files, ...accepted]);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    addFiles(Array.from(event.clipboardData.files));
  };

  const removeAt = (index: number) =>
    onChange(files.filter((_, i) => i !== index));

  return (
    <Box>
      <Box
        tabIndex={disabled ? -1 : 0}
        onDragOver={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          p: 3,
          border: "2px dashed",
          borderColor: dragging ? "primary.main" : "divider",
          borderRadius: 2,
          bgcolor: dragging
            ? alpha(theme.palette.primary.main, 0.08)
            : "transparent",
          textAlign: "center",
          outline: "none",
          "&:focus-visible": { borderColor: "primary.main" },
        }}
      >
        <CloudUploadRoundedIcon color="primary" />
        <Typography variant="body2" color="text.secondary">
          Kéo thả, dán (Ctrl+V) hoặc chọn ảnh mẫu — JPEG/PNG/WebP, tối đa{" "}
          {maxSizeMb}MB, {maxFiles} ảnh ({files.length}/{maxFiles})
        </Typography>
        <Button
          component="label"
          size="small"
          variant="outlined"
          disabled={disabled}
        >
          Chọn ảnh
          <input
            hidden
            multiple
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={handleInput}
          />
        </Button>
      </Box>

      {files.length > 0 && (
        <Box
          sx={{
            mt: 2,
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "repeat(3, 1fr)",
              sm: "repeat(5, 1fr)",
            },
          }}
        >
          {files.map((file, index) => (
            <Box
              key={`${file.name}-${file.size}-${file.lastModified}`}
              sx={{
                position: "relative",
                aspectRatio: "1 / 1",
                borderRadius: 1,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {previews[index] && (
                <Box
                  component="img"
                  src={previews[index]}
                  alt={file.name}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
              <IconButton
                size="small"
                aria-label={`Xoá ${file.name}`}
                disabled={disabled}
                onClick={() => removeAt(index)}
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  bgcolor: alpha(theme.palette.common.black, 0.5),
                  color: theme.palette.common.white,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.common.black, 0.7),
                  },
                }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
