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
  const COR_NEUTRA = '#898781';

  // Série única (ano, rankings) — mesmo azul do cabeçalho.
  const COR_PRIMARIA = '#1B5FBF';

  // Paleta categórica de 8 posições validada para daltonismo em pares adjacentes;
  // a ORDEM é o que garante a separação — não reordenar.
  const PALETA = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

  // Cor fixa por entidade (nunca pela posição no ranking). As 8 instituições com
  // mais produções recebem cor própria; as demais ficam no cinza neutro.
  const CORES_INSTITUICAO = {
    'Universidade Federal Da Bahia': PALETA[0],
    'Universidade Federal Do Recôncavo Da Bahia': PALETA[1],
    'Universidade Do Estado Da Bahia': PALETA[2],
    'Instituto Federal De Educação, Ciência E Tecnologia Da Bahia': PALETA[3],
    'Universidade Estadual De Santa Cruz': PALETA[4],
    'Universidade Estadual Do Sudoeste Da Bahia': PALETA[5],
    'Universidade Estadual De Feira De Santana': PALETA[6],
    'Universidade Federal Do Sul Da Bahia': PALETA[7],
  };

  const CORES_TIPO = {
    Artigos: PALETA[0],
    'Cap. Livros': PALETA[1],
    'Depósito de Patente': PALETA[2],
    'Programa de Computador': PALETA[3],
    Livros: PALETA[4],
    'Relatório Técnico': PALETA[5],
    'Registro de Marca': PALETA[6],
    Resumos: PALETA[7],
  };


  // Qualis é uma escala ordinal real (Capes, A1 > … > C) — rampa de um único
  // matiz, do mais escuro (A1) ao mais claro (C). "Não informado" fica fora dela.
  const RAMPA_QUALIS = {
    A1: '#0d366b',
    A2: '#104281',
    A3: '#184f95',
    A4: '#1c5cab',
    B1: '#256abf',
    B2: '#2a78d6',
    B3: '#3987e5',
    B4: '#5598e7',
    C: '#6da7ec',
  };
  const ORDEM_QUALIS = Object.keys(RAMPA_QUALIS);

  // Rampa sequencial de um matiz (azul), do mais claro ao mais escuro, para
  // mapas de calor. A partir do 8º passo o texto por cima precisa ser branco.
  const RAMPA_SEQUENCIAL = [
    '#e6f0fd', '#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7',
    '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b',
  ];

  function hexParaRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbParaHex(rgb) {
    return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  }

  function misturar(a, b, t) {
    const ra = hexParaRgb(a);
    const rb = hexParaRgb(b);
    return rgbParaHex(ra.map((v, i) => v + (rb[i] - v) * t));
  }

  function luminancia(hex) {
    const [r, g, b] = hexParaRgb(hex).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Rampa de um matiz: do quase branco até a cor, depois um pouco mais escura.
  const cacheRampas = new Map();
  function rampaDoMatiz(base) {
    if (!cacheRampas.has(base)) {
      const claros = Array.from({ length: 10 }, (_, i) => misturar('#ffffff', base, (i + 1) / 10));
      const escuros = [0.12, 0.24, 0.36, 0.48].map((t) => misturar(base, '#000000', t));
      cacheRampas.set(base, [...claros, ...escuros]);
    }
    return cacheRampas.get(base);
  }

  // proporcao em [0, 1] → { fundo, texto }. Zero fica neutro (sem cor).
  // Sem `base`, usa a rampa azul padrão; com `base`, a rampa daquela cor.
  function corSequencial(proporcao, base) {
    if (!(proporcao > 0)) return { fundo: '#f8fafc', texto: '#94a3b8' };
    const rampa = base ? rampaDoMatiz(base) : RAMPA_SEQUENCIAL;
    const i = Math.min(rampa.length - 1, Math.ceil(proporcao * rampa.length) - 1);
    const fundo = rampa[i];
    return { fundo, texto: luminancia(fundo) < 0.3 ? '#ffffff' : '#0f172a' };
  }

  function corDoTema(tema) {
    return CORES_TEMA[tema] || COR_PADRAO;
  }

  function corDaInstituicao(nome) {
    return CORES_INSTITUICAO[nome] || COR_NEUTRA;
  }

  function corDoQualis(qualis) {
    return RAMPA_QUALIS[qualis] || COR_NEUTRA;
  }

  function corDoTipo(tipo) {
    return CORES_TIPO[tipo] || COR_NEUTRA;
  }


  return {
    COR_PRIMARIA,
    ORDEM_QUALIS,
    RAMPA_SEQUENCIAL,
    rampaDoMatiz,
    corSequencial,
    corDoTema,
    corDaInstituicao,
    corDoQualis,
    corDoTipo,
  };
})();
