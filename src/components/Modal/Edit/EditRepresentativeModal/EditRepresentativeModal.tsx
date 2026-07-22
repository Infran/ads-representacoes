import React, { useState, useEffect, useMemo } from "react";
import { CircularProgress } from "@mui/material";
import { Groups } from "@mui/icons-material";
import { IClient } from "../../../../interfaces/iclient";
import { estadoPatch, getUf } from "../../../../utils/ufs";
import { IRepresentative } from "../../../../interfaces/irepresentative";
import {
  getRepresentativeById,
  updateRepresentative,
} from "../../../../services/representativeServices";
import { useData } from "../../../../context/DataContext";
import useDebounce from "../../../../hooks/useDebounce";
import { Modal, Button, notifySuccess } from "../../../../ui";
import { captureError } from "../../../../utils/errorReporter";
import { logger } from "../../../../utils/logger";
import {
  INITIAL_SELECT_OPTIONS_LIMIT,
  withSelected,
} from "../../../../utils/selectOptions";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState<string>("");
  const debouncedClientSearchTerm = useDebounce(clientSearchTerm, 300);

  // Usa dados do cache - SEM chamadas ao Firestore!
  const {
    clients: allClients,
    searchClientsLocal,
    updateRepresentativeInCache,
  } = useData();

  // Filtra clientes localmente - sem busca, mostra os primeiros já carregados
  // (+ o cliente vinculado, que pode estar fora da janela truncada).
  const clientList = useMemo(() => {
    const lista = !debouncedClientSearchTerm
      ? allClients.slice(0, INITIAL_SELECT_OPTIONS_LIMIT)
      : searchClientsLocal(debouncedClientSearchTerm);
    return withSelected(lista, representative.client);
  }, [
    allClients,
    debouncedClientSearchTerm,
    searchClientsLocal,
    representative.client,
  ]);

  useEffect(() => {
    const fetchRepresentativeData = async () => {
      try {
        const representativeData = await getRepresentativeById(id);
        setRepresentative(representativeData);
        if (representativeData.client) {
          setClientSearchTerm(representativeData.client.name);
        }
      } catch (error) {
        captureError({
          source: "notify",
          error,
          title: "Erro ao carregar representante",
        });
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

  const handlePatch = (patch: Partial<IRepresentative>) =>
    setRepresentative((prev) => ({ ...prev, ...patch }));

  // Fecha e zera o formulário. Usado tanto pelo X/backdrop quanto pelo Cancelar,
  // para que as duas formas de fechar tenham o mesmo efeito.
  const closeAndReset = () => {
    if (isSubmitting) return;
    handleClose();
    setRepresentative({} as IRepresentative);
    setClientSearchTerm("");
    setError(null);
  };

  const handleSelectClient = (client: IClient | null) => {
    setRepresentative({
      ...representative,
      client,
      address: client?.address,
      city: client?.city,
      // Deriva state+uf da mesma fonte (tolera cliente legado com sigla em state).
      // `null` = estado do cliente irreconhecível: preserva o que já estava
      // gravado em vez de apagar os dois campos.
      ...(estadoPatch(getUf(client)) ?? {}),
      cep: client?.cep,
    } as IRepresentative);
  };

  const handleEditRepresentative = async () => {
    if (!representative.name) {
      setError("Por favor, preencha o nome do representante.");
      return;
    }

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = representative.name;

  return (
    <Modal
      open={open}
      onClose={closeAndReset}
      title="Editar Representante"
      icon={Groups}
      width={640}
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
            onClick={handleEditRepresentative}
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
      }
    >
      <RepresentativeForm
        representative={representative}
        onChange={handleChange}
        onPatch={handlePatch}
        clientOptions={clientList}
        onClientInputChange={setClientSearchTerm}
        onSelectClient={handleSelectClient}
      />
    </Modal>
  );
};

export default EditRepresentativeModal;
