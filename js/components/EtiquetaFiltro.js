// Filtro local de um painel, vindo do clique num gráfico:
// { campo, valor, teste?, texto?, base?, nota? }. Sem `teste`, compara p[campo] === valor;
// `texto` substitui o rótulo padrão "Campo: valor"; `base` escolhe de quais produções a
// lista parte (ver App.js) e `nota` explica isso na descrição da lista.
const ROTULOS_FILTRO_PAINEL = {
  instituicao: 'Instituição',
  modalidade: 'Bolsa',
  ano: 'Ano',
  tipo: 'Tipo',
  qualis: 'Qualis',
  jcr: 'JCR',
  tema: 'Tema',
  subtema: 'Subtema',
};

function aplicarFiltroPainel(producoes, filtro) {
  if (!filtro) return producoes;
  const teste = filtro.teste || ((p) => p[filtro.campo] === filtro.valor);
  return producoes.filter(teste);
}

function textoFiltroPainel(filtro) {
  return filtro.texto || `${ROTULOS_FILTRO_PAINEL[filtro.campo] || filtro.campo}: ${filtro.valor}`;
}

function EtiquetaFiltro({ filtro, aoRemover }) {
  if (!filtro) return null;
  return (
    <span className="flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-sm text-slate-700">
      <span className="truncate">{textoFiltroPainel(filtro)}</span>
      <button
        type="button"
        onClick={aoRemover}
        aria-label="Remover filtro"
        title="Remover este filtro"
        className="shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
      >
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M6.3 5.3a1 1 0 0 0-1.4 1.4L8.6 10l-3.7 3.3a1 1 0 1 0 1.4 1.4L10 11.4l3.3 3.3a1 1 0 0 0 1.4-1.4L11.4 10l3.3-3.3a1 1 0 0 0-1.4-1.4L10 8.6z" />
        </svg>
      </button>
    </span>
  );
}
