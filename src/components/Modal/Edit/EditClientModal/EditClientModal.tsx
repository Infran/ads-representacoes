import React, { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { Apartment } from "@mui/icons-material";
import { IClient } from "../../../../interfaces/iclient";
import {
  getClientById,
  updateClient,
} from "../../../../services/clientServices";
import { useData } from "../../../../context/DataContext";
import { isValidCnpj } from "../../../../utils/validators";
import { Modal, Button, ListSkeleton, notifySuccess } from "../../../../ui";
import { logger } from "../../../../utils/logger";
import ClientForm from "../../../Forms/ClientForm";

interface EditClientModalProps {
  open: boolean;
  handleClose: () => void;
  id: string;
}

const EditClientModal: React.FC<EditClientModalProps> = ({
  open,
  handleClose,
  id,
}) => {
  const [client, setClient] = useState<IClient>({} as IClient);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Usa dados do cache
  const { updateClientInCache } = useData();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setClient({ ...client, [name]: value });
  };

  const handlePatch = (patch: Partial<IClient>) =>
    setClient((prev) => ({ ...prev, ...patch }));

  // Fecha e descarta as edições não salvas. Usado tanto pelo X/backdrop quanto
  // pelo Cancelar, para que as duas formas de fechar tenham o mesmo efeito.
  const closeAndReset = () => {
    if (isSubmitting) return;
    handleClose();
    setClient({} as IClient);
    setError(null);
  };

  useEffect(() => {
    const fetchClientData = async () => {
      setIsLoading(true);
      try {
        const clientData = await getClientById(id);
        setClient(clientData);
      } catch (error) {
        logger.error("Erro ao buscar cliente:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchClientData();
    }
  }, [id]);

  const handleEditClient = async () => {
    if (!client.name || !client.cep) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // CNPJ opcional; se informado, precisa ter dígitos verificadores válidos (SEG S2.2).
    if (
      client.cnpj &&
      client.cnpj.replace(/\D/g, "").length > 0 &&
      !isValidCnpj(client.cnpj)
    ) {
      setError("CNPJ inválido. Verifique os dígitos.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateClient(client);
      // Atualiza o cache local em vez de recarregar a página
      updateClientInCache(client);
      handleClose();
      setClient({} as IClient);
      setError(null);
      notifySuccess("Sucesso!", "Cliente atualizado com sucesso!");
    } catch (error) {
      logger.error("Erro ao editar cliente:", error);
      setError("Ocorreu um erro ao editar o cliente. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = client.name && client.cep;

  return (
    <Modal
      open={open}
      onClose={closeAndReset}
      title="Editar Cliente"
      icon={Apartment}
      error={error}
      actions={
        isLoading ? undefined : (
          <>
            <Button
              variant="outlined"
              color="inherit"
              onClick={closeAndReset}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleEditClient}
              disabled={!isFormValid || isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </>
        )
      }
    >
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : (
        <ClientForm
          client={client}
          onChange={handleChange}
          onPatch={handlePatch}
        />
      )}
    </Modal>
  );
};

export default EditClientModal;
