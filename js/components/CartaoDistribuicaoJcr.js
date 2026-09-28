// Artigos por faixa de fator de impacto JCR (JCR classifica periódicos: só artigos têm).
// Com `aoClicarFaixa`, cada coluna vira botão e recebe a faixa ({ rotulo, min, max }).
function CartaoDistribuicaoJcr({ producoes, aoClicarFaixa }) {
  const { useMemo } = React;
  const F = Obs.formato;

  const artigos = useMemo(() => producoes.filter((p) => p.tipo === 'Artigos'), [producoes]);
  const faixas = useMemo(() => Obs.contagens.faixasJcr(artigos), [artigos]);
  const comJcr = faixas.reduce((s, f) => s + f.total, 0);

  return (
    <Cartao
      titulo="Distribuição de JCR"
      descricao={`Artigos por fator de impacto JCR do periódico, em faixas.${
        aoClicarFaixa ? ' Clique numa faixa para ver a lista dos artigos.' : ''
      }`}
      nota={`${F.numero(comJcr)} de ${F.numero(artigos.length)} artigos têm JCR informado (${F.pct(comJcr, artigos.length)}).`}
    >
      {comJcr > 0 ? (
        <GraficoColunas
          aoClicar={aoClicarFaixa && ((rotulo) => aoClicarFaixa(faixas.find((f) => f.rotulo === rotulo)))}
          itens={faixas.map((f) => ({
            chave: f.rotulo,
            rotulo: f.rotulo,
            valor: f.total,
            cor: Obs.cores.COR_PRIMARIA,
          }))}
          formatarTitulo={(item) => `JCR ${item.rotulo}: ${F.numero(item.valor)} ${item.valor === 1 ? 'artigo' : 'artigos'}`}
        />
      ) : (
        <EstadoVazio titulo="Nenhum artigo com JCR nos filtros escolhidos" />
      )}
    </Cartao>
  );
}
