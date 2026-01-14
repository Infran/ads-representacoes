import React from "react";
import { Box, Typography, Collapse } from "@mui/material";
import type { MenuGroup } from "./sidebarConfig";
import SidebarItem from "./SidebarItem";

interface SidebarGroupProps {
  group: MenuGroup;
  open: boolean;
}

const SidebarGroup: React.FC<SidebarGroupProps> = ({ group, open }) => {
  return (
    <Box sx={{ mb: 1 }}>
      {/* Label do grupo - só visível quando sidebar está aberta */}
      <Collapse in={open} timeout={200}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            px: 3,
            py: 1,
            color: "rgba(0, 0, 0, 0.45)",
            fontWeight: 600,
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {group.label}
        </Typography>
      </Collapse>

      {/* Items do grupo */}
      {group.items.map((item) => (
        <SidebarItem key={item.id} item={item} open={open} />
      ))}
    </Box>
  );
};

export default SidebarGroup;
