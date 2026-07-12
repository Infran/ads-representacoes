import React, { useState, useEffect, useMemo } from "react";
import { IClient } from "../../../../interfaces/iclient";
import { IRepresentative } from "../../../../interfaces/irepresentative";
import {
  getRepresentativeById,
  updateRepresentative,
} from "../../../../services/representativeServices";
import { useData } from "../../../../context/DataContext";
import useDebounce from "../../../../hooks/useDebounce";
import { Modal, Button, notifySuccess } from "../../../../ui";
import { logger } from "../../../../utils/logger";
import RepresentativeForm from "../../../Forms/RepresentativeForm";

interface EditRepresentativeModalProps {
  open: boolean;
  handleClose: () => void;
  id: string;
}

const EditRepresentativeModal: React.FC<EditRepresentativeModalProps> = ({
  open,
  handleClose,
  id,
}) => {
  const [representative, setRepresentative] = useState<IRepresentative>(
    {} as IRepresentative
  );
  const [error, setError] = useState<string | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState<string>("");
  const debouncedClientSearchTerm = useDebounce(clientSearchTerm, 300);

  // Usa dados do cache - SEM chamadas ao Firestore!
  const { clients: allClients, updateRepresentativeInCache } = useData();

  // Filtra clientes localmente
  const clientList = useMemo(() => {
    if (!debouncedClientSearchTerm) return [];
    return allClients.filter((client) =>
      client.name
        ?.toLowerCase()
        .includes(debouncedClientSearchTerm.toLowerCase())
    );
  }, [allClients, debouncedClientSearchTerm]);

  useEffect(() => {
    const fetchRepresentativeData = async () => {
      try {
        const representativeData = await getRepresentativeById(id);
        setRepresentative(representativeData);
        if (representativeData.client) {
          setClientSearchTerm(representativeData.client.name);
        }
      } catch (error) {
        logger.error("Erro ao buscar representante:", error);
      }
    };

    if (id) {
      fetchRepresentativeData();
    }
  }, [id]);

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

  const handleEditRepresentative = async () => {
    if (!representative.name) {
      setError("Por favor, preencha o nome do representante.");
      return;
    }

    try {
      await updateRepresentative(representative);

      // IMPORTANTE: Atualiza o cache para refletir as alterações imediatamente
      updateRepresentativeInCache(representative);

      handleClose();
      setRepresentative({} as IRepresentative);
      setError(null);
      notifySuccess("Sucesso!", "Representante atualizado com sucesso!");
    } catch (error) {
      logger.error("Erro ao editar representante:", error);
      setError("Ocorreu um erro ao editar o representante. Tente novamente.");
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
      title="Editar Representante"
      error={error}
      actions={
        <>
          <Button variant="outlined" color="inherit" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleEditRepresentative}
            disabled={!isFormValid}
          >
            Salvar
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

export default EditRepresentativeModal;
