import React, { useState } from "react";
import {
  Badge,
  IconButton,
  Menu,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
} from "@mui/material";
import {
  Notifications,
  CheckCircle,
  Warning,
  Info,
  Delete,
} from "@mui/icons-material";

interface Notification {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// Notificações de exemplo - isso seria conectado a um sistema real
const mockNotifications: Notification[] = [];

const typeConfig = {
  success: { icon: CheckCircle, color: "#4CAF50" },
  warning: { icon: Warning, color: "#FF9800" },
  info: { icon: Info, color: "#2196F3" },
};

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState(mockNotifications);
  const open = Boolean(anchorEl);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClear = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          color: "rgba(0, 0, 0, 0.54)",
          "&:hover": {
            backgroundColor: "rgba(25, 118, 210, 0.08)",
          },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={9}
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.65rem",
              height: 18,
              minWidth: 18,
            },
          }}
        >
          <Notifications />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 8,
          sx: {
            width: 360,
            maxHeight: 480,
            mt: 1,
            borderRadius: 2,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Notificações
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="primary"
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
            )}
          </Box>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              Marcar lidas
            </Button>
          )}
        </Box>

        {/* Lista de notificações */}
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Notifications
              sx={{ fontSize: 48, color: "rgba(0,0,0,0.1)", mb: 1 }}
            />
            <Typography color="text.secondary" variant="body2">
              Nenhuma notificação
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ maxHeight: 360, overflow: "auto" }}>
            {notifications.map((notification, index) => {
              const config = typeConfig[notification.type];
              const IconComponent = config.icon;
              return (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      py: 1.5,
                      px: 2,
                      backgroundColor: notification.read
                        ? "transparent"
                        : "rgba(25, 118, 210, 0.04)",
                      "&:hover": {
                        backgroundColor: "rgba(0,0,0,0.04)",
                      },
                    }}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleClear(notification.id)}
                        sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <IconComponent sx={{ color: config.color }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: notification.read ? 400 : 600,
                          }}
                        >
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "rgba(0,0,0,0.4)" }}
                          >
                            {notification.time}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
