import React from 'react';
import {
  Modal,
  Paper,
  Typography,
  Button,
  IconButton,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ClientDeleteModalProps {
  client: {
    id: string;
    name: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteClientModal: React.FC<ClientDeleteModalProps> = ({
  client,
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="delete-client-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        sx={{
          padding: 4,
          minWidth: 400,
          position: 'relative',
        }}
      >
        {/* Botão de fechar */}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Conteúdo do modal */}
        <Stack spacing={3}>
          <Typography variant="h6" component="h2">
            Confirmar exclusão
          </Typography>

          <Typography>
            Tem certeza que deseja excluir o cliente{' '}
            <strong>{client?.name}</strong>? Esta ação não pode ser desfeita.
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ width: 120 }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={onConfirm}
              sx={{ width: 120 }}
            >
              Excluir
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Modal>
  );
};

export default DeleteClientModal;