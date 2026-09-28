// Colunas verticais de série única, feitas à mão (sem lib de charts), com o
// valor direto acima de cada coluna. `aoClicar` transforma cada coluna em botão.
function GraficoColunas({ itens, formatarTitulo, altura = 200, aoClicar }) {
  const maxValor = Math.max(1, ...itens.map((i) => i.valor));
  const Coluna = aoClicar ? 'button' : 'div';
  return (
    <div className="flex items-end gap-2 sm:gap-4">
      {itens.map((item) => {
        const h = item.valor > 0 ? Math.max((item.valor / maxValor) * altura, 3) : 0;
        const clicavel = aoClicar && item.valor > 0;
        return (
          <Coluna
            key={item.chave}
            type={aoClicar ? 'button' : undefined}
            disabled={aoClicar ? !clicavel : undefined}
            onClick={clicavel ? () => aoClicar(item.chave) : undefined}
            className={`group flex min-w-0 flex-1 flex-col items-center ${clicavel ? 'cursor-pointer' : 'cursor-default'}`}
            title={formatarTitulo ? formatarTitulo(item) : undefined}
          >
            <div className="flex w-full flex-col items-center justify-end" style={{ height: altura + 20 }}>
              <span className="mb-1 text-xs font-semibold tabular-nums text-slate-800">
                {item.valor.toLocaleString('pt-BR')}
              </span>
              <div
                className={`w-full max-w-[3.5rem] rounded-t transition-all duration-300 ${
                  clicavel ? 'group-hover:opacity-75' : ''
                }`}
                style={{ height: h, backgroundColor: item.cor }}
              />
            </div>
            <span className="w-full truncate border-t border-slate-300 pt-1.5 text-center text-xs text-slate-600">
              {item.rotulo}
            </span>
          </Coluna>
        );
      })}
    </div>
  );
}
