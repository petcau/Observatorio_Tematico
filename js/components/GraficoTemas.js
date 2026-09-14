function GraficoTemas({ contagens, temasSelecionados, aoAlternarTema }) {
  const itens = [...contagens]
    .sort((a, b) => b.total - a.total)
    .map((c) => ({
      chave: c.tema,
      rotulo: c.tema,
      valor: c.total,
      cor: Obs.cores.corDoTema(c.tema),
    }));

  return (
    <BarraLista
      itens={itens}
      selecionados={temasSelecionados}
      aoAlternar={aoAlternarTema}
      formatarTitulo={(item) =>
        `${item.valor} ${item.valor === 1 ? 'produção' : 'produções'} — marque para ver os subtemas`
      }
    />
  );
}
