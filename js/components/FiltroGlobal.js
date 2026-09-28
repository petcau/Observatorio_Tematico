// Filtro aplicado a todos os painéis. Subtemas são guardados como "tema::subtema"
// (o mesmo nome de subtema poderia existir em dois temas). Regra: tema E
// (qualquer subtema marcado) E (qualquer ano marcado) E (qualquer instituição marcada).
// Temas/subtemas: lista vazia = sem restrição. Anos/instituições: null = todos
// marcados (sem restrição); lista = só os marcados (pode ficar vazia).
const FILTROS_VAZIOS = { temas: [], subtemas: [], anos: null, instituicoes: null };

function chaveSubtema(tema, subtema) {
  return `${tema}::${subtema}`;
}

function temFiltroAtivo(filtros) {
  return (
    filtros.temas.length > 0 ||
    filtros.subtemas.length > 0 ||
    filtros.anos !== null ||
    filtros.instituicoes !== null
  );
}

function aplicarFiltros(producoes, filtros) {
  if (!temFiltroAtivo(filtros)) return producoes;
  return producoes.filter(
    (p) =>
      (filtros.temas.length === 0 || filtros.temas.includes(p.tema)) &&
      (filtros.subtemas.length === 0 ||
        p.subtemas.some((s) => filtros.subtemas.includes(chaveSubtema(p.tema, s)))) &&
      (filtros.anos === null || filtros.anos.includes(p.ano)) &&
      (filtros.instituicoes === null || filtros.instituicoes.includes(p.instituicao)),
  );
}

// Quadro que abre uma lista de caixas de marcar, com "Todos/Todas" no topo.
// `selecionados` null = todas as opções marcadas (estado inicial).
function FiltroLista({ titulo, rotuloTodos, opcoes, contagens, selecionados, aoMudar, formatarValor, largura, larguraLista }) {
  const { useState, useRef, useEffect } = React;
  const F = Obs.formato;
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  const refTodos = useRef(null);
  const todas = selecionados === null;
  const marcados = todas ? opcoes : selecionados;

  useEffect(() => {
    if (refTodos.current) refTodos.current.indeterminate = !todas && marcados.length > 0;
  });

  useEffect(() => {
    if (!aberto) return;
    const aoClicarFora = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    };
    const aoTeclar = (e) => {
      if (e.key === 'Escape') setAberto(false);
    };
    document.addEventListener('mousedown', aoClicarFora);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicarFora);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  function alternar(opcao) {
    const proximos = opcoes.filter((o) => (o === opcao ? !marcados.includes(o) : marcados.includes(o)));
    aoMudar(proximos.length === opcoes.length ? null : proximos);
  }

  return (
    <div className="relative lg:shrink-0" ref={ref}>
      <button
        type="button"
        aria-expanded={aberto}
        aria-haspopup="true"
        onClick={() => setAberto((a) => !a)}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-left hover:border-slate-300 ${largura}`}
      >
        <span className="min-w-0">
          <span className="block text-xs text-slate-500">{titulo}</span>
          <span className="block truncate text-sm font-semibold text-slate-900">
            {formatarValor(marcados, todas)}
          </span>
        </span>
        <svg
          viewBox="0 0 20 20"
          className={`h-5 w-5 shrink-0 fill-slate-400 transition-transform ${aberto ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
        </svg>
      </button>

      {aberto && (
        <div className={`absolute right-0 z-20 mt-2 max-h-[26rem] min-w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg ${larguraLista}`}>
          <p className="px-2 py-1 text-xs font-semibold text-slate-500">{titulo}</p>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-md border-b border-slate-100 px-2 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50">
            <input
              ref={refTodos}
              type="checkbox"
              checked={todas}
              onChange={() => aoMudar(todas ? [] : null)}
              className="h-4 w-4 shrink-0 rounded border-slate-300 accent-slate-800"
            />
            <span className="flex-1">{rotuloTodos}</span>
          </label>
          <ul className="mt-1">
            {opcoes.map((opcao) => {
              const marcado = marcados.includes(opcao);
              return (
                <li key={opcao}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => alternar(opcao)}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 accent-slate-800"
                    />
                    <span className="flex-1">{opcao}</span>
                    <span className="tabular-nums text-xs text-slate-400">{F.numero(contagens.get(opcao) || 0)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function FiltroGlobal({ taxo, producoes, filtros, aoMudar, totalFiltrado }) {
  const { useState, useMemo } = React;
  const F = Obs.formato;
  const [multiselecao, setMultiselecao] = useState(false);

  const contagens = useMemo(() => {
    const porTema = new Map();
    const porSubtema = new Map();
    const porAno = new Map();
    const porInstituicao = new Map();
    for (const p of producoes) {
      porTema.set(p.tema, (porTema.get(p.tema) || 0) + 1);
      if (p.ano) porAno.set(p.ano, (porAno.get(p.ano) || 0) + 1);
      if (p.instituicao) porInstituicao.set(p.instituicao, (porInstituicao.get(p.instituicao) || 0) + 1);
      for (const s of p.subtemas) {
        const chave = chaveSubtema(p.tema, s);
        porSubtema.set(chave, (porSubtema.get(chave) || 0) + 1);
      }
    }
    const anos = [...porAno.keys()].sort(F.compararAnos);
    const instituicoes = [...porInstituicao.keys()].sort(
      (a, b) => porInstituicao.get(b) - porInstituicao.get(a) || a.localeCompare(b, 'pt-BR'),
    );
    return { porTema, porSubtema, porAno, anos, porInstituicao, instituicoes };
  }, [producoes]);

  function mudarTemas(temas) {
    const subtemas = filtros.subtemas.filter((chave) => temas.includes(chave.split('::')[0]));
    aoMudar({ ...filtros, temas, subtemas });
  }

  function alternarTema(tema) {
    if (filtros.temas.includes(tema)) {
      mudarTemas(filtros.temas.filter((t) => t !== tema));
    } else {
      mudarTemas(multiselecao ? [...filtros.temas, tema] : [tema]);
    }
  }

  function alternarMultiselecao() {
    const ativar = !multiselecao;
    setMultiselecao(ativar);
    if (!ativar && filtros.temas.length > 1) mudarTemas(filtros.temas.slice(0, 1));
  }

  function alternarSubtema(chave) {
    const subtemas = filtros.subtemas.includes(chave)
      ? filtros.subtemas.filter((c) => c !== chave)
      : [...filtros.subtemas, chave];
    aoMudar({ ...filtros, subtemas });
  }

  const subtemasVisiveis = taxo.taxonomia
    .filter((t) => filtros.temas.includes(t.nome))
    .flatMap((t) =>
      t.subtemas.map((s) => {
        const chave = chaveSubtema(t.nome, s);
        return {
          chave,
          rotulo: s,
          valor: contagens.porSubtema.get(chave) || 0,
          cor: Obs.cores.corDoTema(t.nome),
          tema: t.nome,
        };
      }),
    )
    .sort((a, b) => b.valor - a.valor);
  const temFiltro = temFiltroAtivo(filtros);

  return (
    <section aria-label="Filtros" className="rounded-xl border border-blue-100 bg-[#bfdbfe] p-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">Filtros</h2>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <p className="text-sm text-slate-600">
            <span className="font-semibold tabular-nums text-slate-900">{F.numero(totalFiltrado)}</span> de{' '}
            {F.numero(producoes.length)} produções
          </p>
          {temFiltro && (
            <button
              type="button"
              onClick={() => aoMudar(FILTROS_VAZIOS)}
              className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-white/70 hover:text-slate-900"
            >
              Limpar filtros
            </button>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={multiselecao}
            onClick={alternarMultiselecao}
            title="Permite selecionar mais de um tema ao mesmo tempo"
            className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              multiselecao
                ? 'border-slate-800 bg-slate-800 text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            <span
              className={`relative h-3.5 w-6 rounded-full transition-colors ${multiselecao ? 'bg-white/30' : 'bg-slate-200'}`}
              aria-hidden="true"
            >
              <span
                className={`absolute top-0.5 h-2.5 w-2.5 rounded-full transition-all ${
                  multiselecao ? 'left-3 bg-white' : 'left-0.5 bg-slate-500'
                }`}
              />
            </span>
            Multiseleção
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {taxo.taxonomia.map((t) => {
          const marcado = filtros.temas.includes(t.nome);
          const cor = Obs.cores.corDoTema(t.nome);
          return (
            <button
              key={t.nome}
              type="button"
              aria-pressed={marcado}
              onClick={() => alternarTema(t.nome)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-left text-sm transition-colors ${
                marcado
                  ? 'border-transparent font-medium text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
              style={marcado ? { backgroundColor: cor } : undefined}
            >
              {!marcado && (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} aria-hidden="true" />
              )}
              {t.nome}
              <span className={`tabular-nums text-xs ${marcado ? 'text-white/80' : 'text-slate-400'}`}>
                {F.numero(contagens.porTema.get(t.nome) || 0)}
              </span>
            </button>
          );
        })}

      </div>
      </div>

      {contagens.anos.length > 0 && (
        <FiltroLista
          titulo="Período"
          rotuloTodos="Todos"
          opcoes={contagens.anos}
          contagens={contagens.porAno}
          selecionados={filtros.anos}
          aoMudar={(anos) => aoMudar({ ...filtros, anos })}
          formatarValor={(marcados) => (marcados.length ? F.periodo(marcados) : 'Nenhum')}
          largura="lg:w-52"
          larguraLista="w-full"
        />
      )}

      {contagens.instituicoes.length > 0 && (
        <FiltroLista
          titulo="Instituição"
          rotuloTodos="Todas"
          opcoes={contagens.instituicoes}
          contagens={contagens.porInstituicao}
          selecionados={filtros.instituicoes}
          aoMudar={(instituicoes) => aoMudar({ ...filtros, instituicoes })}
          formatarValor={(marcadas, todas) =>
            todas
              ? 'Todas'
              : marcadas.length === 0
                ? 'Nenhuma'
                : marcadas.length === 1
                  ? marcadas[0]
                  : `${marcadas.length} instituições`
          }
          largura="lg:w-64"
          larguraLista="w-[min(28rem,calc(100vw-2rem))]"
        />
      )}
      </div>

      {subtemasVisiveis.length > 0 && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-white p-4">
          <p className="mb-3 text-xs text-slate-500">
            Marque subtemas para refinar. Contagem por <strong>menção</strong> — uma produção pode
            estar em mais de um subtema.
          </p>
          <BarraLista
            colunas
            itens={subtemasVisiveis}
            selecionados={filtros.subtemas}
            aoAlternar={alternarSubtema}
            formatarTitulo={(item) =>
              `${F.numero(item.valor)} ${item.valor === 1 ? 'menção' : 'menções'} · ${item.tema}`
            }
          />
        </div>
      )}
    </section>
  );
}
