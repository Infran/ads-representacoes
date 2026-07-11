import React from "react";
import { TextField, TextFieldProps } from "@mui/material";

/**
 * Campo de texto tokenizado (UI U2.1). Wrapper fino sobre o `TextField` do MUI
 * com defaults do app (outlined, fullWidth) e o realce de foco pela cor de marca
 * — herdada do tema, sem hex local. Substitui o `StyledTextField` do modalStyles.
 */
const Field: React.FC<TextFieldProps> = (props) => (
  <TextField
    variant="outlined"
    fullWidth
    {...props}
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: 2,
      },
      ...props.sx,
    }}
  />
);

export default Field;
