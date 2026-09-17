"use client";

import { Alert, Snackbar } from "@mui/material";
import {
  createContext,
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Severity = "success" | "error" | "warning" | "info";

type NotificationOptions = {
  autoHideDuration?: number;
};

type QueuedNotification = {
  key: number;
  message: string;
  severity: Severity;
  autoHideDuration: number;
};

type NotificationContextValue = {
  notify: (
    message: string,
    severity?: Severity,
    options?: NotificationOptions,
  ) => void;
  notifySuccess: (message: string, options?: NotificationOptions) => void;
  notifyError: (message: string, options?: NotificationOptions) => void;
};

const DEFAULT_AUTO_HIDE_DURATION = 4000;

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
}

export default function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [queue, setQueue] = useState<QueuedNotification[]>([]);
  const [current, setCurrent] = useState<QueuedNotification | null>(null);
  const [open, setOpen] = useState(false);

  const notify = useCallback(
    (
      message: string,
      severity: Severity = "info",
      options?: NotificationOptions,
    ) => {
      const next: QueuedNotification = {
        key: Date.now() + Math.random(),
        message,
        severity,
        autoHideDuration:
          options?.autoHideDuration ?? DEFAULT_AUTO_HIDE_DURATION,
      };

      setQueue((prev) => [...prev, next]);
    },
    [],
  );

  const notifySuccess = useCallback(
    (message: string, options?: NotificationOptions) =>
      notify(message, "success", options),
    [notify],
  );

  const notifyError = useCallback(
    (message: string, options?: NotificationOptions) =>
      notify(message, "error", options),
    [notify],
  );

  useEffect(() => {
    if (queue.length > 0 && !current) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
      setOpen(true);
    } else if (queue.length > 0 && current && open) {
      setOpen(false);
    }
  }, [queue, current, open]);

  const handleClose = (_event?: SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  const handleExited = () => {
    setCurrent(null);
  };

  return (
    <NotificationContext.Provider
      value={{ notify, notifySuccess, notifyError }}
    >
      {children}
      <Snackbar
        key={current?.key}
        open={open}
        autoHideDuration={
          current?.autoHideDuration ?? DEFAULT_AUTO_HIDE_DURATION
        }
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ transition: { onExited: handleExited } }}
      >
        <Alert
          onClose={handleClose}
          severity={current?.severity ?? "info"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}
