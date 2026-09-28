// Pesquisadores únicos por instituição de vínculo.
// Com `aoClicarInstituicao`, cada barra vira um botão que recebe o nome da instituição.
function CartaoPesquisadoresPorInstituicao({ producoes, aoClicarInstituicao }) {
  const { useMemo } = React;
  const F = Obs.formato;

  const pesquisadores = useMemo(() => Obs.contagens.pesquisadores(producoes), [producoes]);
  const porInstituicao = useMemo(
    () => Obs.contagens.agrupar(pesquisadores, (r) => r.instituicao),
    [pesquisadores],
  );

  return (
    <Cartao
      titulo="Pesquisadores por instituição"
      descricao={`${F.numero(pesquisadores.length)} pesquisadores únicos, contados pela instituição de vínculo.${
        aoClicarInstituicao ? ' Clique numa instituição para ver a lista dos seus pesquisadores.' : ''
      }`}
    >
      {porInstituicao.length > 0 ? (
        <BarraLista
          rotuloDentro
          aoClicar={aoClicarInstituicao}
          itens={porInstituicao.map((i) => ({
            chave: i.chave,
            rotulo: i.chave,
            valor: i.total,
            cor: Obs.cores.corDaInstituicao(i.chave),
          }))}
          formatarTitulo={(item) =>
            `${F.numero(item.valor)} ${item.valor === 1 ? 'pesquisador' : 'pesquisadores'} (${F.pct(item.valor, pesquisadores.length)})${
              aoClicarInstituicao ? ' — clique para ver os pesquisadores' : ''
            }`
          }
        />
      ) : (
        <EstadoVazio titulo="Sem dados de pesquisador" />
      )}
    </Cartao>
  );
}
