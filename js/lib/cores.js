// Paleta categórica dos 5 temas do eixo Energia — ver justificativa e
// validação de acessibilidade (contraste + simulação de daltonismo) no README.
window.Obs = window.Obs || {};

Obs.cores = (function () {
  const CORES_TEMA = {
    'Eficiência Energética': '#1B5FBF',
    'Exploração Mineral Sustentável': '#B8860B',
    'Energias Renováveis, Biomassa e Combustíveis Verdes': '#00897B',
    'Mercado de Carbono': '#6B3FA0',
    'Energias Renováveis nos Transportes': '#C62828',
  };
  const COR_PADRAO = '#64748B';

  const CORES_CATEGORIA_TIPO = {
    'Produção Acadêmica': '#3730A3',
    'Produção Técnica': '#92400E',
  };

  function corDoTema(tema) {
    return CORES_TEMA[tema] || COR_PADRAO;
  }

  function corDaCategoriaTipo(categoria) {
    return CORES_CATEGORIA_TIPO[categoria] || COR_PADRAO;
  }

  return { CORES_TEMA, corDoTema, CORES_CATEGORIA_TIPO, corDaCategoriaTipo };
})();
