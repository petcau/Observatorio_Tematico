function App() {
  const { useState, useEffect, useMemo, useRef } = React;

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [taxo, setTaxo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [temasSelecionados, setTemasSelecionados] = useState([]);
  const selecaoInicializada = useRef(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const taxonomia = await Obs.taxonomia.carregar(OBS_CONFIG.arquivoTaxonomia);
        const dados = await Obs.producoes.carregarTudo(OBS_CONFIG.arquivosProducoes, taxonomia);
        if (cancelado) return;
        setTaxo(taxonomia);
        setResultado(dados);
      } catch (e) {
        if (!cancelado) setErro(e && e.message ? e.message : String(e));
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const producoes = resultado ? resultado.producoes : [];

  const contagemPorTema = useMemo(
    () => (taxo ? Obs.contagens.contarPorTema(producoes, taxo.nomesTemas) : []),
    [taxo, producoes],
  );

  useEffect(() => {
    if (selecaoInicializada.current || contagemPorTema.length === 0) return;
    selecaoInicializada.current = true;
    const primeiroTema = [...contagemPorTema].sort((a, b) => b.total - a.total)[0].tema;
    setTemasSelecionados([primeiroTema]);
  }, [contagemPorTema]);

  function alternarTema(tema) {
    setTemasSelecionados((atual) =>
      atual.includes(tema) ? atual.filter((t) => t !== tema) : [...atual, tema],
    );
  }

  const contagemSubtemas = useMemo(() => {
    if (!taxo || temasSelecionados.length === 0) return [];
    return temasSelecionados.flatMap((tema) => {
      const doTema = producoes.filter((p) => p.tema === tema);
      return Obs.contagens
        .contarSubtemas(doTema, taxo.subtemasDoTema(tema))
        .map((c) => ({ ...c, tema }));
    });
  }, [taxo, producoes, temasSelecionados]);

  const contagemPorTipo = useMemo(
    () => Obs.contagens.contarPorTipo(producoes, Obs.tipos.categorias),
    [producoes],
  );

  if (erro) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-medium text-red-700">Não foi possível carregar os dados.</p>
        <p className="mt-1 text-sm text-slate-500">{erro}</p>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Carregando dados do eixo Energia…</p>
      </div>
    );
  }

  const camposDisponiveis = resultado.camposDisponiveis;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="mb-1 text-base font-semibold text-slate-800">Produções por tema</h2>
            <p className="mb-4 text-sm text-slate-500">
              Marque um ou mais temas para ver seus subtemas.
            </p>
            {producoes.length === 0 ? (
              <EstadoVazio
                titulo="Nenhuma produção carregada ainda"
                descricao="Os 5 temas do eixo Energia estão prontos; assim que um CSV de produções for adicionado em /dados (e listado em js/config.js), as contagens aparecem aqui automaticamente."
              />
            ) : (
              <GraficoTemas
                contagens={contagemPorTema}
                temasSelecionados={temasSelecionados}
                aoAlternarTema={alternarTema}
              />
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            {temasSelecionados.length > 0 ? (
              <>
                <h2 className="mb-1 text-base font-semibold text-slate-800">
                  Subtemas de{' '}
                  {temasSelecionados.map((tema, i) => (
                    <React.Fragment key={tema}>
                      {i > 0 && (i === temasSelecionados.length - 1 ? ' e ' : ', ')}
                      <span style={{ color: Obs.cores.corDoTema(tema) }}>{tema}</span>
                    </React.Fragment>
                  ))}
                </h2>
                <GraficoSubtemas contagens={contagemSubtemas} />
              </>
            ) : (
              <EstadoVazio
                titulo="Selecione um tema no gráfico ao lado"
                descricao="O detalhamento por subtema aparece aqui."
              />
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Indicadores por tipo de produção</h2>
          {camposDisponiveis.tipo ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {contagemPorTipo.map((cat) => (
                <div key={cat.categoria}>
                  <h3
                    className="mb-3 text-sm font-semibold"
                    style={{ color: Obs.cores.corDaCategoriaTipo(cat.categoria) }}
                  >
                    {cat.categoria}
                  </h3>
                  <BarraLista
                    itens={cat.tipos.map((t) => ({
                      chave: t.tipo,
                      rotulo: t.tipo,
                      valor: t.total,
                      cor: Obs.cores.corDaCategoriaTipo(cat.categoria),
                    }))}
                    formatarTitulo={(item) =>
                      `${item.valor} ${item.valor === 1 ? 'produção' : 'produções'}`
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <EstadoVazio
              titulo="Tipo de produção indisponível nos dados atuais"
              descricao="Assim que uma coluna de tipo (ex.: artigo, livro, patente) for adicionada ao CSV, esta contagem aparece aqui automaticamente."
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

const raizDom = ReactDOM.createRoot(document.getElementById('root'));
raizDom.render(<App />);
