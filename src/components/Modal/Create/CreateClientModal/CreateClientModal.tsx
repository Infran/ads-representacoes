import React, { useState } from "react";
import { IClient } from "../../../../interfaces/iclient";
import { addClient } from "../../../../services/clientServices";
import { useData } from "../../../../context/DataContext";
import { isValidCnpj } from "../../../../utils/validators";
import { Modal, Button } from "../../../../ui";
import { logger } from "../../../../utils/logger";
import ClientForm from "../../../Forms/ClientForm";

interface CreateClientModalProps {
  open: boolean;
  handleClose: () => void;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({
  open,
  handleClose,
}) => {
  const [client, setClient] = useState<IClient>({} as IClient);
  const [error, setError] = useState<string | null>(null);

  // Usa dados do cache
  const { addClientToCache } = useData();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setClient({ ...client, [name]: value });
  };

  const handleAddClient = async () => {
    // Validação básica de campos obrigatórios
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
      // addClient agora retorna o cliente criado com ID gerado
      const createdClient = await addClient(client);

      // Atualiza o cache local com o cliente completo (incluindo ID)
      addClientToCache(createdClient);
      handleClose();
      setClient({} as IClient);
      setError(null);
    } catch (error) {
      logger.error("Erro ao adicionar cliente:", error);
      setError("Ocorreu um erro ao adicionar o cliente. Tente novamente.");
    }
  };

  const isFormValid = client.name && client.cep;

  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
        setClient({} as IClient);
      }}
      title="Adicionar Cliente"
      error={error}
      actions={
        <>
          <Button variant="outlined" color="inherit" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleAddClient}
            disabled={!isFormValid}
          >
            Adicionar
          </Button>
        </>
      }
    >
      <ClientForm client={client} onChange={handleChange} />
    </Modal>
  );
};

export default CreateClientModal;
