// Regras de contagem: tema é exclusivo (soma = total); subtema é por menção
// (não exclusivo — a soma pode superar o total de produções do tema).
window.Obs = window.Obs || {};

Obs.contagens = (function () {
  function contarPorTema(producoes, temasDaTaxonomia) {
    const contagem = new Map(temasDaTaxonomia.map((t) => [t, 0]));
    for (const p of producoes) {
      contagem.set(p.tema, (contagem.get(p.tema) || 0) + 1);
    }
    return temasDaTaxonomia.map((tema) => ({ tema, total: contagem.get(tema) || 0 }));
  }

  function contarSubtemas(producoesDoTema, subtemasDaTaxonomia) {
    const contagem = new Map(subtemasDaTaxonomia.map((s) => [s, 0]));
    for (const p of producoesDoTema) {
      for (const s of p.subtemas) {
        contagem.set(s, (contagem.get(s) || 0) + 1);
      }
    }
    return subtemasDaTaxonomia
      .map((subtema) => ({ subtema, mencoes: contagem.get(subtema) || 0 }))
      .sort((a, b) => b.mencoes - a.mencoes);
  }

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

  function opcoesDisponiveis(producoes, campo) {
    const valores = new Set();
    for (const p of producoes) {
      if (p[campo]) valores.add(p[campo]);
    }
    return [...valores].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  return { contarPorTema, contarSubtemas, contarPorTipo, opcoesDisponiveis };
})();
