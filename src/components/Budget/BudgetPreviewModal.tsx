import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import { Close, Visibility } from "@mui/icons-material";
import { PDFViewer } from "@react-pdf/renderer";
import { IBudget } from "../../interfaces/ibudget";

interface BudgetPreviewModalProps {
  open: boolean;
  onClose: () => void;
  budget: IBudget;
  pdfDocument: React.ReactElement;
}

const BudgetPreviewModal: React.FC<BudgetPreviewModalProps> = ({
  open,
  onClose,
  pdfDocument,
}) => {
  // Bloquear clique direito
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: "95vh",
          maxHeight: "95vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "warning.light",
          color: "warning.contrastText",
          py: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Visibility />
          <Typography variant="h6" component="span">
            Preview do Orçamento
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "warning.contrastText" }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      {/* Aviso de rascunho */}
      <Box
        sx={{
          bgcolor: "warning.main",
          color: "warning.contrastText",
          py: 1,
          px: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="body2" fontWeight="bold">
          ⚠️ RASCUNHO - Este é apenas um preview do orçamento. Salve para gerar
          o PDF oficial.
        </Typography>
      </Box>

      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          userSelect: "none",
        }}
        onContextMenu={handleContextMenu}
      >
        {/* 
          Wrapper para esconder a toolbar do PDFViewer
          A toolbar contém o botão de download, então vamos ocultá-la
        */}
        <Box
          sx={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            "& iframe": {
              border: "none",
            },
          }}
        >
          <PDFViewer
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            showToolbar={false}
          >
            {pdfDocument}
          </PDFViewer>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "grey.100" }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mr: "auto" }}
        >
          Salve o orçamento para gerar o PDF oficial com download habilitado.
        </Typography>
        <Button onClick={onClose} variant="contained">
          Fechar Preview
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BudgetPreviewModal;
