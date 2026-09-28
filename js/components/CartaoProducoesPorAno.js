// Colunas de produções por ano. Com um único tema nos dados, usa a cor dele.
function CartaoProducoesPorAno({ producoes, altura, aoClicarAno }) {
  const { useMemo } = React;
  const F = Obs.formato;

  const colunas = useMemo(() => {
    const anos = [...new Set(producoes.map((p) => p.ano).filter(Boolean))].sort(F.compararAnos);
    const temas = [...new Set(producoes.map((p) => p.tema))];
    const cor = temas.length === 1 ? Obs.cores.corDoTema(temas[0]) : Obs.cores.COR_PRIMARIA;
    const porAno = new Map(Obs.contagens.agrupar(producoes, (p) => p.ano).map((c) => [c.chave, c.total]));
    return anos.map((ano) => ({ chave: ano, rotulo: ano, valor: porAno.get(ano) || 0, cor }));
  }, [producoes]);

  if (colunas.length === 0) {
    return <EstadoVazio titulo="Sem dados de ano" descricao="Nenhuma produção tem o campo de ano preenchido." />;
  }

  const total = colunas.reduce((s, c) => s + c.valor, 0);
  const ultimos = colunas.slice(-2);
  const somaUltimos = ultimos.reduce((s, c) => s + c.valor, 0);

  return (
    <Cartao
      titulo="Produções por ano"
      descricao={`Produções que atendem aos filtros selecionados, por ano.${
        aoClicarAno ? ' Clique num ano para ver a lista das produções.' : ''
      }`}
      nota={
        ultimos.length === 2 && total > 0
          ? `${ultimos[0].rotulo} e ${ultimos[1].rotulo} concentram ${F.pct(somaUltimos, total)} das produções exibidas (${F.numero(somaUltimos)} de ${F.numero(total)}).`
          : null
      }
    >
      <GraficoColunas
        itens={colunas}
        altura={altura}
        aoClicar={aoClicarAno}
        formatarTitulo={(item) => `${item.rotulo}: ${F.producoes(item.valor)}`}
      />
    </Cartao>
  );
}
