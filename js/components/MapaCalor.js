// Mapa de calor genérico: linhas × colunas com contagens.
// linhas: [{ chave, rotulo, total, valores: Map(chaveColuna → n) }]
// colunas: [{ chave, rotulo, cor }]
// Em "%" a cor é a participação na linha (n / total); em "Quantidade", n / maior valor.
// Com `corPorColuna`, cada coluna usa uma escala no matiz da sua própria `cor`.
// `aoClicarCelula(linha, coluna)` e `aoClicarTotal(linha)` tornam células/totais clicáveis.
function MapaCalor({
  linhas,
  colunas,
  rotuloLinhas,
  rotuloPercentual,
  rotuloTotal = 'Total',
  unidade = 'produções',
  corPorColuna = false,
  aoClicarCelula,
  aoClicarTotal,
}) {
  const { useState } = React;
  const F = Obs.formato;
  const [modo, setModo] = useState('percentual');

  const maximo = Math.max(1, ...linhas.flatMap((l) => colunas.map((c) => l.valores.get(c.chave) || 0)));
  const escalas = corPorColuna
    ? [...new Set(colunas.map((c) => c.cor))].map((cor) => Obs.cores.rampaDoMatiz(cor))
    : [Obs.cores.RAMPA_SEQUENCIAL];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{modo === 'percentual' ? '0%' : '0'}</span>
          <span className="flex flex-col gap-0.5" aria-hidden="true">
            {escalas.map((rampa) => (
              <span
                key={rampa[9]}
                className="h-2.5 w-32 rounded-sm"
                style={{ background: `linear-gradient(to right, ${rampa.join(', ')})` }}
              />
            ))}
          </span>
          <span>{modo === 'percentual' ? '100%' : F.numero(maximo)}</span>
        </div>
        <Seletor
          rotulo="Escala"
          valor={modo}
          aoMudar={setModo}
          opcoes={[
            { valor: 'percentual', rotulo: rotuloPercentual },
            { valor: 'absoluto', rotulo: 'Quantidade' },
          ]}
        />
      </div>

      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table
          className="w-full border-separate border-spacing-[2px] text-sm"
          style={{ minWidth: `${18 + colunas.length * 7}rem` }}
        >
          <thead>
            <tr>
              <th scope="col" className="px-2 py-2 text-left align-bottom font-medium text-slate-500">
                {rotuloLinhas}
              </th>
              {colunas.map((c) => (
                <th key={c.chave} scope="col" className="min-w-[6.5rem] px-2 py-2 align-bottom text-xs font-medium text-slate-600">
                  <span className="flex flex-col items-center gap-1 text-center">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.cor }} aria-hidden="true" />
                    {c.rotulo}
                  </span>
                </th>
              ))}
              <th scope="col" className="px-2 py-2 text-right align-bottom font-medium text-slate-500">
                {rotuloTotal}
              </th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.chave}>
                <th scope="row" className="max-w-[18rem] truncate px-2 py-1.5 text-left font-normal text-slate-700" title={l.rotulo}>
                  {l.rotulo}
                </th>
                {colunas.map((c) => {
                  const n = l.valores.get(c.chave) || 0;
                  const proporcao = modo === 'percentual' ? n / l.total : n / maximo;
                  const { fundo, texto } = Obs.cores.corSequencial(proporcao, corPorColuna ? c.cor : undefined);
                  const pct = F.pct(n, l.total);
                  const conteudo = n === 0 ? '—' : modo === 'percentual' ? pct : F.numero(n);
                  const dica = `${l.rotulo} · ${c.rotulo}: ${F.numero(n)} ${unidade} (${pct})`;
                  return (
                    <td
                      key={c.chave}
                      className="rounded text-center tabular-nums"
                      style={{ backgroundColor: fundo, color: texto }}
                      title={aoClicarCelula && n > 0 ? `${dica} — clique para ver as produções` : dica}
                    >
                      {aoClicarCelula && n > 0 ? (
                        <button
                          type="button"
                          onClick={() => aoClicarCelula(l.chave, c.chave)}
                          className="block w-full rounded px-2 py-1.5 hover:outline hover:outline-2 hover:outline-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-700"
                        >
                          {conteudo}
                        </button>
                      ) : (
                        <span className="block px-2 py-1.5">{conteudo}</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-1.5 text-right font-semibold tabular-nums text-slate-900">
                  {aoClicarTotal ? (
                    <button
                      type="button"
                      onClick={() => aoClicarTotal(l.chave)}
                      title="Clique para ver as produções"
                      className="text-blue-700 hover:underline"
                    >
                      {F.numero(l.total)}
                    </button>
                  ) : (
                    F.numero(l.total)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
