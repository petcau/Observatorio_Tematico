// Taxonomia fixa de tipos de produção, agrupada em Produção Acadêmica e
// Produção Técnica. Cada tipo aceita variações de escrita (aliases) vindas
// do CSV, resolvidas para o nome canônico listado aqui.
window.Obs = window.Obs || {};

Obs.tipos = (function () {
  const CATEGORIAS = [
    {
      categoria: 'Produção Acadêmica',
      tipos: [
        { nome: 'Artigos', aliases: ['artigo', 'artigos', 'artigo cientifico', 'paper', 'papers'] },
        { nome: 'Livros', aliases: ['livro', 'livros', 'book'] },
        {
          nome: 'Cap. Livros',
          aliases: [
            'capitulo de livro',
            'capitulos de livro',
            'cap. livro',
            'cap livro',
            'book chapter',
          ],
        },
        {
          nome: 'Resumos',
          aliases: ['resumo', 'resumos', 'resumo expandido', 'resumo publicado'],
        },
      ],
    },
    {
      categoria: 'Produção Técnica',
      tipos: [
        {
          nome: 'Relatório Técnico',
          aliases: ['relatorio tecnico', 'relatorio técnico', 'relatorio', 'technical report'],
        },
        {
          nome: 'Depósito de Patente',
          aliases: ['patente', 'deposito de patente', 'depósito de patente', 'patent'],
        },
        {
          nome: 'Programa de Computador',
          aliases: ['programa de computador', 'software', 'programa computador'],
        },
        {
          nome: 'Registro de Marca',
          aliases: ['marca', 'registro de marca', 'registro marca', 'trademark'],
        },
      ],
    },
  ];

  function normalizar(txt) {
    return (txt || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
      .toLowerCase();
  }

  const mapaCanonico = new Map();
  for (const cat of CATEGORIAS) {
    for (const tipo of cat.tipos) {
      mapaCanonico.set(normalizar(tipo.nome), tipo.nome);
      for (const alias of tipo.aliases) mapaCanonico.set(normalizar(alias), tipo.nome);
    }
  }

  function resolverTipo(bruto) {
    return mapaCanonico.get(normalizar(bruto)) || null;
  }

  return { categorias: CATEGORIAS, resolverTipo };
})();
