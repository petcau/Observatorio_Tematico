// Gráfico de barras horizontais feito à mão (sem lib de charts): cada item
// vira uma linha com quadradinho de seleção + rótulo + valor em cima e uma
// barra proporcional embaixo. Vários itens podem ficar marcados ao mesmo
// tempo (multi-seleção). Cor identifica a entidade (nunca sua posição no
// ranking); rótulo e valor nunca herdam a cor da barra, só ficam ao lado dela.
function BarraLista({ itens, selecionados = [], aoAlternar, formatarTitulo }) {
  const maxValor = Math.max(1, ...itens.map((i) => i.valor));
  const selecionavel = Boolean(aoAlternar);
  const temSelecao = selecionados.length > 0;

  return (
    <div className="space-y-4">
      {itens.map((item) => {
        const pct = (item.valor / maxValor) * 100;
        const marcado = selecionados.includes(item.chave);
        const opaco = temSelecao && !marcado;
        return (
          <div
            key={item.chave}
            className={`flex items-start gap-3 ${selecionavel ? 'cursor-pointer' : ''}`}
            onClick={selecionavel ? () => aoAlternar(item.chave) : undefined}
            title={formatarTitulo ? formatarTitulo(item) : undefined}
          >
            {selecionavel && (
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  marcado ? 'border-transparent' : 'border-slate-300 bg-white'
                }`}
                style={marcado ? { backgroundColor: item.cor } : undefined}
                aria-hidden="true"
              >
                {marcado && (
                  <svg viewBox="0 0 16 16" className="h-3 w-3 fill-white">
                    <path d="M6.5 10.8 3.7 8l-1 1 3.8 3.8L13.3 6l-1-1z" />
                  </svg>
                )}
              </span>
            )}
            <div className="flex-1">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-sm text-slate-700">{item.rotulo}</span>
                <span className="text-sm font-semibold tabular-nums text-slate-800">
                  {item.valor}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${item.valor > 0 ? Math.max(pct, 2) : 0}%`,
                    backgroundColor: item.cor,
                    opacity: opaco ? 0.4 : 1,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
