import React, { useEffect, useState } from "react";
import { IClient } from "../../../../interfaces/iclient";
import {
  getClientById,
  updateClient,
} from "../../../../services/clientServices";
import { useData } from "../../../../context/DataContext";
import { isValidCnpj } from "../../../../utils/validators";
import { Modal, Button, ListSkeleton } from "../../../../ui";
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

  // Usa dados do cache
  const { updateClientInCache } = useData();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setClient({ ...client, [name]: value });
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

    try {
      await updateClient(client);
      // Atualiza o cache local em vez de recarregar a página
      updateClientInCache(client);
      handleClose();
      setClient({} as IClient);
      setError(null);
    } catch (error) {
      logger.error("Erro ao editar cliente:", error);
      setError("Ocorreu um erro ao editar o cliente. Tente novamente.");
    }
  };

  const isFormValid = client.name && client.cep;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Editar Cliente"
      error={error}
      actions={
        isLoading ? undefined : (
          <>
            <Button variant="outlined" color="inherit" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleEditClient}
              disabled={!isFormValid}
            >
              Salvar
            </Button>
          </>
        )
      }
    >
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : (
        <ClientForm client={client} onChange={handleChange} />
      )}
    </Modal>
  );
};

export default EditClientModal;
