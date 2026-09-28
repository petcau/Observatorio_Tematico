// Artigos por estrato Qualis, na ordem oficial (A1 → C), com "Não informado" por último.
// Só artigos: Qualis classifica periódicos, então os outros tipos nunca têm estrato.
// Com `aoClicarQualis`, cada coluna vira botão e recebe o estrato ("Não informado" para N/I).
function CartaoDistribuicaoQualis({ producoes, aoClicarQualis }) {
  const { useMemo } = React;
  const F = Obs.formato;
  const NAO = Obs.contagens.NAO_INFORMADO;
  const ORDEM = Obs.cores.ORDEM_QUALIS;

  const artigos = useMemo(() => producoes.filter((p) => p.tipo === 'Artigos'), [producoes]);

  const porQualis = useMemo(() => {
    const mapa = new Map(
      Obs.contagens.agrupar(artigos, (p) => p.qualis, { incluirVazios: true }).map((c) => [c.chave, c.total]),
    );
    const extras = [...mapa.keys()].filter((k) => !ORDEM.includes(k) && k !== NAO);
    return [...ORDEM, ...extras, NAO]
      .filter((q) => mapa.has(q))
      .map((q) => ({
        chave: q,
        rotulo: q === NAO ? 'N/I' : q,
        valor: mapa.get(q),
        cor: Obs.cores.corDoQualis(q),
      }));
  }, [artigos]);

  const semQualis = artigos.filter((p) => !p.qualis).length;

  return (
    <Cartao
      titulo="Distribuição por Qualis"
      descricao={`Artigos por estrato Qualis do periódico, do mais alto (A1) ao mais baixo (C).${
        aoClicarQualis ? ' Clique num estrato para ver a lista dos artigos.' : ''
      }`}
      nota={`Considera apenas os ${F.numero(artigos.length)} artigos.${
        semQualis > 0 ? ` N/I = ${F.numero(semQualis)} artigos sem estrato Qualis informado.` : ''
      }`}
    >
      {artigos.length > 0 ? (
        <GraficoColunas
          itens={porQualis}
          aoClicar={aoClicarQualis}
          formatarTitulo={(item) =>
            `${item.chave}: ${F.numero(item.valor)} ${item.valor === 1 ? 'artigo' : 'artigos'} (${F.pct(item.valor, artigos.length)})`
          }
        />
      ) : (
        <EstadoVazio titulo="Nenhum artigo nos filtros escolhidos" />
      )}
    </Cartao>
  );
}
