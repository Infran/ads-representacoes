import React from "react";
import { Grid, InputAdornment } from "@mui/material";
import { IProduct } from "../../interfaces/iproduct";
import { Field } from "../../ui";

interface ProductFormProps {
  product: IProduct;
  maskedUnitValue: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNcmChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Campos compartilhados do formulário de Produto (EST F3.3) — consumidos pelos
 * modais Create e Edit (que já eram quase idênticos). NCM (com lookup no modal),
 * ICMS (%), nome, quantidade (fixa em 0, desabilitada), valor unitário (R$,
 * mascarado) e descrição. Tokenizado (átomo Field).
 */
const ProductForm: React.FC<ProductFormProps> = ({
  product,
  maskedUnitValue,
  onChange,
  onNcmChange,
}) => (
  <>
    <Grid container spacing={1}>
      <Grid item xs={6}>
        <Field
          id="ncm"
          name="ncm"
          label="NCM"
          value={product.ncm || ""}
          onChange={onNcmChange}
        />
      </Grid>
      <Grid item xs={6}>
        <Field
          id="icms"
          name="icms"
          label="ICMS"
          value={product.icms || ""}
          onChange={onChange}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
        />
      </Grid>
    </Grid>
    <Field
      id="name"
      name="name"
      label="Nome do Produto"
      value={product.name || ""}
      onChange={onChange}
    />
    <Grid container spacing={1}>
      <Grid item xs={6}>
        <Field
          id="quantity"
          name="quantity"
          label="Quantidade em Estoque"
          value={"0"}
          onChange={onChange}
          disabled
        />
      </Grid>
      <Grid item xs={6}>
        <Field
          id="unitValue"
          name="unitValue"
          label="Valor (Unitário)"
          value={maskedUnitValue || ""}
          onChange={onChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">R$</InputAdornment>
            ),
          }}
        />
      </Grid>
    </Grid>
    <Field
      id="description"
      name="description"
      label="Descrição"
      value={product.description || ""}
      onChange={onChange}
    />
  </>
);

export default ProductForm;
