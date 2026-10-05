function SecaoLocalizacao({ producoes, aoAbrirComFiltro }) {
  const { useEffect, useMemo, useRef, useState } = React;
  const [geojson, setGeojson] = useState(null);
  const [erro, setErro] = useState(null);
  const [municipioAtivo, setMunicipioAtivo] = useState(null);
  const [visao, setVisao] = useState({ x: 0, y: 0, largura: 720, altura: 760 });
  const refSvg = useRef(null);
  const arraste = useRef(null);
  const ignorarClique = useRef(false);

  useEffect(() => {
    let cancelado = false;
    fetch('dados/territorio_relacionado.json')
      .then((resposta) => {
        if (!resposta.ok) throw new Error(`Falha ao carregar o mapa (HTTP ${resposta.status})`);
        return resposta.json();
      })
      .then((dados) => {
        if (!cancelado) setGeojson(dados);
      })
      .catch((e) => {
        if (!cancelado) setErro(e && e.message ? e.message : String(e));
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const mapa = useMemo(() => {
    if (!geojson || !Array.isArray(geojson.features)) return null;

    const largura = 720;
    const altura = 760;
    const margem = 12;
    const pontos = [];

    function visitarCoordenadas(coordenadas) {
      if (typeof coordenadas[0] === 'number') {
        pontos.push(coordenadas);
        return;
      }
      coordenadas.forEach(visitarCoordenadas);
    }

    geojson.features.forEach((f) => visitarCoordenadas(f.geometry.coordinates));
    const longitudes = pontos.map((p) => p[0]);
    const latitudes = pontos.map((p) => p[1]);
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const escala = Math.min(
      (largura - margem * 2) / (maxLon - minLon),
      (altura - margem * 2) / (maxLat - minLat),
    );
    const deslocamentoX = (largura - (maxLon - minLon) * escala) / 2;
    const deslocamentoY = (altura - (maxLat - minLat) * escala) / 2;
    const projetar = ([lon, lat]) => [
      deslocamentoX + (lon - minLon) * escala,
      deslocamentoY + (maxLat - lat) * escala,
    ];

    function caminhoDoAnel(anel) {
      return anel
        .map((p, i) => {
          const [x, y] = projetar(p);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ') + ' Z';
    }

    function caminhoDaGeometria(geometria) {
      const poligonos = geometria.type === 'MultiPolygon' ? geometria.coordinates : [geometria.coordinates];
      return poligonos.flatMap((poligono) => poligono.map(caminhoDoAnel)).join(' ');
    }

    // Usa o centroide do maior polígono do município para posicionar o ponto e
    // o rótulo. Isso evita que ilhas pequenas desloquem o marcador para o mar.
    function centroDoAnel(anel) {
      const pontosProjetados = anel.map(projetar);
      let areaDobrada = 0;
      let somaX = 0;
      let somaY = 0;
      for (let i = 0; i < pontosProjetados.length - 1; i += 1) {
        const [x1, y1] = pontosProjetados[i];
        const [x2, y2] = pontosProjetados[i + 1];
        const cruzado = x1 * y2 - x2 * y1;
        areaDobrada += cruzado;
        somaX += (x1 + x2) * cruzado;
        somaY += (y1 + y2) * cruzado;
      }
      if (Math.abs(areaDobrada) < 0.001) {
        const [somaPx, somaPy] = pontosProjetados.reduce(
          ([sx, sy], [x, y]) => [sx + x, sy + y],
          [0, 0],
        );
        return { x: somaPx / pontosProjetados.length, y: somaPy / pontosProjetados.length, area: 0 };
      }
      return {
        x: somaX / (3 * areaDobrada),
        y: somaY / (3 * areaDobrada),
        area: Math.abs(areaDobrada / 2),
      };
    }

    function centroDaGeometria(geometria) {
      const poligonos = geometria.type === 'MultiPolygon' ? geometria.coordinates : [geometria.coordinates];
      return poligonos
        .map((poligono) => centroDoAnel(poligono[0]))
        .sort((a, b) => b.area - a.area)[0];
    }

    // O CSV repete os dados do pesquisador em cada produção. Para o mapa, cada
    // pesquisador é contado uma única vez no município informado.
    const cidadePorPesquisador = new Map();
    for (const p of producoes) {
      if (!p.pesquisador || !p.cidadePesquisador) continue;
      const id = p.idPesquisador || p.pesquisador;
      cidadePorPesquisador.set(id, Obs.csv.normalizar(p.cidadePesquisador));
    }

    const pesquisadoresPorCidade = new Map();
    for (const cidade of cidadePorPesquisador.values()) {
      pesquisadoresPorCidade.set(cidade, (pesquisadoresPorCidade.get(cidade) || 0) + 1);
    }

    const nomesMunicipios = new Set(
      geojson.features.map((f) => Obs.csv.normalizar(f.properties.name)),
    );
    const totalLocalizados = [...cidadePorPesquisador.values()].filter((cidade) =>
      nomesMunicipios.has(cidade),
    ).length;
    const maximo = Math.max(
      0,
      ...geojson.features.map((f) => pesquisadoresPorCidade.get(Obs.csv.normalizar(f.properties.name)) || 0),
    );

    const municipios = geojson.features.map((f) => ({
      id: f.properties.id,
      nome: f.properties.name,
      territorio: f.properties.territorio_identidade,
      territorioId: f.properties.territorio_id,
      total: pesquisadoresPorCidade.get(Obs.csv.normalizar(f.properties.name)) || 0,
      caminho: caminhoDaGeometria(f.geometry),
      centro: centroDaGeometria(f.geometry),
    })).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'));

    // Posiciona primeiro os municípios com maior contagem. Os demais rótulos
    // tentam posições alternativas para reduzir colisões entre os nomes.
    const caixasRotulos = [];
    for (const municipio of municipios.filter((m) => m.total > 0)) {
      const larguraRotulo = Math.max(34, municipio.nome.length * 5.8);
      const alturaRotulo = 13;
      const opcoesProximas = [
        { dx: 6, dy: -7, ancora: 'start' },
        { dx: 6, dy: 13, ancora: 'start' },
        { dx: -6, dy: -7, ancora: 'end' },
        { dx: -6, dy: 13, ancora: 'end' },
      ];
      const opcoesDistantes = [-21, 27, -35, 41, -49, 55, -63, 69].flatMap((dy) => [
        { dx: 8, dy, ancora: 'start' },
        { dx: -8, dy, ancora: 'end' },
      ]);
      const opcoes = [...opcoesProximas, ...opcoesDistantes];
      let escolhida = opcoes[0];
      for (const opcao of opcoes) {
        const x = municipio.centro.x + opcao.dx;
        const y = municipio.centro.y + opcao.dy;
        const esquerda = opcao.ancora === 'end' ? x - larguraRotulo : x;
        const caixa = { esquerda, direita: esquerda + larguraRotulo, topo: y - alturaRotulo, base: y + 2 };
        const dentro = caixa.esquerda >= 2 && caixa.direita <= largura - 2 && caixa.topo >= 2 && caixa.base <= altura - 2;
        const colide = caixasRotulos.some((outra) =>
          caixa.esquerda < outra.direita + 3 && caixa.direita + 3 > outra.esquerda &&
          caixa.topo < outra.base + 2 && caixa.base + 2 > outra.topo,
        );
        if (dentro && !colide) {
          escolhida = opcao;
          caixasRotulos.push(caixa);
          break;
        }
      }
      municipio.rotulo = {
        x: municipio.centro.x + escolhida.dx,
        y: municipio.centro.y + escolhida.dy,
        ancora: escolhida.ancora,
      };
    }

    return {
      largura,
      altura,
      totalLocalizados,
      maximo,
      municipios,
    };
  }, [geojson, producoes]);

  if (erro) {
    return <EstadoVazio titulo="Não foi possível carregar o mapa" descricao={erro} />;
  }

  if (!mapa) {
    return <EstadoVazio titulo="Carregando mapa da Bahia…" />;
  }

  const F = Obs.formato;
  const comPesquisadores = mapa.municipios.filter((m) => m.total > 0);
  const nivelZoom = mapa.largura / visao.largura;

  function limitarVisao(proxima) {
    const larguraMinima = mapa.largura / 8;
    const largura = Math.max(larguraMinima, Math.min(mapa.largura, proxima.largura));
    const altura = largura * (mapa.altura / mapa.largura);
    return {
      x: Math.max(0, Math.min(mapa.largura - largura, proxima.x)),
      y: Math.max(0, Math.min(mapa.altura - altura, proxima.y)),
      largura,
      altura,
    };
  }

  function mudarZoom(fator) {
    setVisao((atual) => {
      const foco = {
        x: atual.x + atual.largura / 2,
        y: atual.y + atual.altura / 2,
      };
      const novaLargura = atual.largura / fator;
      const proporcao = novaLargura / atual.largura;
      return limitarVisao({
        x: foco.x - (foco.x - atual.x) * proporcao,
        y: foco.y - (foco.y - atual.y) * proporcao,
        largura: novaLargura,
      });
    });
  }

  function iniciarArraste(evento) {
    if (nivelZoom <= 1 || evento.button !== 0) return;
    arraste.current = {
      x: evento.clientX,
      y: evento.clientY,
      visao: { ...visao },
      moveu: false,
      capturado: false,
      pointerId: evento.pointerId,
    };
  }

  function arrastarMapa(evento) {
    if (!arraste.current || !refSvg.current) return;
    const caixa = refSvg.current.getBoundingClientRect();
    const dx = evento.clientX - arraste.current.x;
    const dy = evento.clientY - arraste.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) {
      arraste.current.moveu = true;
      ignorarClique.current = true;
      if (!arraste.current.capturado) {
        refSvg.current.setPointerCapture(arraste.current.pointerId);
        arraste.current.capturado = true;
      }
    }
    const inicial = arraste.current.visao;
    setVisao(limitarVisao({
      ...inicial,
      x: inicial.x - (dx / caixa.width) * inicial.largura,
      y: inicial.y - (dy / caixa.height) * inicial.altura,
    }));
  }

  function terminarArraste(evento) {
    if (!arraste.current) return;
    const estavaCapturado = arraste.current.capturado;
    arraste.current = null;
    if (estavaCapturado && evento.currentTarget.hasPointerCapture(evento.pointerId)) {
      evento.currentTarget.releasePointerCapture(evento.pointerId);
    }
    setTimeout(() => {
      ignorarClique.current = false;
    }, 0);
  }

  function abrirMunicipio(municipio) {
    if (!municipio.total || ignorarClique.current) return;
    const chave = Obs.csv.normalizar(municipio.nome);
    aoAbrirComFiltro(
      'pesquisadores',
      'cidadePesquisador',
      municipio.nome,
      (p) => Obs.csv.normalizar(p.cidadePesquisador || '') === chave,
      { texto: `Município: ${municipio.nome}` },
    );
  }

  return (
    <Cartao
      titulo="Pesquisadores por município da Bahia"
      descricao={`${F.numero(mapa.totalLocalizados)} pesquisadores em ${F.numero(comPesquisadores.length)} municípios baianos, considerando os filtros selecionados.`}
      nota="Cada pesquisador é contado uma vez. Registros sem município ou com município fora da Bahia não entram no mapa."
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-4">
          <div className="absolute right-4 top-4 z-10 flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-sm">
            <button
              type="button"
              onClick={() => mudarZoom(1.5)}
              disabled={nivelZoom >= 7.99}
              aria-label="Ampliar mapa"
              title="Ampliar"
              className="flex h-9 w-9 items-center justify-center border-r border-slate-200 text-xl font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => mudarZoom(1 / 1.5)}
              disabled={nivelZoom <= 1.01}
              aria-label="Reduzir mapa"
              title="Reduzir"
              className="flex h-9 w-9 items-center justify-center border-r border-slate-200 text-xl font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              −
            </button>
            <span
              aria-label={`Nível de zoom: ${nivelZoom.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} vezes`}
              className="flex h-9 min-w-12 items-center justify-center px-2 text-xs font-semibold tabular-nums text-slate-600"
            >
              {nivelZoom.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}×
            </span>
          </div>
          <svg
            ref={refSvg}
            viewBox={`${visao.x} ${visao.y} ${visao.largura} ${visao.altura}`}
            role="img"
            aria-label="Mapa da quantidade de pesquisadores por município da Bahia"
            className={`mx-auto h-auto max-h-[70vh] w-full select-none ${nivelZoom > 1 ? 'touch-none cursor-grab active:cursor-grabbing' : ''}`}
            onPointerDown={iniciarArraste}
            onPointerMove={arrastarMapa}
            onPointerUp={terminarArraste}
            onPointerCancel={terminarArraste}
          >
            {mapa.municipios.map((m) => {
              const ativo = municipioAtivo && municipioAtivo.id === m.id;
              const proporcao = mapa.maximo > 0
                ? 0.35 + 0.65 * Math.sqrt(m.total / mapa.maximo)
                : 0;
              const cor = m.total ? Obs.cores.corSequencial(proporcao).fundo : '#e2e8f0';
              return (
                <path
                  key={m.id}
                  d={m.caminho}
                  fill={cor}
                  fillRule="evenodd"
                  stroke={ativo ? '#0f172a' : '#ffffff'}
                  strokeWidth={ativo ? 1.8 : 0.55}
                  vectorEffect="non-scaling-stroke"
                  role={m.total ? 'button' : undefined}
                  tabIndex={m.total ? 0 : undefined}
                  aria-label={`${m.nome}: ${F.numero(m.total)} ${m.total === 1 ? 'pesquisador' : 'pesquisadores'}`}
                  className={m.total ? 'cursor-pointer transition-opacity hover:opacity-75 focus:outline-none' : ''}
                  onMouseEnter={() => setMunicipioAtivo(m)}
                  onMouseLeave={() => setMunicipioAtivo(null)}
                  onFocus={() => setMunicipioAtivo(m)}
                  onBlur={() => setMunicipioAtivo(null)}
                  onClick={() => abrirMunicipio(m)}
                  onKeyDown={(e) => {
                    if (m.total && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      abrirMunicipio(m);
                    }
                  }}
                >
                  <title>{`${m.nome} — ${m.territorio} — ${F.numero(m.total)} ${m.total === 1 ? 'pesquisador' : 'pesquisadores'}`}</title>
                </path>
              );
            })}

            <g aria-label="Municípios com pesquisadores">
              {[...comPesquisadores].reverse().map((m) => (
                <g
                  key={`rotulo-${m.id}`}
                  role="button"
                  tabIndex="0"
                  aria-label={`Ver pesquisadores de ${m.nome}`}
                  className="cursor-pointer focus:outline-none"
                  onMouseEnter={() => setMunicipioAtivo(m)}
                  onMouseLeave={() => setMunicipioAtivo(null)}
                  onFocus={() => setMunicipioAtivo(m)}
                  onBlur={() => setMunicipioAtivo(null)}
                  onClick={() => abrirMunicipio(m)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      abrirMunicipio(m);
                    }
                  }}
                >
                  <line
                    x1={m.centro.x}
                    y1={m.centro.y}
                    x2={m.rotulo.x + (m.rotulo.ancora === 'start' ? -2 : 2)}
                    y2={m.rotulo.y - 3}
                    stroke="#475569"
                    strokeWidth="0.8"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={m.centro.x}
                    cy={m.centro.y}
                    r="3.2"
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth="1.4"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={m.rotulo.x}
                    y={m.rotulo.y}
                    textAnchor={m.rotulo.ancora}
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth="3"
                    paintOrder="stroke"
                    strokeLinejoin="round"
                    className="text-[10px] font-semibold"
                  >
                    {m.nome}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        </div>

        <div>
          <div className="mb-4 min-h-16 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Município</p>
            {municipioAtivo ? (
              <>
                <p className="mt-1 font-semibold text-slate-900">{municipioAtivo.nome}</p>
                <p className="text-sm text-slate-600">{municipioAtivo.territorio}</p>
                <p className="mt-1 text-sm font-medium text-blue-800">
                  {F.numero(municipioAtivo.total)} {municipioAtivo.total === 1 ? 'pesquisador' : 'pesquisadores'}
                </p>
                {municipioAtivo.total > 0 && (
                  <p className="mt-1 text-xs text-slate-500">Clique para ver a lista.</p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-600">Passe o cursor sobre o mapa.</p>
            )}
          </div>

          <div className="mb-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Quantidade de pesquisadores</h3>
            <div className="h-3 rounded-full bg-gradient-to-r from-[#e6f0fd] to-[#0d366b]" aria-hidden="true" />
            <div className="mt-1 flex justify-between text-xs tabular-nums text-slate-500">
              <span>1</span>
              <span>{F.numero(mapa.maximo)}</span>
            </div>
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="h-3 w-3 rounded-sm border border-slate-300 bg-slate-200" aria-hidden="true" />
              Sem pesquisadores
            </p>
          </div>

          <h3 className="mb-2 text-sm font-semibold text-slate-700">Municípios com mais pesquisadores</h3>
          <ol className="space-y-1.5">
            {comPesquisadores.slice(0, 10).map((m, i) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => abrirMunicipio(m)}
                  onMouseEnter={() => setMunicipioAtivo(m)}
                  onMouseLeave={() => setMunicipioAtivo(null)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-50"
                >
                  <span className="w-5 text-right tabular-nums text-slate-400">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{m.nome}</span>
                  <span className="font-semibold tabular-nums text-slate-900">{F.numero(m.total)}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Cartao>
  );
}
