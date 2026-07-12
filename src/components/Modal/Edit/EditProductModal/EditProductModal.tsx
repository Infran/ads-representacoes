import React, { useEffect, useState } from "react";
import { IProduct } from "../../../../interfaces/iproduct";
import {
  getProductById,
  updateProduct,
} from "../../../../services/productServices";
import { useData } from "../../../../context/DataContext";
import ncmData from "../../../../tabela_ncm.json";
import { brMoneyMask, formatCurrencyToNumber } from "../../../../utils/Masks";
import { Modal, Button } from "../../../../ui";
import { logger } from "../../../../utils/logger";
import ProductForm from "../../../Forms/ProductForm";

interface EditProductModalProps {
  open: boolean;
  handleClose: () => void;
  id: string;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  open,
  handleClose,
  id,
}) => {
  const [product, setProduct] = useState<IProduct>({} as IProduct);
  const [error, setError] = useState<string | null>(null);
  const [maskedUnitValue, setMaskedUnitValue] = useState<string>("");

  // Hook para atualizar o cache
  const { updateProductInCache } = useData();

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productData = await getProductById(id);
        setProduct(productData);

        // Converte o valor de centavos para reais e aplica a máscara
        if (productData.unitValue) {
          const valueInReais = (productData.unitValue / 100).toFixed(2); // Converte para reais
          setMaskedUnitValue(brMoneyMask(valueInReais));
        }
      } catch (error) {
        logger.error("Erro ao buscar produto:", error);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id]);

  const handleGenericChange = (name: string, value: string) => {
    setProduct((prevProduct) => ({ ...prevProduct, [name]: value }));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name === "unitValue") {
      handleUnitValueChange(value);
    } else {
      handleGenericChange(name, value);
    }
  };

  const handleUnitValueChange = (value: string) => {
    const maskedValue = brMoneyMask(value);
    setMaskedUnitValue(maskedValue);

    // Converte o valor formatado para número de ponto flutuante
    const numericValue = formatCurrencyToNumber(maskedValue);
    setProduct((prevProduct) => ({
      ...prevProduct,
      unitValue: numericValue * 100, // Converte para centavos
    }));
  };

  const handleNcmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const ncm = value.replace(/\D/g, "");

    const ncmEntry = ncmData.Nomenclaturas.find(
      (item) => item.Codigo.replace(/\D/g, "") === ncm
    );

    setProduct((prevProduct) => ({
      ...prevProduct,
      ncm: value,
      description: ncmEntry ? ncmEntry.Descricao : "",
    }));
  };

  const handleEditProduct = async () => {
    if (!product.name || !product.ncm || !product.unitValue) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      await updateProduct(product);

      // IMPORTANTE: Atualiza o cache para refletir as alterações imediatamente
      updateProductInCache(product);

      handleClose();
      setProduct({} as IProduct);
      setError(null);
    } catch (error) {
      logger.error("Erro ao editar produto:", error);
      setError("Ocorreu um erro ao editar o produto. Tente novamente.");
    }
  };

  const isFormValid = product.name && product.ncm && maskedUnitValue;

  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
        setProduct({} as IProduct);
      }}
      title="Editar Produto"
      error={error}
      actions={
        <>
          <Button variant="outlined" color="inherit" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleEditProduct}
            disabled={!isFormValid}
          >
            Salvar
          </Button>
        </>
      }
    >
      <ProductForm
        product={product}
        maskedUnitValue={maskedUnitValue}
        onChange={handleChange}
        onNcmChange={handleNcmChange}
      />
    </Modal>
  );
};

export default EditProductModal;
