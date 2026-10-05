// Perfil de um pesquisador (aberto pelo clique no nome, no painel Pesquisadores).
// Usa TODAS as produções dele na base, sem os filtros gerais, para o perfil ficar completo.

function chaveDaProducao(p) {
  return p.doi ? `doi:${p.doi.toLowerCase()}` : `titulo:${Obs.csv.normalizar(p.titulo)}`;
}

function iniciais(nome) {
  const partes = nome.split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (partes[0][0] + ultima).toUpperCase();
}

function FotoPesquisador({ nome, caminho }) {
  const { useState } = React;
  const [falhou, setFalhou] = useState(false);
  const base = (OBS_CONFIG.urlBaseImagensPesquisadores || '').replace(/\/$/, '');
  const url = base && caminho && !falhou ? `${base}${caminho.startsWith('/') ? '' : '/'}${caminho}` : null;

  if (url) {
    return (
      <img
        src={url}
        alt={`Foto de ${nome}`}
        onError={() => setFalhou(true)}
        className="h-28 w-28 shrink-0 rounded-full border border-slate-200 object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-slate-200 text-3xl font-semibold text-slate-600"
      role="img"
      aria-label={`Sem foto: ${nome}`}
      title="Foto indisponível"
    >
      {iniciais(nome)}
    </div>
  );
}

function SecaoDadosPesquisador({
  todasProducoes,
  pesquisadorSelecionado,
  aoAbrirPesquisador,
  aoAbrirComFiltro,
  aoVoltar,
}) {
  const { useMemo } = React;
  const F = Obs.formato;
  const idDe = (p) => p.idPesquisador || p.pesquisador;

  const dados = useMemo(() => {
    const minhas = todasProducoes.filter((p) => idDe(p) === pesquisadorSelecionado);
    if (minhas.length === 0) return null;
    const ref = minhas[0];
    const artigos = minhas.filter((p) => p.tipo === 'Artigos');
    const comQualis = artigos.filter((p) => p.qualis);
    const comJcr = artigos.filter((p) => p.jcr !== undefined);
    const anos = [...new Set(minhas.map((p) => p.ano).filter(Boolean))].sort(F.compararAnos);

    // Colaboradores na base: outros pesquisadores com a mesma produção (mesmo DOI ou título).
    const minhasChaves = new Set(minhas.map(chaveDaProducao));
    const colaboradores = new Map();
    for (const p of todasProducoes) {
      const id = idDe(p);
      if (!id || id === pesquisadorSelecionado || !minhasChaves.has(chaveDaProducao(p))) continue;
      if (!colaboradores.has(id)) {
        colaboradores.set(id, { id, nome: p.pesquisador, instituicao: p.instituicao, chaves: new Set() });
      }
      colaboradores.get(id).chaves.add(chaveDaProducao(p));
    }

    return {
      nome: ref.pesquisador,
      instituicao: ref.instituicao,
      cidade: ref.cidadePesquisador,
      classificacao: ref.classificacaoPesquisador,
      modalidade: ref.modalidade,
      hIndex: ref.hIndex,
      i10Index: ref.i10Index,
      imagem: ref.imagemPesquisador,
      minhas,
      artigos,
      comQualis,
      comJcr,
      anos,
      colaboradores: [...colaboradores.values()]
        .map((c) => ({ ...c, emComum: c.chaves.size }))
        .sort((a, b) => b.emComum - a.emComum || a.nome.localeCompare(b.nome, 'pt-BR')),
    };
  }, [todasProducoes, pesquisadorSelecionado]);

  if (!dados) {
    return (
      <EstadoVazio
        titulo="Nenhum pesquisador selecionado"
        descricao="Abra o painel Pesquisadores e clique no nome de um pesquisador."
      />
    );
  }

  const qualisAlto = dados.comQualis.filter((p) => p.qualis === 'A1' || p.qualis === 'A2').length;
  const jcrMedio = dados.comJcr.length
    ? dados.comJcr.reduce((s, p) => s + p.jcr, 0) / dados.comJcr.length
    : null;
  const decimal = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // Clique num gráfico: abre o painel Produções com as produções deste pesquisador
  // que atendem ao item clicado (sem os filtros gerais, como o próprio perfil).
  const dele = (p) => idDe(p) === pesquisadorSelecionado;
  function verProducoes(campo, valor, condicao, rotuloValor = valor) {
    const rotulo = ROTULOS_FILTRO_PAINEL[campo] || campo;
    aoAbrirComFiltro('producoes', campo, valor, (p) => dele(p) && condicao(p), {
      texto: `${dados.nome} · ${rotulo}: ${rotuloValor}`,
      base: 'todas',
      nota: 'sem os filtros do topo da página',
    });
  }
  const aoClicarAno = (ano) => verProducoes('ano', ano, (p) => p.ano === ano);
  const aoClicarTipo = (tipo) => verProducoes('tipo', tipo, (p) => p.tipo === tipo);
  const aoClicarTema = (tema) => verProducoes('tema', tema, (p) => p.tema === tema);
  const aoClicarSubtema = (chave) => {
    const [tema, subtema] = chave.split('::');
    verProducoes('subtema', chave, (p) => p.tema === tema && p.subtemas.includes(subtema), subtema);
  };
  const aoClicarQualis = (qualis) =>
    verProducoes('qualis', qualis, (p) => p.tipo === 'Artigos' && p.qualis === qualis);

  const ficha = [
    { rotulo: 'Instituição', valor: dados.instituicao },
    { rotulo: 'Município', valor: dados.cidade },
    { rotulo: 'Bolsa de produtividade', valor: dados.modalidade },
    { rotulo: 'Classificação', valor: dados.classificacao },
    { rotulo: 'h-index', valor: dados.hIndex !== undefined ? F.numero(dados.hIndex) : undefined },
    { rotulo: 'i10-index', valor: dados.i10Index !== undefined ? F.numero(dados.i10Index) : undefined },
  ];

  const indicadores = [
    { rotulo: 'Produções', valor: F.numero(dados.minhas.length) },
    { rotulo: 'Artigos', valor: F.numero(dados.artigos.length) },
    { rotulo: 'Período', valor: F.periodo(dados.anos) },
    {
      rotulo: 'Artigos Qualis A1–A2',
      valor: dados.comQualis.length ? F.pct(qualisAlto, dados.comQualis.length) : '—',
      detalhe: dados.comQualis.length ? `${qualisAlto} de ${dados.comQualis.length} com Qualis` : 'sem Qualis informado',
    },
    {
      rotulo: 'JCR médio',
      valor: jcrMedio !== null ? decimal(jcrMedio) : '—',
      detalhe: dados.comJcr.length ? `${dados.comJcr.length} artigos com JCR` : 'sem JCR informado',
    },
  ];

  const porAno = new Map(Obs.contagens.agrupar(dados.minhas, (p) => p.ano).map((c) => [c.chave, c.total]));
  const colunasAno = dados.anos.map((ano) => ({
    chave: ano,
    rotulo: ano,
    valor: porAno.get(ano) || 0,
    cor: Obs.cores.COR_PRIMARIA,
  }));
  const porTipo = Obs.contagens
    .agrupar(dados.minhas, (p) => p.tipo)
    .map((c) => ({ chave: c.chave, rotulo: c.chave, valor: c.total, cor: Obs.cores.corDoTipo(c.chave) }));
  const porTema = Obs.contagens
    .agrupar(dados.minhas, (p) => p.tema)
    .map((c) => ({ chave: c.chave, rotulo: c.chave, valor: c.total, cor: Obs.cores.corDoTema(c.chave) }));
  const mencoes = new Map();
  for (const p of dados.minhas) {
    for (const s of p.subtemas) {
      const chave = chaveSubtema(p.tema, s);
      if (!mencoes.has(chave)) mencoes.set(chave, { chave, rotulo: s, valor: 0, cor: Obs.cores.corDoTema(p.tema) });
      mencoes.get(chave).valor += 1;
    }
  }
  const porSubtema = [...mencoes.values()].sort((a, b) => b.valor - a.valor);
  const qualisPorEstrato = new Map(Obs.contagens.agrupar(dados.comQualis, (p) => p.qualis).map((c) => [c.chave, c.total]));
  const colunasQualis = Obs.cores.ORDEM_QUALIS.filter((q) => qualisPorEstrato.has(q)).map((q) => ({
    chave: q,
    rotulo: q,
    valor: qualisPorEstrato.get(q),
    cor: Obs.cores.corDoQualis(q),
  }));
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={aoVoltar}
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Voltar para Pesquisadores
      </button>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <FotoPesquisador key={pesquisadorSelecionado} nome={dados.nome} caminho={dados.imagem} />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-slate-900">{dados.nome}</h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
              {ficha.map((f) => (
                <div key={f.rotulo}>
                  <dt className="text-slate-500">{f.rotulo}</dt>
                  <dd className="font-medium text-slate-800">{f.valor || 'Não informado'}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Este perfil considera todas as produções do pesquisador na base, sem aplicar os filtros do topo da página.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {indicadores.map((i) => (
          <div key={i.rotulo} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{i.rotulo}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{i.valor}</p>
            {i.detalhe && <p className="mt-0.5 text-xs text-slate-500">{i.detalhe}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
        <Cartao titulo="Produções por ano" descricao="Clique num ano para ver as produções.">
          <GraficoColunas
            itens={colunasAno}
            altura={100}
            aoClicar={aoClicarAno}
            formatarTitulo={(item) => `${item.rotulo}: ${F.producoes(item.valor)}`}
          />
        </Cartao>
        <Cartao titulo="Produções por tipo" descricao="Clique num tipo para ver as produções.">
          <BarraLista itens={porTipo} aoClicar={aoClicarTipo} formatarTitulo={(item) => F.producoes(item.valor)} />
        </Cartao>
        <Cartao titulo="Produções por tema" descricao="Clique num tema para ver as produções.">
          <BarraLista itens={porTema} aoClicar={aoClicarTema} formatarTitulo={(item) => F.producoes(item.valor)} />
        </Cartao>
        <Cartao
          titulo="Subtemas"
          descricao="Contagem por menção — uma produção pode ter vários subtemas. Clique num subtema para ver as produções."
        >
          {porSubtema.length > 0 ? (
            <BarraLista
              itens={porSubtema}
              aoClicar={aoClicarSubtema}
              formatarTitulo={(item) => `${F.numero(item.valor)} menções`}
            />
          ) : (
            <EstadoVazio titulo="Sem subtemas" />
          )}
        </Cartao>
        <Cartao
          titulo="Artigos por Qualis"
          descricao={`${F.numero(dados.comQualis.length)} de ${F.numero(dados.artigos.length)} artigos têm Qualis informado. Clique num estrato para ver os artigos.`}
        >
          {colunasQualis.length > 0 ? (
            <GraficoColunas
              itens={colunasQualis}
              altura={100}
              aoClicar={aoClicarQualis}
              formatarTitulo={(item) => `${item.rotulo}: ${F.numero(item.valor)} artigos`}
            />
          ) : (
            <EstadoVazio titulo="Nenhum artigo com Qualis informado" />
          )}
        </Cartao>
        <Cartao
          titulo="Colaboradores na base"
          descricao="Outros pesquisadores da base que aparecem nas mesmas produções (mesmo DOI ou título). Clique para abrir o perfil."
        >
          {dados.colaboradores.length > 0 ? (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {dados.colaboradores.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => aoAbrirPesquisador(c.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-slate-800">{c.nome}</span>
                      <span className="block truncate text-xs text-slate-500">{c.instituicao || '—'}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {c.emComum} {c.emComum === 1 ? 'produção' : 'produções'} em comum
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EstadoVazio titulo="Nenhum colaborador identificado na base" />
          )}
        </Cartao>
      </div>
    </div>
  );
}
