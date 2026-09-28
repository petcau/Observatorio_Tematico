// `periodoFiltro` é o período escolhido no filtro geral (igual ao resumo abaixo do título).
function SecaoVisaoGeral({ producoes, aoAbrirComFiltro, periodoFiltro }) {
  const verPesquisadores = (campo) => (valor) => aoAbrirComFiltro('pesquisadores', campo, valor);
  const verProducoes = (campo) => (valor) => aoAbrirComFiltro('producoes', campo, valor);

  // Qualis e JCR só existem em artigos, então a lista de destino mostra só artigos.
  function verArtigosPorQualis(estrato) {
    const semQualis = estrato === Obs.contagens.NAO_INFORMADO;
    aoAbrirComFiltro('producoes', 'qualis', semQualis ? 'N/I' : estrato, (p) =>
      p.tipo === 'Artigos' && (semQualis ? !p.qualis : p.qualis === estrato),
    );
  }

  function verArtigosPorJcr(faixa) {
    aoAbrirComFiltro('producoes', 'jcr', faixa.rotulo, (p) =>
      p.tipo === 'Artigos' && p.jcr !== undefined && p.jcr >= faixa.min && p.jcr < faixa.max,
    );
  }
  const { useMemo } = React;
  const F = Obs.formato;

  const indicadores = useMemo(() => {
    return [
      { rotulo: 'Produções', valor: F.numero(producoes.length) },
      {
        rotulo: 'Pesquisadores',
        valor: F.numero(new Set(producoes.map((p) => p.idPesquisador || p.pesquisador).filter(Boolean)).size),
      },
      {
        rotulo: 'Instituições',
        valor: F.numero(new Set(producoes.map((p) => p.instituicao).filter(Boolean)).size),
      },
      { rotulo: 'Período', valor: periodoFiltro },
    ];
  }, [producoes, periodoFiltro]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {indicadores.map((i) => (
          <div key={i.rotulo} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{i.rotulo}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{i.valor}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-3 border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">Pesquisadores</h3>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
          <CartaoPesquisadoresPorInstituicao
            producoes={producoes}
            aoClicarInstituicao={verPesquisadores('instituicao')}
          />
          <CartaoPesquisadoresPorBolsa producoes={producoes} aoClicarModalidade={verPesquisadores('modalidade')} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">Produções</h3>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
          <div className="space-y-6">
            <CartaoProducoesPorAno producoes={producoes} altura={50} aoClicarAno={verProducoes('ano')} />
            <CartaoProducoesPorTipo producoes={producoes} aoClicarTipo={verProducoes('tipo')} />
          </div>
          <CartaoRankingInstituicoes producoes={producoes} aoClicarInstituicao={verProducoes('instituicao')} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 border-b border-slate-200 pb-2 text-base font-semibold text-slate-900">Qualidade e Impacto dos Artigos</h3>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
          <CartaoDistribuicaoQualis producoes={producoes} aoClicarQualis={verArtigosPorQualis} />
          <CartaoDistribuicaoJcr producoes={producoes} aoClicarFaixa={verArtigosPorJcr} />
        </div>
      </div>
    </div>
  );
}
