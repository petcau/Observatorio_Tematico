// Loader schema-driven dos CSVs de produções listados em OBS_CONFIG.arquivosProducoes.
// Aceita variações de nome de coluna (aliases) e casa tema/subtema contra a
// taxonomia carregada em taxonomia.js. Quando o CSV definitivo chegar, basta
// atualizar a lista de arquivos em config.js — nada aqui precisa mudar.
window.Obs = window.Obs || {};

Obs.producoes = (function () {
  const ALIASES = {
    titulo: ['titulo', 'título', 'nome_artigo', 'nome do artigo', 'nome_producao', 'nome da produção'],
    doi: ['doi'],
    tema: ['tema', 'tema_principal', 'tema principal'],
    subtemas: ['subtema', 'subtemas'],
    ano: ['ano', 'periodo', 'período'],
    instituicao: [
      'instituicao',
      'instituição',
      'autor',
      'autores',
      'instituicao/autor',
      'nome_instituicao',
    ],
    tipo: ['tipo', 'tipo_producao', 'tipo de produção', 'tipo de producao', 'categoria'],
    pesquisador: ['pesquisador', 'nome_pesquisador', 'nome do pesquisador'],
    idPesquisador: ['id_pesquisador'],
    classificacaoPesquisador: [
      'classificacao_pesquisador',
      'classificação_pesquisador',
      'classificacao do pesquisador',
    ],
    qualis: ['qualis'],
    jcr: ['jcr'],
    hIndex: ['h_index', 'h-index', 'hindex'],
    i10Index: ['i10_index', 'i10-index', 'i10index'],
    modalidade: ['modality_name', 'modalidade'],
    imagemPesquisador: ['imagem_pesquisador', 'foto_pesquisador'],
    codigoModalidade: ['modality_code', 'codigo_modalidade'],
    nivelModalidade: ['category_level_code', 'nivel_modalidade'],
  };

  // Corrige texto UTF-8 que foi gravado como Latin-1 (ex.: "ExtensÃ£o" → "Extensão").
  // Só age quando a sequência decodifica de forma válida; caso contrário mantém o original.
  function repararCodificacao(texto) {
    if (!/[ÃÂ]/.test(texto)) return texto;
    try {
      return decodeURIComponent(escape(texto));
    } catch (e) {
      return texto;
    }
  }

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

  function campoOpcional(linha, mapa, campo) {
    const valor = mapa[campo] ? (linha[mapa[campo]] || '').trim() : '';
    return valor ? repararCodificacao(valor) : undefined;
  }

  function numeroOpcional(linha, mapa, campo) {
    const valor = campoOpcional(linha, mapa, campo);
    if (valor === undefined) return undefined;
    const numero = Number(valor.replace(',', '.'));
    return Number.isFinite(numero) ? numero : undefined;
  }

  function carregarLinhas(linhas, taxo) {
    const producoes = [];
    const invalidas = [];
    if (linhas.length === 0) {
      return { producoes, invalidas, colunasIgnoradas: [] };
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
        doi: campoOpcional(linha, mapa, 'doi'),
        tema: temaCanonico,
        subtemas,
        ano: campoOpcional(linha, mapa, 'ano'),
        instituicao: campoOpcional(linha, mapa, 'instituicao'),
        tipo: mapa.tipo ? Obs.tipos.resolverTipo(linha[mapa.tipo]) || undefined : undefined,
        pesquisador: campoOpcional(linha, mapa, 'pesquisador'),
        idPesquisador: campoOpcional(linha, mapa, 'idPesquisador'),
        classificacaoPesquisador: campoOpcional(linha, mapa, 'classificacaoPesquisador'),
        qualis: campoOpcional(linha, mapa, 'qualis'),
        jcr: numeroOpcional(linha, mapa, 'jcr'),
        hIndex: numeroOpcional(linha, mapa, 'hIndex'),
        i10Index: numeroOpcional(linha, mapa, 'i10Index'),
        modalidade: campoOpcional(linha, mapa, 'modalidade'),
        imagemPesquisador: campoOpcional(linha, mapa, 'imagemPesquisador'),
        codigoModalidade: campoOpcional(linha, mapa, 'codigoModalidade'),
        nivelModalidade: campoOpcional(linha, mapa, 'nivelModalidade'),
      });
    });

    return { producoes, invalidas, colunasIgnoradas: ignoradas };
  }

  async function carregarTudo(caminhos, taxo) {
    const producoes = [];
    const invalidas = [];
    const colunasIgnoradas = new Set();

    for (const caminho of caminhos) {
      const texto = await Obs.csv.buscarTexto(caminho);
      const linhas = Obs.csv.parseCsv(texto);
      const resultado = carregarLinhas(linhas, taxo);
      producoes.push(...resultado.producoes);
      invalidas.push(...resultado.invalidas);
      resultado.colunasIgnoradas.forEach((c) => colunasIgnoradas.add(c));
    }

    if (invalidas.length > 0) {
      console.warn(
        `[producoes] ${invalidas.length} linha(s) ignorada(s) por não corresponder à taxonomia:`,
        invalidas,
      );
    }

    return { producoes, invalidas, colunasIgnoradas: [...colunasIgnoradas] };
  }

  return { carregarTudo };
})();
