import React, { useState } from "react";
import { IProduct } from "../../../../interfaces/iproduct";
import { addProduct } from "../../../../services/productServices";
import { useData } from "../../../../context/DataContext";
import ncmData from "../../../../tabela_ncm.json";
import { brMoneyMask, formatCurrencyToNumber } from "../../../../utils/Masks";
import { Modal, Button, notifySuccess } from "../../../../ui";
import { logger } from "../../../../utils/logger";
import ProductForm from "../../../Forms/ProductForm";

interface CreateProductModalProps {
  open: boolean;
  handleClose: () => void;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({
  open,
  handleClose,
}) => {
  const [product, setProduct] = useState<IProduct>({} as IProduct);
  const [error, setError] = useState<string | null>(null);
  const [maskedUnitValue, setMaskedUnitValue] = useState<string>("");

  // Usa dados do cache
  const { addProductToCache } = useData();

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

    // Converte o valor formatado para número de ponto flutuante e depois para centavos
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

  const handleAddProduct = async () => {
    if (!product.name || !product.ncm || !product.unitValue) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      // addProduct agora retorna o produto criado com ID gerado
      const createdProduct = await addProduct(product);

      // Atualiza o cache local com o produto completo (incluindo ID)
      addProductToCache(createdProduct);
      handleClose();
      setProduct({} as IProduct);
      setMaskedUnitValue("");
      setError(null);
      notifySuccess("Sucesso!", "Produto cadastrado com sucesso!");
    } catch (error) {
      logger.error("Erro ao adicionar produto:", error);
      setError("Ocorreu um erro ao adicionar o produto. Tente novamente.");
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
      title="Adicionar Produto"
      error={error}
      actions={
        <>
          <Button variant="outlined" color="inherit" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleAddProduct}
            disabled={!isFormValid}
          >
            Adicionar
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

export default CreateProductModal;
