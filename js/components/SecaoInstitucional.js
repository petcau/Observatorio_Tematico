function SecaoInstitucional({
  producoes,
  producoesTodosTemas,
  producoesTodosSubtemas,
  temasFiltro,
  subtemasFiltro,
  aoAbrirComFiltro,
  taxo,
}) {
  const { useMemo } = React;

  const mapaTemas = useMemo(() => {
    const linhas = Obs.contagens
      .cruzar(producoesTodosTemas, (p) => p.instituicao, (p) => p.tema)
      .sort((a, b) => b.total - a.total)
      .map((l) => ({ chave: l.chave, rotulo: l.chave, total: l.total, valores: l.segmentos }));
    const colunas = taxo.nomesTemas.map((t) => ({ chave: t, rotulo: t, cor: Obs.cores.corDoTema(t) }));
    return { linhas, colunas };
  }, [producoesTodosTemas, taxo]);

  // Tudo em menções: total da linha = soma das menções, então a linha fecha 100%.
  const mapaSubtemas = useMemo(() => {
    if (temasFiltro.length === 0) return null;
    const porInstituicao = new Map();
    const mencoes = new Map();
    for (const p of producoesTodosSubtemas) {
      if (!p.instituicao || p.subtemas.length === 0) continue;
      if (!porInstituicao.has(p.instituicao)) {
        porInstituicao.set(p.instituicao, { chave: p.instituicao, rotulo: p.instituicao, total: 0, valores: new Map() });
      }
      const linha = porInstituicao.get(p.instituicao);
      for (const s of p.subtemas) {
        const chave = chaveSubtema(p.tema, s);
        linha.total += 1;
        linha.valores.set(chave, (linha.valores.get(chave) || 0) + 1);
        mencoes.set(chave, (mencoes.get(chave) || 0) + 1);
      }
    }
    const colunas = taxo.taxonomia
      .filter((t) => temasFiltro.includes(t.nome))
      .flatMap((t) => t.subtemas.map((s) => ({ chave: chaveSubtema(t.nome, s), rotulo: s, cor: Obs.cores.corDoTema(t.nome) })))
      .sort((a, b) => (mencoes.get(b.chave) || 0) - (mencoes.get(a.chave) || 0));
    const linhas = [...porInstituicao.values()].sort((a, b) => b.total - a.total);
    return { linhas, colunas };
  }, [producoesTodosSubtemas, temasFiltro, taxo]);

  // Produções do(s) subtema(s) escolhido(s) por tipo — cada produção tem um tipo só,
  // então a linha fecha com o total de produções.
  const mapaTipos = useMemo(() => {
    if (subtemasFiltro.length === 0) return null;
    const linhas = Obs.contagens
      .cruzar(producoes, (p) => p.instituicao, (p) => p.tipo)
      .sort((a, b) => b.total - a.total)
      .map((l) => ({ chave: l.chave, rotulo: l.chave, total: l.total, valores: l.segmentos }));
    // Uma cor só: a do tema dos subtemas escolhidos; se forem de temas diferentes, azul padrão.
    const temasDosSubtemas = [...new Set(subtemasFiltro.map((chave) => chave.split('::')[0]))];
    const corTema = temasDosSubtemas.length === 1 ? Obs.cores.corDoTema(temasDosSubtemas[0]) : null;
    const presentes = new Set(producoesTodosSubtemas.map((p) => p.tipo).filter(Boolean));
    const colunas = Obs.tipos.categorias
      .flatMap((c) => c.tipos)
      .filter((t) => presentes.has(t.nome))
      .map((t) => ({ chave: t.nome, rotulo: t.nome, cor: corTema || Obs.cores.COR_PRIMARIA }));
    return { linhas, colunas, corTema };
  }, [producoes, producoesTodosSubtemas, subtemasFiltro]);

  const nomesSubtemas = subtemasFiltro.map((chave) => chave.split('::')[1]).join('; ');

  // Clique numa célula/total: abre o painel Produções na mesma base de dados do mapa.
  function verProducoes(base, nota, texto, campo, valor, teste) {
    aoAbrirComFiltro('producoes', campo, valor, teste, { base, nota, texto });
  }
  const SEM_TEMA = 'ignorando o filtro de tema e subtema, como o mapa';
  const SEM_SUBTEMA = 'ignorando o filtro de subtema, como o mapa';

  const cliqueTema = {
    aoClicarCelula: (inst, tema) =>
      verProducoes('todosTemas', SEM_TEMA, `${inst} · Tema: ${tema}`, 'tema', tema, (p) => p.instituicao === inst && p.tema === tema),
    aoClicarTotal: (inst) =>
      verProducoes('todosTemas', SEM_TEMA, `Instituição: ${inst}`, 'instituicao', inst, (p) => p.instituicao === inst),
  };
  const cliqueSubtema = {
    aoClicarCelula: (inst, chave) => {
      const [tema, subtema] = chave.split('::');
      verProducoes('todosSubtemas', SEM_SUBTEMA, `${inst} · Subtema: ${subtema}`, 'subtema', chave, (p) =>
        p.instituicao === inst && p.tema === tema && p.subtemas.includes(subtema),
      );
    },
  };
  const cliqueTipo = {
    aoClicarCelula: (inst, tipo) =>
      verProducoes('filtradas', null, `${inst} · Tipo: ${tipo}`, 'tipo', tipo, (p) => p.instituicao === inst && p.tipo === tipo),
    aoClicarTotal: (inst) =>
      verProducoes('filtradas', null, `Instituição: ${inst}`, 'instituicao', inst, (p) => p.instituicao === inst),
  };

  return (
    <div className="space-y-6">
      <Cartao
        titulo="Instituição × tema"
        descricao="Quanto da produção de cada instituição está em cada tema. Cores mais escuras = mais produções."
        nota="Este gráfico mostra sempre todos os temas: ignora o filtro de tema e subtema, mas respeita período e instituição."
      >
        {mapaTemas.linhas.length > 0 ? (
          <MapaCalor
            linhas={mapaTemas.linhas}
            colunas={mapaTemas.colunas}
            rotuloLinhas="Instituição"
            rotuloPercentual="% da instituição"
            {...cliqueTema}
          />
        ) : (
          <EstadoVazio titulo="Sem dados de instituição" />
        )}
      </Cartao>

      <Cartao
        titulo={mapaSubtemas ? `Instituição × subtema — ${temasFiltro.join('; ')}` : 'Instituição × subtema'}
        descricao="Em quais subtemas cada instituição atua, dentro do(s) tema(s) escolhido(s). Cores mais escuras = mais menções."
        nota={
          mapaSubtemas
            ? 'Mostra todos os subtemas do(s) tema(s) escolhido(s): ignora o filtro de subtema. Contagem por menção — uma produção com vários subtemas conta uma vez em cada um. Total = soma das menções da instituição; % = participação de cada subtema nessas menções (a linha soma 100%).'
            : null
        }
      >
        {!mapaSubtemas ? (
          <EstadoVazio
            titulo="Selecione um tema para ver este gráfico"
            descricao="Escolha um tema no painel de Filtros, no topo da página, para ver a distribuição dos seus subtemas por instituição."
          />
        ) : mapaSubtemas.linhas.length > 0 ? (
            <MapaCalor
              linhas={mapaSubtemas.linhas}
              colunas={mapaSubtemas.colunas}
              rotuloLinhas="Instituição"
              rotuloPercentual="% das menções"
              rotuloTotal="Menções"
              unidade="menções"
              corPorColuna
              {...cliqueSubtema}
            />
          ) : (
            <EstadoVazio titulo="Sem produções para os filtros escolhidos" />
          )}
      </Cartao>

      <Cartao
        titulo={mapaTipos ? `Instituição × tipo de produção — ${nomesSubtemas}` : 'Instituição × tipo de produção'}
        descricao="Que tipos de produção cada instituição gera no(s) subtema(s) escolhido(s). Cores mais escuras = mais produções."
        nota={
          mapaTipos
            ? 'Considera as produções do(s) subtema(s) selecionado(s), respeitando também período e instituição. Cada produção tem um único tipo, então a linha soma 100%.'
            : null
        }
      >
        {!mapaTipos ? (
          <EstadoVazio
            titulo="Selecione um subtema para ver este gráfico"
            descricao="No painel de Filtros, escolha um tema e depois marque um ou mais subtemas para ver os tipos de produção por instituição."
          />
        ) : mapaTipos.linhas.length > 0 ? (
          <MapaCalor
            linhas={mapaTipos.linhas}
            colunas={mapaTipos.colunas}
            rotuloLinhas="Instituição"
            rotuloPercentual="% da instituição"
            corPorColuna={Boolean(mapaTipos.corTema)}
            {...cliqueTipo}
          />
        ) : (
          <EstadoVazio titulo="Sem produções para os filtros escolhidos" />
        )}
      </Cartao>
    </div>
  );
}
