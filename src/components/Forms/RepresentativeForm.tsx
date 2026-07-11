import React from "react";
import { Autocomplete, Grid, TextField, Typography } from "@mui/material";
import { IClient } from "../../interfaces/iclient";
import { IRepresentative } from "../../interfaces/irepresentative";
import { cepMask, mobilePhoneMask, phoneMask } from "../../utils/Masks";
import { Field } from "../../ui";

interface RepresentativeFormProps {
  representative: IRepresentative;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Opções do autocomplete de cliente (já filtradas/debounced no modal). */
  clientOptions: IClient[];
  onClientInputChange: (value: string) => void;
  onSelectClient: (client: IClient | null) => void;
}

/**
 * Campos compartilhados do formulário de Representante (EST F3.3) — consumidos
 * pelos modais Create e Edit. Autocomplete de cliente + dados + contato + endereço.
 * Aplica máscaras (telefone/celular/cep) em ambos os modos (reconciliação — ver
 * ClientForm). Tokenizado (átomo Field).
 */
const RepresentativeForm: React.FC<RepresentativeFormProps> = ({
  representative,
  onChange,
  clientOptions,
  onClientInputChange,
  onSelectClient,
}) => (
  <>
    <Typography
      variant="subtitle1"
      sx={{ fontWeight: "bold", color: "text.secondary" }}
    >
      Selecione um cliente:
    </Typography>
    <Autocomplete
      options={clientOptions}
      getOptionLabel={(option) => option.name}
      onInputChange={(_event, value) => onClientInputChange(value)}
      onChange={(_event, value) => onSelectClient(value)}
      noOptionsText="Digite o nome do Cliente."
      value={representative.client || null}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      renderInput={(params) => (
        <TextField {...params} label="Cliente" variant="outlined" fullWidth />
      )}
    />

    <Typography
      variant="subtitle1"
      sx={{ mt: 1, fontWeight: "bold", color: "text.secondary" }}
    >
      Informações:
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={6}>
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
      <Grid item xs={6}>
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

    <Typography
      variant="subtitle1"
      sx={{ mt: 1, fontWeight: "bold", color: "text.secondary" }}
    >
      Contato:
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={6}>
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
      <Grid item xs={6}>
        <Field
          id="phone"
          name="phone"
          label="Telefone"
          value={phoneMask(representative?.phone) || ""}
          onChange={onChange}
        />
      </Grid>
      <Grid item xs={6}>
        <Field
          id="mobilePhone"
          name="mobilePhone"
          label="Celular"
          value={mobilePhoneMask(representative.mobilePhone) || ""}
          onChange={onChange}
        />
      </Grid>
    </Grid>

    <Typography
      variant="subtitle1"
      sx={{ mt: 1, fontWeight: "bold", color: "text.secondary" }}
    >
      Endereço:
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Field
          id="cep"
          name="cep"
          label="CEP"
          value={cepMask(representative.cep) || ""}
          onChange={onChange}
        />
      </Grid>
      <Grid item xs={6}>
        <Field
          id="address"
          name="address"
          label="Endereço"
          value={representative.address || ""}
          onChange={onChange}
          inputProps={{ maxLength: 80 }}
        />
      </Grid>
      <Grid item xs={6}>
        <Field
          id="state"
          name="state"
          label="Estado"
          value={representative.state || ""}
          onChange={onChange}
          inputProps={{ maxLength: 2 }}
        />
      </Grid>
      <Grid item xs={6}>
        <Field
          id="city"
          name="city"
          label="Cidade"
          value={representative.city || ""}
          onChange={onChange}
          inputProps={{ maxLength: 50 }}
        />
      </Grid>
    </Grid>
  </>
);

export default RepresentativeForm;
