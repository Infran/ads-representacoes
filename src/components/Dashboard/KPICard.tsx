import React, { ReactNode } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Skeleton,
} from "@mui/material";
import { SvgIconComponent } from "@mui/icons-material";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  extraInfo?: string | ReactNode;
  extraChip?: {
    label: string;
    color: "success" | "error" | "warning" | "info" | "default";
  };
  icon: SvgIconComponent;
  loading?: boolean;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  extraInfo,
  extraChip,
  icon: Icon,
  loading = false,
  onClick,
}) => {
  return (
    <Card
      elevation={1}
      onClick={onClick}
      sx={{
        height: "100%",
        minHeight: 160,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease-in-out",
        "&:hover": onClick
          ? {
              elevation: 4,
              transform: "translateY(-2px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }
          : {},
      }}
    >
      <CardContent sx={{ height: "100%", p: 2.5 }}>
        {/* Header com título e ícone */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
          }}
        >
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{
              fontWeight: 500,
              textTransform: "uppercase",
              fontSize: "0.75rem",
            }}
          >
            {title}
          </Typography>
          <Icon sx={{ color: "#1976D2", fontSize: 24, opacity: 0.8 }} />
        </Box>

        {/* Valor principal */}
        {loading ? (
          <Skeleton variant="text" width="60%" height={48} />
        ) : (
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#1976D2",
              mb: 0.5,
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
        )}

        {/* Subtítulo */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1, fontSize: "0.875rem" }}
        >
          {subtitle}
        </Typography>

        {/* Informação extra ou chip */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {extraChip && (
            <Chip
              label={extraChip.label}
              color={extraChip.color}
              size="small"
              sx={{ fontSize: "0.7rem", height: 22 }}
            />
          )}
          {extraInfo && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.75rem" }}
            >
              {extraInfo}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default KPICard;
