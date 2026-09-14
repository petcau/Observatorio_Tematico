// Utilidades genéricas de CSV: parsing (via PapaParse, carregado por CDN em
// index.html) e normalização de texto para comparação tolerante a acento/caixa.
window.Obs = window.Obs || {};

Obs.csv = (function () {
  function parseCsv(texto) {
    const semBom = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
    const resultado = Papa.parse(semBom, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    return resultado.data;
  }

  function normalizar(texto) {
    return texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  async function buscarTexto(caminho) {
    const resposta = await fetch(caminho);
    if (!resposta.ok) {
      throw new Error(`Falha ao carregar ${caminho} (HTTP ${resposta.status})`);
    }
    return resposta.text();
  }

  return { parseCsv, normalizar, buscarTexto };
})();
