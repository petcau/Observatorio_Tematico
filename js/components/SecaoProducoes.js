// Lista das produções filtradas, com ordenação por coluna e paginação.
// `filtroPainel` ({ campo, valor }) restringe só esta lista — vem do clique num
// gráfico de produções da Visão geral.
function SecaoProducoes({ producoes: todasFiltradas, filtroPainel, aoLimparFiltroPainel }) {
  const { useState, useMemo, useEffect } = React;
  const producoes = useMemo(
    () => aplicarFiltroPainel(todasFiltradas, filtroPainel),
    [todasFiltradas, filtroPainel],
  );
  const F = Obs.formato;
  const POR_PAGINA = 50;
  const [ordem, setOrdem] = useState({ coluna: 'ano', decrescente: true });
  const [pagina, setPagina] = useState(1);

  const COLUNAS = [
    { chave: 'ano', rotulo: 'Ano', classe: 'w-16' },
    { chave: 'titulo', rotulo: 'Produção' },
    { chave: 'tipo', rotulo: 'Tipo', classe: 'w-40' },
    { chave: 'pesquisador', rotulo: 'Pesquisador', classe: 'w-48' },
    { chave: 'instituicao', rotulo: 'Instituição', classe: 'w-56' },
    { chave: 'qualis', rotulo: 'Qualis', classe: 'w-20' },
  ];

  const ordenadas = useMemo(() => {
    const { coluna, decrescente } = ordem;
    return [...producoes].sort((a, b) => {
      const va = a[coluna];
      const vb = b[coluna];
      if (!va && !vb) return 0;
      if (!va) return 1;
      if (!vb) return -1;
      const cmp = String(va).localeCompare(String(vb), 'pt-BR', { numeric: true });
      if (cmp !== 0) return decrescente ? -cmp : cmp;
      return a.titulo.localeCompare(b.titulo, 'pt-BR');
    });
  }, [producoes, ordem]);

  useEffect(() => setPagina(1), [ordem, producoes]);

  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / POR_PAGINA));
  const inicio = (pagina - 1) * POR_PAGINA;
  const visiveis = ordenadas.slice(inicio, inicio + POR_PAGINA);

  function ordenarPor(coluna) {
    setOrdem((atual) =>
      atual.coluna === coluna
        ? { coluna, decrescente: !atual.decrescente }
        : { coluna, decrescente: coluna === 'ano' },
    );
  }

  function botaoPagina(rotulo, destino, desabilitado) {
    return (
      <button
        type="button"
        disabled={desabilitado}
        onClick={() => setPagina(destino)}
        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {rotulo}
      </button>
    );
  }

  const etiqueta = filtroPainel && <EtiquetaFiltro filtro={filtroPainel} aoRemover={aoLimparFiltroPainel} />;

  if (producoes.length === 0) {
    return (
      <Cartao titulo="Lista de produções" acoes={etiqueta}>
        <EstadoVazio titulo="Nenhuma produção" descricao="Nenhuma produção atende aos filtros escolhidos." />
      </Cartao>
    );
  }

  return (
    <Cartao
      titulo="Lista de produções"
      descricao={`${F.numero(producoes.length)} produções${
        filtroPainel ? ` (${textoFiltroPainel(filtroPainel)})` : ''
      }${
        filtroPainel && filtroPainel.nota ? `, ${filtroPainel.nota}` : ''
      }. Clique no título de uma coluna para ordenar.`}
      acoes={etiqueta}
    >
      <>
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[64rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {COLUNAS.map((c) => {
                    const ativa = ordem.coluna === c.chave;
                    return (
                      <th
                        key={c.chave}
                        scope="col"
                        aria-sort={ativa ? (ordem.decrescente ? 'descending' : 'ascending') : 'none'}
                        className={`px-3 py-2 text-left font-medium text-slate-500 ${c.classe || ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => ordenarPor(c.chave)}
                          className={`inline-flex items-center gap-1 hover:text-slate-900 ${ativa ? 'text-slate-900' : ''}`}
                        >
                          {c.rotulo}
                          <span className={`text-xs ${ativa ? '' : 'invisible'}`} aria-hidden="true">
                            {ordem.decrescente ? '▼' : '▲'}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visiveis.map((p, i) => (
                  <tr key={`${p.titulo}-${p.pesquisador}-${inicio + i}`} className="border-b border-slate-100 align-top hover:bg-slate-50">
                    <td className="px-3 py-2 tabular-nums text-slate-600">{p.ano || '—'}</td>
                    <td className="px-3 py-2">
                      <p className="text-slate-800">{p.titulo}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: Obs.cores.corDoTema(p.tema) }} aria-hidden="true" />
                        <span>{p.tema}</span>
                        {p.subtemas.length > 0 && <span className="text-slate-400">· {p.subtemas.join('; ')}</span>}
                      </p>
                      {p.doi && (
                        <a
                          href={`https://doi.org/${encodeURI(p.doi)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-block text-xs text-blue-700 hover:underline"
                        >
                          DOI {p.doi}
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{p.tipo || '—'}</td>
                    <td className="px-3 py-2 text-slate-700">{p.pesquisador || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{p.instituicao || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{p.qualis || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              {F.numero(inicio + 1)}–{F.numero(inicio + visiveis.length)} de {F.numero(ordenadas.length)}
            </span>
            <div className="flex items-center gap-1.5">
              {botaoPagina('« Primeira', 1, pagina === 1)}
              {botaoPagina('‹ Anterior', pagina - 1, pagina === 1)}
              <span className="px-2 tabular-nums">
                Página {F.numero(pagina)} de {F.numero(totalPaginas)}
              </span>
              {botaoPagina('Próxima ›', pagina + 1, pagina === totalPaginas)}
              {botaoPagina('Última »', totalPaginas, pagina === totalPaginas)}
            </div>
          </div>
      </>
    </Cartao>
  );
}
