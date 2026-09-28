// Pesquisadores únicos por modalidade/nível de bolsa de produtividade (modality_name).
// Com `aoClicarModalidade`, cada barra vira um botão que recebe o nome da modalidade.
function CartaoPesquisadoresPorBolsa({ producoes, aoClicarModalidade }) {
  const { useMemo } = React;
  const F = Obs.formato;

  const pesquisadores = useMemo(() => Obs.contagens.pesquisadores(producoes), [producoes]);
  const porModalidade = useMemo(
    () => Obs.contagens.agrupar(pesquisadores, (r) => r.modalidade),
    [pesquisadores],
  );
  const comBolsa = porModalidade.reduce((s, m) => s + m.total, 0);

  return (
    <Cartao
      titulo="Pesquisadores com Bolsa Produtividade"
      descricao={`Quantidade de pesquisadores em cada modalidade e nível de bolsa de produtividade.${
        aoClicarModalidade ? ' Clique numa bolsa para ver a lista dos seus pesquisadores.' : ''
      }`}
      nota={`${F.numero(comBolsa)} de ${F.numero(pesquisadores.length)} pesquisadores (${F.pct(comBolsa, pesquisadores.length)}) têm modalidade de bolsa informada; os demais não aparecem neste gráfico.`}
    >
      {porModalidade.length > 0 ? (
        <BarraLista
          rotuloDentro
          aoClicar={aoClicarModalidade}
          itens={porModalidade.map((m) => ({
            chave: m.chave,
            rotulo: m.chave,
            valor: m.total,
            cor: Obs.cores.COR_PRIMARIA,
          }))}
          formatarTitulo={(item) =>
            `${F.numero(item.valor)} ${item.valor === 1 ? 'pesquisador' : 'pesquisadores'} (${F.pct(item.valor, comBolsa)} dos bolsistas)${
              aoClicarModalidade ? ' — clique para ver os pesquisadores' : ''
            }`
          }
        />
      ) : (
        <EstadoVazio titulo="Nenhum pesquisador com modalidade de bolsa nos filtros escolhidos" />
      )}
    </Cartao>
  );
}
