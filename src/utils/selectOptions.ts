// Política de opções dos Autocompletes de Cliente/Representante/Produto:
// truncar a lista sem busca, mas nunca esconder o item já selecionado.

/** Limite de itens exibidos por padrão (sem busca). */
export const INITIAL_SELECT_OPTIONS_LIMIT = 25;

/**
 * Garante que a entidade selecionada esteja presente nas `options`.
 *
 * Truncar em `INITIAL_SELECT_OPTIONS_LIMIT` faz o item selecionado desaparecer
 * das opções quando ele está fora dessa janela — e o MUI então trata o `value`
 * como inválido ("None of the options match"), deixando o dropdown sem nada
 * marcado ao abrir. Editar um orçamento cujo representante é o 30º do cache é
 * exatamente esse caso.
 */
export const withSelected = <T extends { id: string }>(
  options: T[],
  selected?: T | null
): T[] =>
  selected?.id && !options.some((option) => option.id === selected.id)
    ? [selected, ...options]
    : options;
