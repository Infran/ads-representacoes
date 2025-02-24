import React from "react";
import { Box, Button, TextField } from "@mui/material";
import { AddCircle, Search } from "@mui/icons-material";
import { styled } from "@mui/system";
import { Paper } from "@mui/material";

interface SearchBarProps {
  search: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  onAdd: () => void;
  inputLabel?: string;
}

const StyledPaper = styled(Paper)({
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
});

const SearchBar: React.FC<SearchBarProps> = ({
  search,
  onSearchChange,
  onSearch,
  onAdd,
  inputLabel = "Digite o nome do produto",
}) => {
  return (
    <StyledPaper>
      <Box
        display="flex"
        flexDirection="row"
        gap={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Box display="flex" gap={2}>
          <Button variant="contained" onClick={onSearch}>
            <Box display="flex" gap={0.5}>
              Pesquisar
              <Search />
            </Box>
          </Button>
          <Button variant="contained" onClick={onAdd}>
            <Box display="flex" gap={0.5}>
              Adicionar
              <AddCircle />
            </Box>
          </Button>
        </Box>
        <Box flex={1}>
          <TextField
            label={inputLabel}
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={onSearchChange}
          />
        </Box>
      </Box>
    </StyledPaper>
  );
};

export default SearchBar;
