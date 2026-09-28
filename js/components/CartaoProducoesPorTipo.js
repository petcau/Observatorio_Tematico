function CartaoProducoesPorTipo({ producoes, aoClicarTipo }) {
  const { useMemo } = React;
  const F = Obs.formato;

  const porCategoria = useMemo(
    () => Obs.contagens.contarPorTipo(producoes, Obs.tipos.categorias),
    [producoes],
  );
  const semTipo = producoes.filter((p) => !p.tipo).length;

  return (
    <Cartao
      titulo="Produções por tipo"
      descricao={`Tipos agrupados em produção acadêmica e produção técnica.${
        aoClicarTipo ? ' Clique num tipo para ver a lista das produções.' : ''
      }`}
      nota={semTipo > 0 ? `${F.numero(semTipo)} produções sem tipo reconhecido não entram nesta contagem.` : null}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {porCategoria.map((cat) => (
          <div key={cat.categoria}>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">{cat.categoria}</h3>
            <BarraLista
              aoClicar={aoClicarTipo}
              itens={cat.tipos.map((t) => ({
                chave: t.tipo,
                rotulo: t.tipo,
                valor: t.total,
                cor: Obs.cores.corDoTipo(t.tipo),
              }))}
              formatarTitulo={(item) => `${F.producoes(item.valor)} (${F.pct(item.valor, producoes.length)})`}
            />
          </div>
        ))}
      </div>
    </Cartao>
  );
}
