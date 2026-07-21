import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  IconButton,
  Box,
  Typography,
  Button,
  Slide,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import { tokens } from "../theme/tokens";
import { registerFeedbackMethods } from "./Feedback";

export type FeedbackType = "success" | "warning" | "error" | "info" | "question";

export interface ConfirmOptions {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: FeedbackType;
  danger?: boolean;
}

export interface ToastItem {
  id: string;
  title: string;
  text?: string;
  type: "success" | "warning" | "error" | "info";
  duration: number; // in ms
  remaining: number; // remaining time in ms
}

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Confirm Dialog State
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  // Toasts (Snackbar Stack) State
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const isHoveredRef = useRef(false);

  // Update ref to avoid stale closure in timers
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  // Imperative Confirmation Dialog launcher
  const openConfirm = useCallback(
    (options: ConfirmOptions, resolve: (val: boolean) => void) => {
      setConfirmState((prev) => {
        if (prev?.open) {
          prev.resolve(false); // cancel previous dialog if any
        }
        return {
          open: true,
          options,
          resolve,
        };
      });
    },
    []
  );

  // Imperative Toast adder
  const addToast = useCallback(
    (
      title: string,
      text: string | undefined,
      type: "success" | "warning" | "error" | "info",
      duration = 6000
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [
        ...prev,
        { id, title, text, type, duration, remaining: duration },
      ]);
    },
    []
  );

  // Register methods with static bridge
  useEffect(() => {
    registerFeedbackMethods(openConfirm, addToast);
    return () => {
      registerFeedbackMethods(null, null);
    };
  }, [openConfirm, addToast]);

  // Handle toast timers ticking (pause on hover)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isHoveredRef.current) return; // pause timers on hover

      setToasts((prevToasts) => {
        if (prevToasts.length === 0) return prevToasts;

        return prevToasts
          .map((t) => ({ ...t, remaining: t.remaining - 100 }))
          .filter((t) => t.remaining > 0);
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleConfirmClose = (accepted: boolean) => {
    if (confirmState) {
      confirmState.resolve(accepted);
      setConfirmState((prev) => (prev ? { ...prev, open: false } : null));
    }
  };

  // Helper to resolve icon details
  const getIconDetails = (type?: FeedbackType, danger?: boolean) => {
    const iconType = type || (danger ? "error" : "info");
    switch (iconType) {
      case "success":
        return {
          Component: CheckCircleIcon,
          color: tokens.color.success,
          bgColor: "rgba(5, 150, 105, 0.1)",
        };
      case "error":
        return {
          Component: ErrorIcon,
          color: tokens.color.error,
          bgColor: "rgba(211, 47, 47, 0.1)",
        };
      case "warning":
        return {
          Component: WarningIcon,
          color: tokens.color.warning,
          bgColor: "rgba(245, 158, 11, 0.1)",
        };
      case "info":
      case "question":
      default:
        return {
          Component: InfoIcon,
          color: tokens.color.info,
          bgColor: "rgba(33, 150, 243, 0.1)",
        };
    }
  };

  const confirmIcon = confirmState ? getIconDetails(confirmState.options.icon, confirmState.options.danger) : null;

  return (
    <>
      {children}

      {/* Confirmation Dialog Component */}
      <Dialog
        open={!!confirmState?.open}
        onClose={() => handleConfirmClose(false)}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(4px)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            },
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            boxShadow: tokens.elevation.e4,
            p: 3.5,
            width: { xs: "90vw", sm: "440px" },
            maxWidth: "90vw",
            bgcolor: "background.paper",
            backgroundImage: "none", // remove default MUI dark mode background gradient overlay
            overflow: "visible", // allow absolute items
          },
        }}
      >
        {confirmState && (
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            {/* Header Icon Ring */}
            {confirmIcon && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: confirmIcon.bgColor,
                  color: confirmIcon.color,
                  mb: 2.5,
                }}
              >
                <confirmIcon.Component sx={{ fontSize: 32 }} />
              </Box>
            )}

            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "text.primary",
                fontFamily: "'Poppins', sans-serif",
                mb: 1.5,
              }}
            >
              {confirmState.options.title}
            </Typography>

            {confirmState.options.text && (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontFamily: "'Poppins', sans-serif",
                  lineHeight: 1.6,
                  mb: 3.5,
                }}
              >
                {confirmState.options.text}
              </Typography>
            )}

            {/* Action Buttons */}
            <Box
              display="flex"
              width="100%"
              gap={2}
              justifyContent="center"
              sx={{ mt: 1 }}
            >
              <Button
                variant="text"
                onClick={() => handleConfirmClose(false)}
                sx={{
                  flex: 1,
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  color: "text.secondary",
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                  py: 1.25,
                  borderRadius: `${tokens.radius.sm}px`,
                  transition: "transform 0.1s ease, background-color 0.2s ease",
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.08)",
                  },
                  "&:active": {
                    transform: "scale(0.97)",
                  },
                }}
              >
                {confirmState.options.cancelText || "Cancelar"}
              </Button>
              <Button
                variant="contained"
                onClick={() => handleConfirmClose(true)}
                autoFocus
                sx={{
                  flex: 1,
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  bgcolor: confirmState.options.danger ? tokens.color.error : tokens.color.brand.main,
                  color: "common.white",
                  py: 1.25,
                  borderRadius: `${tokens.radius.sm}px`,
                  transition: "transform 0.1s ease, background-color 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    bgcolor: confirmState.options.danger
                      ? tokens.color.errorDark
                      : tokens.color.brand.dark,
                  },
                  "&:active": {
                    transform: "scale(0.97)",
                  },
                }}
              >
                {confirmState.options.confirmText || "Confirmar"}
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* Snackbar Toasts Floating Stack */}
      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          position: "fixed",
          bottom: 24,
          left: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column", // newest toast renders at the bottom, nearest the corner
          gap: 1.5,
          width: { xs: "calc(100% - 48px)", sm: "380px" },
          pointerEvents: "none", // click through spacing
        }}
      >
        {toasts.map((toast) => {
          const iconDetails = getIconDetails(toast.type);
          const borderLeftColor =
            toast.type === "success"
              ? tokens.color.success
              : toast.type === "error"
              ? tokens.color.error
              : toast.type === "warning"
              ? tokens.color.warning
              : tokens.color.info;

          return (
            <Slide key={toast.id} direction="right" in={true} mountOnEnter unmountOnExit>
              {/* Wrapper carries the Slide transform; the inner card runs its own
                  attention animation so the two transforms never fight each other. */}
              <Box sx={{ pointerEvents: "auto", width: "100%" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    p: 2,
                    borderRadius: `${tokens.radius.md}px`,
                    borderLeft: `4px solid ${borderLeftColor}`,
                    boxShadow: tokens.elevation.e4,
                    bgcolor: (theme) =>
                      theme.palette.mode === "light"
                        ? "rgba(255, 255, 255, 0.92)"
                        : "rgba(17, 24, 39, 0.92)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid",
                    borderColor: (theme) =>
                      theme.palette.mode === "light"
                        ? "rgba(0, 0, 0, 0.05)"
                        : "rgba(255, 255, 255, 0.05)",
                    width: "100%",
                    transformOrigin: "center",
                    // Entrance attention grabber: a light shake plus a glowing ring
                    // pulse in the toast's status color, kicking in just after the
                    // slide-in settles (~0.35s).
                    "@keyframes toastShake": {
                      "0%, 100%": { transform: "translateX(0)" },
                      "20%": { transform: "translateX(-5px)" },
                      "40%": { transform: "translateX(5px)" },
                      "60%": { transform: "translateX(-3px)" },
                      "80%": { transform: "translateX(3px)" },
                    },
                    "@keyframes toastGlow": {
                      "0%, 100%": { boxShadow: tokens.elevation.e4 },
                      "50%": {
                        boxShadow: `0 0 0 4px ${borderLeftColor}55, ${tokens.elevation.e4}`,
                      },
                    },
                    animation:
                      "toastShake 0.5s ease 0.35s 1, toastGlow 1s ease 0.35s 1",
                    "@media (prefers-reduced-motion: reduce)": {
                      // respect reduced-motion: keep the gentle glow, drop the shake
                      animation: "toastGlow 1s ease 0.35s 1",
                    },
                  }}
                  role="status"
                  aria-live="polite"
                >
                {/* Status Icon */}
                <Box
                  sx={{
                    color: borderLeftColor,
                    display: "flex",
                    alignItems: "center",
                    mr: 1.5,
                    mt: 0.25,
                  }}
                >
                  <iconDetails.Component sx={{ fontSize: 22 }} />
                </Box>

                {/* Text Content */}
                <Box display="flex" flexDirection="column" flex={1} sx={{ pr: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "text.primary",
                      fontFamily: "'Poppins', sans-serif",
                      lineHeight: 1.4,
                    }}
                  >
                    {toast.title}
                  </Typography>
                  {toast.text && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontFamily: "'Poppins', sans-serif",
                        mt: 0.5,
                        lineHeight: 1.45,
                        wordBreak: "break-word",
                      }}
                    >
                      {toast.text}
                    </Typography>
                  )}
                </Box>

                {/* Close Button */}
                <IconButton
                  size="small"
                  onClick={() => removeToast(toast.id)}
                  sx={{
                    color: "text.secondary",
                    padding: 0.25,
                    ml: 0.5,
                    "&:hover": {
                      color: "text.primary",
                      bgcolor: "rgba(0,0,0,0.04)",
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
                </Box>
              </Box>
            </Slide>
          );
        })}
      </Box>
    </>
  );
};
