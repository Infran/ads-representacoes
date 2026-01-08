import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Skeleton,
} from "@mui/material";
import { SvgIconComponent } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface QuickAccessCardProps {
  title: string;
  count: number;
  subtitle: string;
  icon: SvgIconComponent;
  link: string;
  loading?: boolean;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({
  title,
  count,
  subtitle,
  icon: Icon,
  link,
  loading = false,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: "#1976D2",
          boxShadow: "0 2px 8px rgba(25, 118, 210, 0.15)",
        },
      }}
    >
      <CardActionArea onClick={() => navigate(link)} sx={{ height: "100%" }}>
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2.5,
          }}
        >
          {/* Ícone */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: "rgba(25, 118, 210, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon sx={{ color: "#1976D2", fontSize: 28 }} />
          </Box>

          {/* Texto */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: "#2C3E50" }}
            >
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={80} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                <Box
                  component="span"
                  sx={{ fontWeight: 700, color: "#1976D2", mr: 0.5 }}
                >
                  {count}
                </Box>
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Seta */}
          <Typography color="text.secondary" sx={{ fontSize: 20 }}>
            →
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default QuickAccessCard;
