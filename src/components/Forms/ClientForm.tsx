import React from "react";
import { Grid } from "@mui/material";
import { Person, Phone } from "@mui/icons-material";
import { IClient } from "../../interfaces/iclient";
import { cnpjMask, mobilePhoneMask } from "../../utils/Masks";
import { Field, FormSection } from "../../ui";
import AddressFields from "./AddressFields";

interface ClientFormProps {
  client: IClient;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Atualização de múltiplos campos (busca por CEP / dropdowns de endereço). */
  onPatch: (patch: Partial<IClient>) => void;
}

/**
 * Campos compartilhados do formulário de Cliente (EST F3.3) — consumidos pelos
 * modais Create e Edit. Aplica máscaras (cnpj/telefone/cep) em ambos os modos:
 * **reconciliação deliberada** — o Edit antes gravava valores crus; agora segue
 * o Create (as máscaras são idempotentes, ver Masks.ts). Endereço é preenchido
 * por CEP (BrasilAPI) ou dropdowns Estado/Cidade via `AddressFields`. Tokenizado.
 */
const ClientForm: React.FC<ClientFormProps> = ({ client, onChange, onPatch }) => (
  <>
    <FormSection icon={Person}>Informações</FormSection>

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

    <FormSection icon={Phone}>Contato</FormSection>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Field
          id="phone"
          name="phone"
          label="Telefone"
          value={mobilePhoneMask(client.phone || "")}
          onChange={onChange}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
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

    <AddressFields
      values={client}
      onChange={onChange}
      onPatch={onPatch}
      cepRequired
    />
  </>
);

export default ClientForm;
