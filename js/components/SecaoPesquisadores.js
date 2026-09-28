// Lista completa de pesquisadores, do que tem mais produções ao que tem menos.
// `filtroPainel` ({ campo, valor }) restringe só esta lista — vem do clique num
// gráfico de pesquisadores da Visão geral.
function SecaoPesquisadores({ producoes, filtroPainel, aoLimparFiltroPainel, aoAbrirPesquisador }) {
  const { useMemo } = React;
  const F = Obs.formato;
  const filtro = filtroPainel;

  const ranking = useMemo(
    () =>
      Obs.contagens
        .pesquisadores(aplicarFiltroPainel(producoes, filtro))
        .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'))
        .map((r, i) => ({ ...r, posicao: i + 1 })),
    [producoes, filtro],
  );

  const etiqueta = filtro && <EtiquetaFiltro filtro={filtro} aoRemover={aoLimparFiltroPainel} />;

  if (ranking.length === 0) {
    return (
      <Cartao titulo="Pesquisadores por quantidade de produções" acoes={etiqueta}>
        <EstadoVazio
          titulo="Sem dados de pesquisador"
          descricao="Nenhuma produção dos filtros escolhidos tem pesquisador informado."
        />
      </Cartao>
    );
  }

  const maximo = ranking[0].total;

  return (
    <Cartao
      titulo="Pesquisadores por quantidade de produções"
      descricao={`${F.numero(ranking.length)} pesquisadores${
        filtro ? ` (${textoFiltroPainel(filtro)})` : ''
      }, do que tem mais produções ao que tem menos. Clique no nome para ver os dados do pesquisador.`}
      acoes={etiqueta}
    >
        <div className="-mx-4 max-h-[70vh] overflow-auto sm:mx-0">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-slate-200 text-slate-500">
                <th scope="col" className="w-14 px-3 py-2 text-right font-medium">#</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Pesquisador</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Instituição</th>
                <th scope="col" className="w-56 px-3 py-2 text-right font-medium">Produções</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-1.5 text-right tabular-nums text-slate-400">{r.posicao}</td>
                  <td className="px-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => aoAbrirPesquisador(r.id)}
                      title="Ver os dados deste pesquisador"
                      className="text-left text-blue-700 hover:underline"
                    >
                      {r.nome}
                    </button>
                  </td>
                  <td className="px-3 py-1.5 text-slate-600">{r.instituicao || '—'}</td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center justify-end gap-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${(r.total / maximo) * 100}%`, backgroundColor: Obs.cores.COR_PRIMARIA }}
                        />
                      </div>
                      <span className="w-8 text-right font-semibold tabular-nums text-slate-900">
                        {F.numero(r.total)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </Cartao>
  );
}
