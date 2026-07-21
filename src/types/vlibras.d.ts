// Tipagem mínima do plugin oficial VLibras (vlibras.gov.br), carregado sob
// demanda pelo VLibrasWidget quando a preferência de Libras está ativa.
interface VLibrasWidgetConstructor {
  new (url: string): unknown;
}

interface VLibrasNamespace {
  Widget: VLibrasWidgetConstructor;
}

interface Window {
  VLibras?: VLibrasNamespace;
}
