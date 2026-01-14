import React from "react";
import {
  Box,
  IconButton,
  Grid,
  Paper,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import { Remove, Add, Delete, Edit } from "@mui/icons-material";
import { ISelectedProducts } from "../../interfaces/ibudget";
import { brMoneyMask } from "../../utils/Masks";

interface ProductListProps {
  products: ISelectedProducts[];
  onRemove: (index: number) => void;
  onQuantityChange: (index: number, delta: number) => void;
  /** Callback para definir quantidade diretamente */
  onSetQuantity?: (index: number, quantity: number) => void;
  /** Callback para editar valor customizado - se não fornecido, não mostra campo de edição */
  onValueChange?: (index: number, value: string) => void;
  /** Se true, mostra o valor original do produto quando há valor customizado */
  showOriginalValue?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onRemove,
  onQuantityChange,
  onSetQuantity,
  onValueChange,
  showOriginalValue = false,
}) => {
  const allowValueEdit = Boolean(onValueChange);

  if (products.length === 0) {
    return null;
  }

  const handleQuantityInput = (index: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && onSetQuantity) {
      onSetQuantity(index, numValue);
    }
  };

  return (
    <>
      {products.map((item, index) => {
        const currentUnitValue = item.customUnitValue ?? item.product.unitValue;
        const itemTotal = currentUnitValue * item.quantity;
        const hasCustomValue = item.customUnitValue !== undefined;

        return (
          <Paper
            key={index}
            sx={{
              padding: 2,
              marginY: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box flexGrow={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {item.product.name}
                </Typography>
                {showOriginalValue && (
                  <Typography variant="caption" color="text.secondary">
                    Valor original: R${" "}
                    {brMoneyMask(item.product.unitValue.toString())}
                  </Typography>
                )}
                {!showOriginalValue && !allowValueEdit && (
                  <Typography variant="body2">
                    Valor Unitário: R${" "}
                    {brMoneyMask(item.product.unitValue.toString())}
                  </Typography>
                )}
              </Box>
              <IconButton
                color="error"
                onClick={() => onRemove(index)}
                size="small"
                title="Remover produto"
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>

            <Grid container spacing={2} alignItems="center">
              {allowValueEdit ? (
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Valor Unitário (R$)"
                    size="small"
                    fullWidth
                    value={brMoneyMask(currentUnitValue.toString())}
                    onChange={(e) => onValueChange!(index, e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Edit
                          sx={{ mr: 1, color: "text.secondary", fontSize: 18 }}
                        />
                      ),
                    }}
                    helperText={hasCustomValue ? "Valor customizado" : ""}
                  />
                </Grid>
              ) : (
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    R$ {brMoneyMask(currentUnitValue.toString())} / unidade
                  </Typography>
                </Grid>
              )}

              <Grid item xs={6} sm={3}>
                <Box display="flex" alignItems="center">
                  <IconButton
                    size="small"
                    onClick={() => onQuantityChange(index, -1)}
                    disabled={item.quantity <= 1}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 0.5,
                    }}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                  <TextField
                    size="small"
                    value={item.quantity}
                    onChange={(e) => handleQuantityInput(index, e.target.value)}
                    inputProps={{
                      style: { textAlign: "center", width: 40 },
                      min: 1,
                      type: "number",
                    }}
                    sx={{
                      mx: 1,
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: "divider",
                        },
                      },
                      "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                        {
                          display: "none",
                        },
                      "& input[type=number]": {
                        MozAppearance: "textfield",
                      },
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => onQuantityChange(index, 1)}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 0.5,
                    }}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>

              <Grid item xs={6} sm={5}>
                <Box textAlign="right">
                  <Typography variant="body2" color="text.secondary">
                    Subtotal:
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    R$ {brMoneyMask(itemTotal.toFixed(0))}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        );
      })}
    </>
  );
};

export default ProductList;
