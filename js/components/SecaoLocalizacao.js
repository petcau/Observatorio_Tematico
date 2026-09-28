function SecaoLocalizacao() {
  const { useEffect, useMemo, useState } = React;
  const [geojson, setGeojson] = useState(null);
  const [erro, setErro] = useState(null);
  const [municipioAtivo, setMunicipioAtivo] = useState(null);

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

    const territorios = [...new Map(
      geojson.features.map((f) => [f.properties.territorio_id, f.properties.territorio_identidade]),
    ).entries()]
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const cores = new Map(
      territorios.map((t, i) => [t.id, `hsl(${Math.round((i * 137.508) % 360)} 52% 58%)`]),
    );

    return {
      largura,
      altura,
      territorios: territorios.map((t) => ({ ...t, cor: cores.get(t.id) })),
      municipios: geojson.features.map((f) => ({
        id: f.properties.id,
        nome: f.properties.name,
        territorio: f.properties.territorio_identidade,
        territorioId: f.properties.territorio_id,
        cor: cores.get(f.properties.territorio_id),
        caminho: caminhoDaGeometria(f.geometry),
      })),
    };
  }, [geojson]);

  if (erro) {
    return <EstadoVazio titulo="Não foi possível carregar o mapa" descricao={erro} />;
  }

  if (!mapa) {
    return <EstadoVazio titulo="Carregando mapa da Bahia…" />;
  }

  return (
    <Cartao
      titulo="Municípios e Territórios de Identidade da Bahia"
      descricao="Mapa dos 417 municípios baianos, coloridos conforme os 26 Territórios de Identidade."
      nota="O mapa ainda não representa a localização dos pesquisadores."
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-4">
          <svg
            viewBox={`0 0 ${mapa.largura} ${mapa.altura}`}
            role="img"
            aria-label="Mapa dos municípios e Territórios de Identidade da Bahia"
            className="mx-auto h-auto max-h-[70vh] w-full"
          >
            {mapa.municipios.map((m) => {
              const ativo = municipioAtivo && municipioAtivo.id === m.id;
              return (
                <path
                  key={m.id}
                  d={m.caminho}
                  fill={m.cor}
                  fillRule="evenodd"
                  stroke={ativo ? '#0f172a' : '#ffffff'}
                  strokeWidth={ativo ? 1.8 : 0.55}
                  vectorEffect="non-scaling-stroke"
                  className="transition-opacity hover:opacity-75"
                  onMouseEnter={() => setMunicipioAtivo(m)}
                  onMouseLeave={() => setMunicipioAtivo(null)}
                >
                  <title>{`${m.nome} — ${m.territorio}`}</title>
                </path>
              );
            })}
          </svg>
        </div>

        <div>
          <div className="mb-4 min-h-16 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Município</p>
            {municipioAtivo ? (
              <>
                <p className="mt-1 font-semibold text-slate-900">{municipioAtivo.nome}</p>
                <p className="text-sm text-slate-600">{municipioAtivo.territorio}</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-600">Passe o cursor sobre o mapa.</p>
            )}
          </div>

          <h3 className="mb-2 text-sm font-semibold text-slate-700">Territórios de Identidade</h3>
          <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-1">
            {mapa.territorios.map((t) => (
              <li key={t.id} className="flex items-start gap-2 text-xs text-slate-700">
                <span
                  className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border border-black/10"
                  style={{ backgroundColor: t.cor }}
                  aria-hidden="true"
                />
                <span>{t.nome}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Cartao>
  );
}
