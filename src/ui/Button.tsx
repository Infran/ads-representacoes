import React from "react";
import { Button as MuiButton, ButtonProps } from "@mui/material";

/**
 * Botão canônico do app (UI U2.1). Encapsula o `Button` do MUI já tematizado
 * (textTransform none, raio de marca, sem elevação — ver `getTheme`). Ponto
 * único de import para os botões da biblioteca atômica; substitui o
 * `StyledButton` do modalStyles (cujo hover/hex morrem aqui).
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <MuiButton ref={ref} {...props} />
);

Button.displayName = "Button";

export default Button;
