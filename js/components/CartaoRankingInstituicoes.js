function CartaoRankingInstituicoes({ producoes, aoClicarInstituicao }) {
  const { useMemo } = React;
  const F = Obs.formato;

  const ranking = useMemo(() => Obs.contagens.agrupar(producoes, (p) => p.instituicao), [producoes]);

  if (ranking.length === 0) {
    return (
      <EstadoVazio
        titulo="Sem dados de instituição"
        descricao="Nenhuma produção tem o campo de instituição preenchido."
      />
    );
  }

  const total = ranking.reduce((s, r) => s + r.total, 0);

  return (
    <Cartao
      titulo="Ranking de instituições"
      descricao={`${ranking.length} ${ranking.length === 1 ? 'instituição' : 'instituições'}, ordenadas por número de produções.${
        aoClicarInstituicao ? ' Clique numa instituição para ver a lista das produções.' : ''
      }`}
    >
      <BarraLista
        rotuloDentro
        aoClicar={aoClicarInstituicao}
        itens={ranking.map((r) => ({
          chave: r.chave,
          rotulo: r.chave,
          valor: r.total,
          cor: Obs.cores.corDaInstituicao(r.chave),
        }))}
        formatarTitulo={(item) => `${F.producoes(item.valor)} (${F.pct(item.valor, total)} do total)`}
      />
    </Cartao>
  );
}
