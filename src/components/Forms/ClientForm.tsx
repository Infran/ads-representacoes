import React from "react";
import { Grid, Typography } from "@mui/material";
import { IClient } from "../../interfaces/iclient";
import { cepMask, cnpjMask, mobilePhoneMask } from "../../utils/Masks";
import { Field } from "../../ui";

interface ClientFormProps {
  client: IClient;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Campos compartilhados do formulário de Cliente (EST F3.3) — consumidos pelos
 * modais Create e Edit. Aplica máscaras (cnpj/telefone/cep) em ambos os modos:
 * **reconciliação deliberada** — o Edit antes gravava valores crus; agora segue
 * o Create (as máscaras são idempotentes, ver Masks.ts). Tokenizado (átomo Field).
 */
const ClientForm: React.FC<ClientFormProps> = ({ client, onChange }) => (
  <>
    <Typography
      variant="subtitle1"
      sx={{ fontWeight: "bold", color: "text.secondary" }}
    >
      Informações:
    </Typography>

    <Field
      id="name"
      name="name"
      label="Nome"
      value={client.name || ""}
      onChange={onChange}
      required
    />
    <Field
      id="cnpj"
      name="cnpj"
      label="CNPJ"
      value={cnpjMask(client.cnpj || "")}
      onChange={onChange}
      inputProps={{ maxLength: 18 }}
    />

    <Typography
      variant="subtitle1"
      sx={{ mt: 1, fontWeight: "bold", color: "text.secondary" }}
    >
      Contato:
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Field
          id="phone"
          name="phone"
          label="Telefone"
          value={mobilePhoneMask(client.phone || "")}
          onChange={onChange}
        />
      </Grid>
      <Grid item xs={6}>
        <Field
          id="email"
          name="email"
          label="Email"
          type="email"
          value={client.email || ""}
          onChange={onChange}
          inputProps={{ maxLength: 50 }}
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
          value={cepMask(client.cep || "")}
          onChange={onChange}
        />
      </Grid>
      <Grid item xs={6}>
        <Field
          id="address"
          name="address"
          label="Endereço"
          value={client.address || ""}
          onChange={onChange}
        />
      </Grid>
      <Grid item xs={6}>
        <Field
          id="city"
          name="city"
          label="Cidade"
          value={client.city || ""}
          onChange={onChange}
        />
      </Grid>
      <Grid item xs={6}>
        <Field
          id="state"
          name="state"
          label="Estado"
          value={client.state || ""}
          onChange={onChange}
        />
      </Grid>
    </Grid>
  </>
);

export default ClientForm;
