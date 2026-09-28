// Regras de contagem: tema é exclusivo (soma = total); subtema é por menção
// (não exclusivo — a soma pode superar o total de produções do tema).
window.Obs = window.Obs || {};

Obs.contagens = (function () {
  const NAO_INFORMADO = 'Não informado';

  function contarPorTipo(producoes, categoriasTipo) {
    const contagem = new Map();
    for (const p of producoes) {
      if (!p.tipo) continue;
      contagem.set(p.tipo, (contagem.get(p.tipo) || 0) + 1);
    }
    return categoriasTipo.map((cat) => ({
      categoria: cat.categoria,
      tipos: cat.tipos.map((t) => ({ tipo: t.nome, total: contagem.get(t.nome) || 0 })),
    }));
  }

  // Conta produções por chave; valores vazios caem em "Não informado" só se
  // incluirVazios for true — senão são ignorados.
  function agrupar(itens, chaveDe, { incluirVazios = false } = {}) {
    const contagem = new Map();
    for (const item of itens) {
      const chave = chaveDe(item) || (incluirVazios ? NAO_INFORMADO : null);
      if (!chave) continue;
      contagem.set(chave, (contagem.get(chave) || 0) + 1);
    }
    return [...contagem.entries()]
      .map(([chave, total]) => ({ chave, total }))
      .sort((a, b) => b.total - a.total);
  }

  // Tabela cruzada linha × segmento: [{ chave, total, segmentos: Map(segmento → n) }].
  function cruzar(itens, linhaDe, segmentoDe) {
    const linhas = new Map();
    for (const item of itens) {
      const linha = linhaDe(item);
      const segmento = segmentoDe(item);
      if (!linha || !segmento) continue;
      if (!linhas.has(linha)) linhas.set(linha, { chave: linha, total: 0, segmentos: new Map() });
      const l = linhas.get(linha);
      l.total += 1;
      l.segmentos.set(segmento, (l.segmentos.get(segmento) || 0) + 1);
    }
    return [...linhas.values()];
  }

  // Um registro por pesquisador (id_pesquisador); h-index, i10 e classificação
  // são atributos do pesquisador, repetidos em cada produção dele.
  function pesquisadores(producoes) {
    const mapa = new Map();
    for (const p of producoes) {
      if (!p.pesquisador) continue;
      const id = p.idPesquisador || p.pesquisador;
      if (!mapa.has(id)) {
        mapa.set(id, {
          id,
          nome: p.pesquisador,
          instituicao: p.instituicao,
          modalidade: p.modalidade,
          total: 0,
        });
      }
      mapa.get(id).total += 1;
    }
    return [...mapa.values()];
  }

  const FAIXAS_JCR = [
    { rotulo: '< 1', min: 0, max: 1 },
    { rotulo: '1 – 2', min: 1, max: 2 },
    { rotulo: '2 – 3', min: 2, max: 3 },
    { rotulo: '3 – 5', min: 3, max: 5 },
    { rotulo: '5 – 10', min: 5, max: 10 },
    { rotulo: '≥ 10', min: 10, max: Infinity },
  ];

  function faixasJcr(producoes) {
    const contagem = FAIXAS_JCR.map((f) => ({ ...f, total: 0 }));
    for (const p of producoes) {
      if (p.jcr === undefined) continue;
      const faixa = contagem.find((f) => p.jcr >= f.min && p.jcr < f.max);
      if (faixa) faixa.total += 1;
    }
    return contagem;
  }

  return {
    NAO_INFORMADO,
    contarPorTipo,
    agrupar,
    cruzar,
    pesquisadores,
    faixasJcr,
  };
})();
