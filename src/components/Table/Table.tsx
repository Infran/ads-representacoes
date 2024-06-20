import * as React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "product", headerName: "Produto", width: 140 },
  { field: "desc", headerName: "Descrição", width: 500 },
  { field: "ncm", headerName: "NCM", width: 200 },
  { field: "icms", headerName: "%ICMS", width: 200 },
  { field: "qtde", headerName: "Quantidade", width: 200 },
  { field: "value", headerName: "Valor(Unit)", width: 230 },
  { field: "total", headerName: "Total", width: 230 },
];

const rows = [
  {
    id: 1,
    product: "Smartphone Ultra X",
    desc: "Smartphone com tela de 6.5 polegadas, 128GB de armazenamento, câmera de 48MP e bateria de longa duração.",
    ncm: "85171232",
    icms: "18%",
    qtde: 1,
    value: 1500,
    total: 1500,
  },
  {
    id: 2,
    product: "Notebook Pro 15",
    desc: "Notebook com processador Intel i7, 16GB de RAM, 512GB SSD e tela Full HD de 15.6 polegadas.",
    ncm: "84713012",
    icms: "18%",
    qtde: 1,
    value: 4500,
    total: 4500,
  },
  {
    id: 3,
    product: "Smartwatch Fit",
    desc: "Smartwatch com monitoramento de atividades físicas, frequência cardíaca, GPS e resistência à água.",
    ncm: "85176291",
    icms: "18%",
    qtde: 1,
    value: 800,
    total: 800,
  },
  {
    id: 4,
    product: "Fone de Ouvido Bluetooth",
    desc: "Fone de ouvido sem fio com cancelamento de ruído, som de alta qualidade e bateria de longa duração.",
    ncm: "85183000",
    icms: "18%",
    qtde: 1,
    value: 350,
    total: 350,
  },
  {
    id: 5,
    product: "Câmera DSLR Pro",
    desc: "Câmera DSLR com sensor de 24MP, lente intercambiável, gravação de vídeo em 4K e conectividade Wi-Fi.",
    ncm: "85258029",
    icms: "18%",
    qtde: 1,
    value: 6000,
    total: 6000,
  },
  {
    id: 6,
    product: "Tablet X10",
    desc: "Tablet com tela de 10.1 polegadas, 64GB de armazenamento, processador octa-core e suporte a caneta digital.",
    ncm: "84713019",
    icms: "18%",
    qtde: 1,
    value: 1200,
    total: 1200,
  },
  {
    id: 7,
    product: "Console de Videogame",
    desc: "Console de videogame de última geração com 1TB de armazenamento, suporte a jogos em 4K e controles sem fio.",
    ncm: "95045000",
    icms: "18%",
    qtde: 1,
    value: 2500,
    total: 2500,
  },
];
// Randomize the order of rows

export default function DataTable() {
  return (
    <div style={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        style={{ fontSize: "20px" }}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 5 },
          },
        }}
        pageSizeOptions={[5, 10]}
        checkboxSelection
      />
    </div>
  );
}
