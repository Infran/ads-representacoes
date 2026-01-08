import React from "react";
import { Box, Button, Grid, Paper, TextField, Typography } from "@mui/material";
import { ArrowDropDown, ArrowDropUp, Delete, Edit } from "@mui/icons-material";
import { ISelectedProducts } from "../../interfaces/ibudget";
import { brMoneyMask } from "../../utils/Masks";

interface ProductListProps {
  products: ISelectedProducts[];
  onRemove: (index: number) => void;
  onQuantityChange: (index: number, delta: number) => void;
  /** Callback para editar valor customizado - se não fornecido, não mostra campo de edição */
  onValueChange?: (index: number, value: string) => void;
  /** Se true, mostra o valor original do produto quando há valor customizado */
  showOriginalValue?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onRemove,
  onQuantityChange,
  onValueChange,
  showOriginalValue = false,
}) => {
  const allowValueEdit = Boolean(onValueChange);

  if (products.length === 0) {
    return null;
  }

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
              <Button
                color="error"
                onClick={() => onRemove(index)}
                startIcon={<Delete />}
                size="small"
              >
                Remover
              </Button>
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
                <Box display="flex" alignItems="center" gap={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onQuantityChange(index, -1)}
                  >
                    <ArrowDropDown />
                  </Button>
                  <Typography sx={{ minWidth: 30, textAlign: "center" }}>
                    {item.quantity}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onQuantityChange(index, 1)}
                  >
                    <ArrowDropUp />
                  </Button>
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
