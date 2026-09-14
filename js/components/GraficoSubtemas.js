function GraficoSubtemas({ contagens }) {
  const { useState } = React;
  const [selecionados, setSelecionados] = useState([]);

  if (contagens.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhum subtema cadastrado para os temas selecionados"
        descricao="A taxonomia em dados/temas.csv não lista subtemas para estes temas."
      />
    );
  }

  const semMencoes = contagens.every((c) => c.mencoes === 0);
  const itens = contagens.map((c) => ({
    chave: `${c.tema}::${c.subtema}`,
    rotulo: c.subtema,
    valor: c.mencoes,
    cor: Obs.cores.corDoTema(c.tema),
  }));

  function alternar(chave) {
    setSelecionados((atual) =>
      atual.includes(chave) ? atual.filter((c) => c !== chave) : [...atual, chave],
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">
        Contagem por <strong>menção</strong> — uma produção pode contar em mais de
        um subtema, então a soma pode superar o total de produções do tema.
      </p>
      {semMencoes && (
        <p className="mb-3 text-sm text-slate-500">
          Nenhuma menção de subtema registrada ainda para os temas selecionados
          nos dados carregados.
        </p>
      )}
      <BarraLista
        itens={itens}
        selecionados={selecionados}
        aoAlternar={alternar}
        formatarTitulo={(item) => `${item.valor} ${item.valor === 1 ? 'menção' : 'menções'}`}
      />
    </div>
  );
}
