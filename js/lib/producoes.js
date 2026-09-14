// Loader schema-driven dos CSVs de produções listados em OBS_CONFIG.arquivosProducoes.
// Aceita variações de nome de coluna (aliases) e casa tema/subtema contra a
// taxonomia carregada em taxonomia.js. Quando o CSV definitivo chegar, basta
// atualizar a lista de arquivos em config.js — nada aqui precisa mudar.
window.Obs = window.Obs || {};

Obs.producoes = (function () {
  const ALIASES = {
    titulo: ['titulo', 'título', 'nome_artigo', 'nome do artigo'],
    doi: ['doi'],
    tema: ['tema', 'tema_principal', 'tema principal'],
    subtemas: ['subtema', 'subtemas'],
    ano: ['ano', 'periodo', 'período'],
    instituicao: ['instituicao', 'instituição', 'autor', 'autores', 'instituicao/autor'],
    tipo: ['tipo', 'tipo_producao', 'tipo de produção', 'tipo de producao', 'categoria'],
  };

  function normalizarNomeColuna(coluna) {
    return coluna
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
      .toLowerCase();
  }

  function mapearColunas(colunas) {
    const mapa = {};
    const usadas = new Set();
    for (const campo of Object.keys(ALIASES)) {
      const encontrada = colunas.find((c) => ALIASES[campo].includes(normalizarNomeColuna(c)));
      if (encontrada) {
        mapa[campo] = encontrada;
        usadas.add(encontrada);
      }
    }
    return { mapa, ignoradas: colunas.filter((c) => !usadas.has(c)) };
  }

  function dividirSubtemas(bruto) {
    return (bruto || '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function carregarLinhas(linhas, taxo) {
    const producoes = [];
    const invalidas = [];
    if (linhas.length === 0) {
      return {
        producoes,
        invalidas,
        colunasIgnoradas: [],
        temAno: false,
        temInstituicao: false,
        temTipo: false,
      };
    }

    const { mapa, ignoradas } = mapearColunas(Object.keys(linhas[0]));

    linhas.forEach((linha, indice) => {
      const numeroLinha = indice + 2;
      const tituloBruto = mapa.titulo ? (linha[mapa.titulo] || '').trim() : '';
      const temaBruto = mapa.tema ? (linha[mapa.tema] || '').trim() : '';

      if (!tituloBruto) {
        invalidas.push({ linha: numeroLinha, motivo: 'título ausente', bruto: linha });
        return;
      }
      if (!temaBruto) {
        invalidas.push({ linha: numeroLinha, motivo: 'tema ausente', bruto: linha });
        return;
      }

      const temaCanonico = taxo.resolverTema(temaBruto);
      if (!temaCanonico) {
        invalidas.push({
          linha: numeroLinha,
          motivo: `tema "${temaBruto}" não corresponde à taxonomia`,
          bruto: linha,
        });
        return;
      }

      const subtemas = [];
      for (const subtemaBruto of mapa.subtemas ? dividirSubtemas(linha[mapa.subtemas]) : []) {
        const canonico = taxo.resolverSubtema(temaCanonico, subtemaBruto);
        if (canonico) subtemas.push(canonico);
      }

      producoes.push({
        titulo: tituloBruto,
        doi: mapa.doi ? (linha[mapa.doi] || '').trim() || undefined : undefined,
        tema: temaCanonico,
        subtemas,
        ano: mapa.ano ? (linha[mapa.ano] || '').trim() || undefined : undefined,
        instituicao: mapa.instituicao ? (linha[mapa.instituicao] || '').trim() || undefined : undefined,
        tipo: mapa.tipo ? Obs.tipos.resolverTipo(linha[mapa.tipo]) || undefined : undefined,
      });
    });

    return {
      producoes,
      invalidas,
      colunasIgnoradas: ignoradas,
      temAno: Boolean(mapa.ano),
      temInstituicao: Boolean(mapa.instituicao),
      temTipo: Boolean(mapa.tipo),
    };
  }

  async function carregarTudo(caminhos, taxo) {
    const producoes = [];
    const invalidas = [];
    const colunasIgnoradas = new Set();
    let temAno = false;
    let temInstituicao = false;
    let temTipo = false;

    for (const caminho of caminhos) {
      const texto = await Obs.csv.buscarTexto(caminho);
      const linhas = Obs.csv.parseCsv(texto);
      const resultado = carregarLinhas(linhas, taxo);
      producoes.push(...resultado.producoes);
      invalidas.push(...resultado.invalidas);
      resultado.colunasIgnoradas.forEach((c) => colunasIgnoradas.add(c));
      temAno = temAno || resultado.temAno;
      temInstituicao = temInstituicao || resultado.temInstituicao;
      temTipo = temTipo || resultado.temTipo;
    }

    if (invalidas.length > 0) {
      console.warn(
        `[producoes] ${invalidas.length} linha(s) ignorada(s) por não corresponder à taxonomia:`,
        invalidas,
      );
    }

    return {
      producoes,
      invalidas,
      colunasIgnoradas: [...colunasIgnoradas],
      camposDisponiveis: { ano: temAno, instituicao: temInstituicao, tipo: temTipo },
    };
  }

  return { carregarTudo };
})();
