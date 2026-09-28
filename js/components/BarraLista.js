// Gráfico de barras horizontais feito à mão (sem lib de charts): cada item
// vira uma linha com quadradinho de seleção + rótulo + valor em cima e uma
// barra proporcional embaixo. Vários itens podem ficar marcados ao mesmo
// tempo (multi-seleção). Cor identifica a entidade (nunca sua posição no
// ranking); rótulo e valor nunca herdam a cor da barra, só ficam ao lado dela.
// Com `colunas`, os itens fluem em até 3 colunas (de cima para baixo em cada uma).
// Com `rotuloDentro`, rótulo e valor ficam sobre uma barra alta em tom claro
// (versão compacta, sem seleção). `aoClicar` transforma cada linha em botão.
function BarraLista({
  itens,
  selecionados = [],
  aoAlternar,
  formatarTitulo,
  colunas = false,
  rotuloDentro = false,
  aoClicar,
}) {
  const maxValor = Math.max(1, ...itens.map((i) => i.valor));
  const selecionavel = Boolean(aoAlternar);
  const temSelecao = selecionados.length > 0;

  if (rotuloDentro) {
    const Linha = aoClicar ? 'button' : 'div';
    return (
      <div className="space-y-1.5">
        {itens.map((item) => {
          const pct = (item.valor / maxValor) * 100;
          return (
            <Linha
              key={item.chave}
              type={aoClicar ? 'button' : undefined}
              onClick={aoClicar ? () => aoClicar(item.chave) : undefined}
              className={`relative block h-8 w-full overflow-hidden rounded-md bg-slate-50 text-left ${
                aoClicar ? 'cursor-pointer ring-slate-300 hover:ring-2 focus-visible:outline-none focus-visible:ring-2' : ''
              }`}
              title={formatarTitulo ? formatarTitulo(item) : undefined}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-md transition-all duration-300"
                style={{
                  width: `${item.valor > 0 ? Math.max(pct, 1) : 0}%`,
                  backgroundColor: item.cor,
                  opacity: 0.35,
                }}
              />
              <div className="relative flex h-full items-center justify-between gap-3 px-2.5">
                <span className="truncate text-sm text-slate-800">{item.rotulo}</span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                  {item.valor.toLocaleString('pt-BR')}
                </span>
              </div>
            </Linha>
          );
        })}
      </div>
    );
  }

  const LinhaNormal = aoClicar ? 'button' : 'div';
  return (
    <div className={colunas ? 'gap-x-8 sm:columns-2 lg:columns-3' : 'space-y-4'}>
      {itens.map((item) => {
        const pct = (item.valor / maxValor) * 100;
        const marcado = selecionados.includes(item.chave);
        const opaco = temSelecao && !marcado;
        const clicavel = aoClicar && item.valor > 0;
        return (
          <LinhaNormal
            key={item.chave}
            type={aoClicar ? 'button' : undefined}
            disabled={aoClicar ? !clicavel : undefined}
            className={`flex w-full items-start gap-3 text-left ${colunas ? 'mb-4 break-inside-avoid' : ''} ${
              selecionavel ? 'cursor-pointer' : ''
            } ${clicavel ? '-mx-1.5 rounded-md px-1.5 py-1 hover:bg-slate-50' : ''} ${
              aoClicar && !clicavel ? '-mx-1.5 cursor-default px-1.5 py-1' : ''
            }`}
            onClick={selecionavel ? () => aoAlternar(item.chave) : clicavel ? () => aoClicar(item.chave) : undefined}
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
                  {item.valor.toLocaleString('pt-BR')}
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
          </LinhaNormal>
        );
      })}
    </div>
  );
}
