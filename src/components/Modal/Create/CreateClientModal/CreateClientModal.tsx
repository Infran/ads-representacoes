import React, { useState } from "react";
import { CircularProgress } from "@mui/material";
import { Apartment } from "@mui/icons-material";
import { IClient } from "../../../../interfaces/iclient";
import { addClient } from "../../../../services/clientServices";
import { useData } from "../../../../context/DataContext";
import { isValidCnpj } from "../../../../utils/validators";
import { Modal, Button, notifySuccess } from "../../../../ui";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Usa dados do cache
  const { addClientToCache } = useData();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setClient({ ...client, [name]: value });
  };

  const handlePatch = (patch: Partial<IClient>) =>
    setClient((prev) => ({ ...prev, ...patch }));

  // Fecha e zera o formulário. Usado tanto pelo X/backdrop quanto pelo Cancelar:
  // sem isso as duas formas de fechar divergem e o Cancelar deixa os dados do
  // cadastro abandonado pré-preenchidos na próxima abertura.
  const closeAndReset = () => {
    if (isSubmitting) return;
    handleClose();
    setClient({} as IClient);
    setError(null);
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

    setIsSubmitting(true);
    try {
      // addClient agora retorna o cliente criado com ID gerado
      const createdClient = await addClient(client);

      // Atualiza o cache local com o cliente completo (incluindo ID)
      addClientToCache(createdClient);
      handleClose();
      setClient({} as IClient);
      setError(null);
      notifySuccess("Sucesso!", "Cliente cadastrado com sucesso!");
    } catch (error) {
      logger.error("Erro ao adicionar cliente:", error);
      setError("Ocorreu um erro ao adicionar o cliente. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = client.name && client.cep;

  return (
    <Modal
      open={open}
      onClose={closeAndReset}
      title="Adicionar Cliente"
      icon={Apartment}
      error={error}
      actions={
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
            onClick={handleAddClient}
            disabled={!isFormValid || isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {isSubmitting ? "Salvando..." : "Adicionar"}
          </Button>
        </>
      }
    >
      <ClientForm
        client={client}
        onChange={handleChange}
        onPatch={handlePatch}
      />
    </Modal>
  );
};

export default CreateClientModal;
