import React, { useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  CircularProgress,
  createFilterOptions,
  Grid,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { LocationOn, Search } from "@mui/icons-material";
import { cepMask } from "../../utils/Masks";
import { estadoPatch, resolverUf, ufs, type Uf } from "../../utils/ufs";
import { carregarCidades } from "../../utils/cidades";
import { buscarCep } from "../../utils/brasilApiCep";
import { Field, FormSection, notifyError, notifyWarning } from "../../ui";

/** Subconjunto de endereço comum a Cliente e Representante. */
interface AddressValues {
  cep?: string;
  address?: string;
  city?: string;
  /** Nome do estado ("São Paulo"). */
  state?: string;
  /** Sigla da UF ("SP"). */
  uf?: string;
}

interface AddressFieldsProps {
  values: AddressValues;
  /** Atualização campo-a-campo (cep/endereço digitados). */
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Atualização de múltiplos campos de uma vez (busca por CEP / dropdowns). */
  onPatch: (patch: Partial<AddressValues>) => void;
  cepRequired?: boolean;
}

/** Filtra as cidades por busca, limitando itens renderizados (UFs grandes, ex.: SP ~645). */
const filtrarCidades = createFilterOptions<string>({ limit: 50 });

/**
 * Bloco de Endereço compartilhado pelos formulários de Cliente e Representante.
 * Permite preencher via **CEP** (BrasilAPI, com normalização contra o nosso
 * estados-cidade.json) ou selecionar **Estado → Cidade** em dropdowns.
 *
 * Estado é persistido em **dois campos**: `state` (nome, "São Paulo") e `uf`
 * (sigla, "SP"). Ambos saem sempre de `estadoPatch`, que os deriva da mesma
 * fonte — nenhum caminho grava um sem o outro, então não há como divergirem.
 * Cidade é tolerante (freeSolo): aceita texto livre e preserva valores legados
 * fora da lista.
 */
const AddressFields: React.FC<AddressFieldsProps> = ({
  values,
  onChange,
  onPatch,
  cepRequired,
}) => {
  const [cepLoading, setCepLoading] = useState(false);
  const [cidadeOptions, setCidadeOptions] = useState<string[]>([]);
  // Último CEP consultado (8 dígitos) — evita busca duplicada blur + clique.
  const ultimoCepBuscado = useRef<string | null>(null);
  // Espelho dos valores atuais: a resposta do CEP chega centenas de ms depois,
  // e o `values` do closure já está velho quando ela resolve (ver handleCepLookup).
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const ufSelecionada = resolverUf(values) ?? null;
  const sigla = ufSelecionada?.sigla;

  // Cidades vêm de um chunk carregado sob demanda (utils/cidades.ts).
  useEffect(() => {
    let ativo = true;
    carregarCidades(sigla).then((cidades) => {
      if (ativo) setCidadeOptions(cidades);
    });
    return () => {
      ativo = false;
    };
  }, [sigla]);

  const handleCepLookup = async (explicit: boolean) => {
    const digits = (values.cep || "").replace(/\D/g, "");

    if (digits.length !== 8) {
      // No blur automático não incomoda; só avisa quando o usuário clica na lupa.
      if (explicit) {
        notifyWarning("CEP incompleto", "Informe os 8 dígitos do CEP.");
      }
      return;
    }
    // O guard de deduplicação vale só para o blur: o clique na lupa é um pedido
    // explícito de rebusca (ex.: o usuário limpou o Endereço e quer preencher
    // de novo) e nunca deve virar um no-op silencioso.
    if (!explicit && digits === ultimoCepBuscado.current) return;

    ultimoCepBuscado.current = digits;
    // Snapshot para detectar digitação concorrente enquanto o fetch está no ar.
    const enderecoAoIniciar = values.address ?? "";
    setCepLoading(true);
    try {
      const endereco = await buscarCep(digits);
      if (!endereco) {
        notifyWarning("CEP não encontrado", "Verifique o número digitado.");
        return;
      }

      const patch: Partial<AddressValues> = { city: endereco.cidade };

      // A API pode devolver uma UF que não casa com a nossa tabela; nesse caso
      // estadoPatch devolve null e preservamos o que já estava lá, avisando —
      // melhor que deixar o campo em branco sem explicação.
      const estado = estadoPatch(endereco.uf);
      if (estado) {
        Object.assign(patch, estado);
      } else {
        notifyWarning(
          "Estado não reconhecido",
          `A consulta retornou "${endereco.uf}". Selecione o estado manualmente.`
        );
      }

      // Só sobrescreve o Endereço se o usuário não digitou nada nele durante a
      // busca — senão as teclas dele sumiriam no meio da digitação.
      const digitouDurante = (valuesRef.current.address ?? "") !== enderecoAoIniciar;
      if (endereco.endereco && !digitouDurante) {
        patch.address = endereco.endereco;
      }

      onPatch(patch);
    } catch {
      ultimoCepBuscado.current = null; // permite nova tentativa após falha de rede
      notifyError("Erro ao buscar CEP", "Não foi possível consultar o CEP agora.");
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <>
      <FormSection icon={LocationOn}>Endereço</FormSection>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Field
            id="cep"
            name="cep"
            label="CEP"
            value={cepMask(values.cep || "")}
            onChange={onChange}
            onBlur={() => handleCepLookup(false)}
            required={cepRequired}
            inputProps={{ maxLength: 9 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Buscar endereço pelo CEP"
                    onClick={() => handleCepLookup(true)}
                    disabled={cepLoading}
                    edge="end"
                  >
                    {cepLoading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <Search />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field
            id="address"
            name="address"
            label="Endereço"
            value={values.address || ""}
            onChange={onChange}
            inputProps={{ maxLength: 80 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Autocomplete<Uf>
            options={ufs}
            getOptionLabel={(uf) => `${uf.sigla} - ${uf.nome}`}
            value={ufSelecionada}
            isOptionEqualToValue={(option, value) => option.sigla === value.sigla}
            onChange={(_event, value) =>
              onPatch({ ...(estadoPatch(value?.sigla) ?? {}), city: "" })
            }
            noOptionsText="Nenhum estado encontrado"
            renderInput={(params) => <Field {...params} label="Estado" />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Autocomplete<string, false, false, true>
            freeSolo
            options={cidadeOptions}
            filterOptions={filtrarCidades}
            inputValue={values.city || ""}
            onInputChange={(_event, value) => onPatch({ city: value })}
            noOptionsText="Selecione um estado primeiro"
            renderInput={(params) => <Field {...params} label="Cidade" />}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default AddressFields;
