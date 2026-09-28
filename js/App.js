const SECOES = [
  { chave: 'geral', numero: '1', rotulo: 'Visão geral', componente: SecaoVisaoGeral },
  { chave: 'institucional', numero: '2', rotulo: 'Instituições', componente: SecaoInstitucional },
  { chave: 'pesquisadores', numero: '3', rotulo: 'Pesquisadores', componente: SecaoPesquisadores },
  { chave: 'producoes', numero: '4', rotulo: 'Produções', componente: SecaoProducoes },
  // Só aparece no menu depois que um pesquisador é escolhido; não usa os filtros gerais.
  {
    chave: 'pesquisador',
    numero: '5',
    rotulo: 'Dados Pesquisador',
    componente: SecaoDadosPesquisador,
    precisaPesquisador: true,
  },
];

function secaoDoHash() {
  const chave = window.location.hash.replace('#', '');
  return SECOES.some((s) => s.chave === chave) ? chave : SECOES[0].chave;
}

function App() {
  const { useState, useEffect, useMemo, useRef } = React;
  const refPainel = useRef(null);
  const [rolarParaPainel, setRolarParaPainel] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [taxo, setTaxo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [secaoAtiva, setSecaoAtiva] = useState(secaoDoHash);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  // Clique num gráfico da Visão geral: { secao, campo, valor, teste? }. Filtra só o painel de
  // destino (não mexe nos filtros gerais) e some ao sair dele.
  const [filtroPainel, setFiltroPainel] = useState(null);
  const [pesquisadorSelecionado, setPesquisadorSelecionado] = useState(null);

  const producoesFiltradas = useMemo(
    () => (resultado ? aplicarFiltros(resultado.producoes, filtros) : []),
    [resultado, filtros],
  );

  const todosAnos = useMemo(
    () => (resultado ? [...new Set(resultado.producoes.map((p) => p.ano).filter(Boolean))] : []),
    [resultado],
  );

  // Período escolhido no filtro geral (não depende de quais anos têm produções).
  const periodoFiltro =
    filtros.anos === null
      ? Obs.formato.periodo(todosAnos)
      : filtros.anos.length
        ? Obs.formato.periodo(filtros.anos)
        : 'Nenhum';

  // Mesmos filtros, exceto tema/subtema — para gráficos que precisam mostrar todos os temas.
  const producoesTodosTemas = useMemo(
    () => (resultado ? aplicarFiltros(resultado.producoes, { ...filtros, temas: [], subtemas: [] }) : []),
    [resultado, filtros],
  );

  // Mesmos filtros, exceto subtema — para gráficos que mostram todos os subtemas do tema.
  const producoesTodosSubtemas = useMemo(
    () => (resultado ? aplicarFiltros(resultado.producoes, { ...filtros, subtemas: [] }) : []),
    [resultado, filtros],
  );

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

  useEffect(() => {
    const aoMudarHash = () => setSecaoAtiva(secaoDoHash());
    window.addEventListener('hashchange', aoMudarHash);
    return () => window.removeEventListener('hashchange', aoMudarHash);
  }, []);

  function selecionarSecao(chave) {
    window.location.hash = chave;
    setSecaoAtiva(chave);
  }

  function abrirPesquisador(id) {
    setPesquisadorSelecionado(id);
    selecionarSecao('pesquisador');
    setRolarParaPainel(true);
  }

  function abrirComFiltro(secao, campo, valor, teste, extras = {}) {
    setFiltroPainel({ secao, campo, valor, teste, ...extras });
    selecionarSecao(secao);
    setRolarParaPainel(true);
  }

  // Depois que o painel novo renderiza, leva a tela até o título dele.
  useEffect(() => {
    if (!rolarParaPainel || !refPainel.current) return;
    refPainel.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setRolarParaPainel(false);
  }, [rolarParaPainel, secaoAtiva]);

  useEffect(() => {
    if (filtroPainel && secaoAtiva !== filtroPainel.secao) setFiltroPainel(null);
  }, [secaoAtiva, filtroPainel]);

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

  const secoesNoMenu = SECOES.filter((s) => !s.precisaPesquisador || pesquisadorSelecionado);
  const secao = secoesNoMenu.find((s) => s.chave === secaoAtiva) || SECOES[0];
  const Componente = secao.componente;
  const filtroDaSecao = filtroPainel && filtroPainel.secao === secao.chave ? filtroPainel : null;
  // O clique num gráfico diz de qual base a lista parte, para os números baterem com o gráfico:
  // 'filtradas' (todos os filtros), 'todosTemas' (sem tema/subtema), 'todosSubtemas' (sem subtema)
  // ou 'todas' (nenhum filtro geral).
  const BASES = {
    filtradas: producoesFiltradas,
    todosTemas: producoesTodosTemas,
    todosSubtemas: producoesTodosSubtemas,
    todas: resultado.producoes,
  };
  const base = (filtroDaSecao && filtroDaSecao.base) || 'filtradas';
  const usaFiltros = !secao.precisaPesquisador && base === 'filtradas';
  const producoesDoPainel = BASES[base];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <FiltroGlobal
          taxo={taxo}
          producoes={resultado.producoes}
          filtros={filtros}
          aoMudar={setFiltros}
          totalFiltrado={producoesFiltradas.length}
        />

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <aside className="lg:w-56 lg:shrink-0">
            <div className="lg:sticky lg:top-6">
              <MenuLateral
                secoes={secoesNoMenu}
                ativa={secao.chave}
                aoSelecionar={(chave) => {
                  setFiltroPainel(null);
                  selecionarSecao(chave);
                }}
              />
            </div>
          </aside>

          <main ref={refPainel} className="min-h-screen min-w-0 flex-1 scroll-mt-4">
            <h2 className={`text-lg font-semibold text-slate-900 ${usaFiltros ? '' : 'mb-4'}`}>{secao.rotulo}</h2>
            {usaFiltros && (
            <dl className="mb-4 mt-1 space-y-0.5 text-sm">
              <div className="flex flex-wrap gap-x-1.5">
                <dt className="text-slate-500">Tema(s):</dt>
                <dd className="text-slate-800">
                  {filtros.temas.length ? filtros.temas.join('; ') : 'Todos'}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-1.5">
                <dt className="text-slate-500">Subtema(s):</dt>
                <dd className="text-slate-800">
                  {filtros.subtemas.length
                    ? filtros.subtemas.map((chave) => chave.split('::')[1]).join('; ')
                    : 'Todos'}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-1.5">
                <dt className="text-slate-500">Período:</dt>
                <dd className="text-slate-800">{periodoFiltro}</dd>
              </div>
              <div className="flex flex-wrap gap-x-1.5">
                <dt className="text-slate-500">Instituição(ões):</dt>
                <dd className="text-slate-800">
                  {filtros.instituicoes === null
                    ? 'Todas'
                    : filtros.instituicoes.length
                      ? filtros.instituicoes.join('; ')
                      : 'Nenhuma'}
                </dd>
              </div>
            </dl>
            )}
            {usaFiltros && producoesFiltradas.length === 0 ? (
              <EstadoVazio
                titulo="Nenhuma produção corresponde aos filtros"
                descricao="Remova algum tema, subtema, ano ou instituição no painel de filtros acima."
              />
            ) : (
              <Componente
                key={secao.chave}
                producoes={producoesDoPainel}
                producoesTodosTemas={producoesTodosTemas}
                producoesTodosSubtemas={producoesTodosSubtemas}
                temasFiltro={filtros.temas}
                subtemasFiltro={filtros.subtemas}
                aoAbrirComFiltro={abrirComFiltro}
                periodoFiltro={periodoFiltro}
                filtroPainel={filtroDaSecao}
                aoLimparFiltroPainel={() => setFiltroPainel(null)}
                todasProducoes={resultado.producoes}
                pesquisadorSelecionado={pesquisadorSelecionado}
                aoAbrirPesquisador={abrirPesquisador}
                aoVoltar={() => selecionarSecao('pesquisadores')}
                taxo={taxo}
              />
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

const raizDom = ReactDOM.createRoot(document.getElementById('root'));
raizDom.render(<App />);
