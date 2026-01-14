import {
  Home as HomeIcon,
  Apartment,
  Groups,
  Widgets,
  NoteAdd,
  Settings,
  HelpOutline,
} from "@mui/icons-material";
import { SvgIconComponent } from "@mui/icons-material";

export interface MenuItem {
  id: string;
  label: string;
  icon: SvgIconComponent;
  path: string;
  badge?: number;
}

export interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

export const sidebarConfig: MenuGroup[] = [
  {
    id: "main",
    label: "Principal",
    items: [{ id: "home", label: "Dashboard", icon: HomeIcon, path: "/Home" }],
  },
  {
    id: "cadastros",
    label: "Cadastros",
    items: [
      { id: "clientes", label: "Clientes", icon: Apartment, path: "/Clientes" },
      {
        id: "representantes",
        label: "Representantes",
        icon: Groups,
        path: "/Representantes",
      },
      { id: "produtos", label: "Produtos", icon: Widgets, path: "/Produtos" },
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    items: [
      {
        id: "orcamentos",
        label: "Orçamentos",
        icon: NoteAdd,
        path: "/Orcamentos",
      },
    ],
  },
  {
    id: "config",
    label: "Sistema",
    items: [
      {
        id: "settings",
        label: "Configurações",
        icon: Settings,
        path: "/Configuracoes",
      },
      { id: "help", label: "Ajuda", icon: HelpOutline, path: "/Ajuda" },
    ],
  },
];

// Mapeamento de rotas para títulos (usado no header)
export const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/Home": "Dashboard",
  "/Clientes": "Clientes",
  "/Representantes": "Representantes",
  "/Produtos": "Produtos",
  "/Orcamentos": "Orçamentos",
  "/Orcamentos/Adicionar": "Novo Orçamento",
  "/Configuracoes": "Configurações",
  "/Ajuda": "Ajuda",
};

// Função para obter breadcrumbs baseado na rota
export const getBreadcrumbs = (
  pathname: string
): { label: string; path: string }[] => {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; path: string }[] = [];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const title = routeTitles[currentPath] || segment;
    breadcrumbs.push({ label: title, path: currentPath });
  }

  return breadcrumbs;
};
