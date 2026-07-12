import React, { useState, useMemo } from "react";
import { IClient } from "../../../../interfaces/iclient";
import { IRepresentative } from "../../../../interfaces/irepresentative";
import { addRepresentative } from "../../../../services/representativeServices";
import { useData } from "../../../../context/DataContext";
import useDebounce from "../../../../hooks/useDebounce";
import { Modal, Button, notifySuccess } from "../../../../ui";
import { logger } from "../../../../utils/logger";
import RepresentativeForm from "../../../Forms/RepresentativeForm";

interface CreateRepresentativeModalProps {
  open: boolean;
  handleClose: () => void;
}

const CreateRepresentativeModal: React.FC<CreateRepresentativeModalProps> = ({
  open,
  handleClose,
}) => {
  const [representative, setRepresentative] = useState<IRepresentative>(
    {} as IRepresentative
  );
  const [error, setError] = useState<string | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState<string>("");
  const debouncedClientSearchTerm = useDebounce(clientSearchTerm, 300);

  // Usa dados do cache - SEM chamadas ao Firestore!
  const { clients: allClients, addRepresentativeToCache } = useData();

  // Filtra clientes localmente
  const clientList = useMemo(() => {
    if (!debouncedClientSearchTerm) return [];
    return allClients.filter((client) =>
      client.name
        ?.toLowerCase()
        .includes(debouncedClientSearchTerm.toLowerCase())
    );
  }, [allClients, debouncedClientSearchTerm]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setRepresentative({ ...representative, [name]: value });
  };

  const handleSelectClient = (client: IClient | null) => {
    setRepresentative({
      ...representative,
      client,
      address: client?.address,
      city: client?.city,
      state: client?.state,
      cep: client?.cep,
    } as IRepresentative);
  };

  const handleAddRepresentative = async () => {
    if (!representative.name) {
      setError("Por favor, preencha o nome do representante.");
      return;
    }

    try {
      // addRepresentative agora retorna o representante criado com ID gerado
      const createdRepresentative = await addRepresentative(representative);

      // Atualiza o cache local com o representante completo (incluindo ID)
      addRepresentativeToCache(createdRepresentative);
      handleClose();
      setRepresentative({} as IRepresentative);
      setError(null);
      notifySuccess("Sucesso!", "Representante cadastrado com sucesso!");
    } catch (error) {
      logger.error("Erro ao adicionar representante:", error);
      setError(
        "Ocorreu um erro ao adicionar o representante. Tente novamente."
      );
    }
  };

  const isFormValid = representative.name;

  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
        setRepresentative({} as IRepresentative);
      }}
      title="Adicionar Representante"
      error={error}
      actions={
        <>
          <Button variant="outlined" color="inherit" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleAddRepresentative}
            disabled={!isFormValid}
          >
            Adicionar
          </Button>
        </>
      }
    >
      <RepresentativeForm
        representative={representative}
        onChange={handleChange}
        clientOptions={clientList}
        onClientInputChange={setClientSearchTerm}
        onSelectClient={handleSelectClient}
      />
    </Modal>
  );
};

export default CreateRepresentativeModal;
