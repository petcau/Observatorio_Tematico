// Carrega dados/temas.csv: cada linha é uma combinação única de tema+subtema
// (a estrutura fixa da taxonomia), não uma contagem de produções.
window.Obs = window.Obs || {};

Obs.taxonomia = (function () {
  async function carregar(caminho) {
    const texto = await Obs.csv.buscarTexto(caminho);
    const linhas = Obs.csv.parseCsv(texto);

    const ordem = [];
    const subtemasPorTema = new Map();
    for (const linha of linhas) {
      const tema = (linha.tema || '').trim();
      const subtema = (linha.subtema || '').trim();
      if (!tema || !subtema) continue;
      if (!subtemasPorTema.has(tema)) {
        subtemasPorTema.set(tema, []);
        ordem.push(tema);
      }
      subtemasPorTema.get(tema).push(subtema);
    }

    const taxonomia = ordem.map((nome) => ({ nome, subtemas: subtemasPorTema.get(nome) || [] }));
    const nomesTemas = taxonomia.map((t) => t.nome);

    const temaPorChaveNormalizada = new Map(
      taxonomia.map((t) => [Obs.csv.normalizar(t.nome), t.nome]),
    );
    const subtemasPorTemaNormalizado = new Map(
      taxonomia.map((t) => [
        Obs.csv.normalizar(t.nome),
        new Map(t.subtemas.map((s) => [Obs.csv.normalizar(s), s])),
      ]),
    );

    function resolverTema(temaBruto) {
      return temaPorChaveNormalizada.get(Obs.csv.normalizar(temaBruto)) || null;
    }

    function resolverSubtema(temaCanonico, subtemaBruto) {
      const mapa = subtemasPorTemaNormalizado.get(Obs.csv.normalizar(temaCanonico));
      if (!mapa) return null;
      return mapa.get(Obs.csv.normalizar(subtemaBruto)) || null;
    }

    function subtemasDoTema(temaCanonico) {
      const t = taxonomia.find((x) => x.nome === temaCanonico);
      return t ? t.subtemas : [];
    }

    return { taxonomia, nomesTemas, resolverTema, resolverSubtema, subtemasDoTema };
  }

  return { carregar };
})();
