import React from "react";
import { Autocomplete, Grid, TextField } from "@mui/material";
import { Apartment, Badge, Phone } from "@mui/icons-material";
import { IClient } from "../../interfaces/iclient";
import { IRepresentative } from "../../interfaces/irepresentative";
import { mobilePhoneMask, phoneMask } from "../../utils/Masks";
import { Field, FormSection } from "../../ui";
import AddressFields from "./AddressFields";

interface RepresentativeFormProps {
  representative: IRepresentative;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Atualização de múltiplos campos (busca por CEP / dropdowns de endereço). */
  onPatch: (patch: Partial<IRepresentative>) => void;
  /** Opções do autocomplete de cliente (já filtradas/debounced no modal). */
  clientOptions: IClient[];
  onClientInputChange: (value: string) => void;
  onSelectClient: (client: IClient | null) => void;
}

/**
 * Campos compartilhados do formulário de Representante (EST F3.3) — consumidos
 * pelos modais Create e Edit. Autocomplete de cliente + dados + contato + endereço.
 * Aplica máscaras (telefone/celular/cep) em ambos os modos (reconciliação — ver
 * ClientForm). Endereço via `AddressFields` (CEP/BrasilAPI + dropdowns). Tokenizado.
 */
const RepresentativeForm: React.FC<RepresentativeFormProps> = ({
  representative,
  onChange,
  onPatch,
  clientOptions,
  onClientInputChange,
  onSelectClient,
}) => (
  <>
    <FormSection icon={Apartment}>Selecione um Cliente</FormSection>
    <Autocomplete
      options={clientOptions}
      getOptionLabel={(option) => option.name}
      onInputChange={(_event, value) => onClientInputChange(value)}
      onChange={(_event, value) => onSelectClient(value)}
      openOnFocus
      noOptionsText="Nenhum cliente encontrado"
      value={representative.client || null}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Cliente"
          variant="outlined"
          fullWidth
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
      )}
    />

    <FormSection icon={Badge}>Informações</FormSection>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Field
          id="name"
          name="name"
          label="Nome"
          value={representative.name || ""}
          onChange={onChange}
          inputProps={{ maxLength: 80 }}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          id="role"
          name="role"
          label="Cargo"
          value={representative.role || ""}
          onChange={onChange}
          inputProps={{ maxLength: 50 }}
        />
      </Grid>
    </Grid>

    <FormSection icon={Phone}>Contato</FormSection>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Field
          id="email"
          name="email"
          label="Email"
          type="email"
          value={representative.email || ""}
          onChange={onChange}
          inputProps={{ maxLength: 80 }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          id="phone"
          name="phone"
          label="Telefone"
          value={phoneMask(representative?.phone) || ""}
          onChange={onChange}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Field
          id="mobilePhone"
          name="mobilePhone"
          label="Celular"
          value={mobilePhoneMask(representative.mobilePhone) || ""}
          onChange={onChange}
        />
      </Grid>
    </Grid>

    <AddressFields
      values={representative}
      onChange={onChange}
      onPatch={onPatch}
    />
  </>
);

export default RepresentativeForm;
