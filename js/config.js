// Configuração do dashboard — edite aqui quando o CSV de produções mudar de
// nome, quando chegarem mais arquivos, ou quando quiser atualizar o texto do
// rodapé. Nenhuma outra parte do código precisa mudar.
window.OBS_CONFIG = {
  nomeObservatorio: 'Observatório de CT&I da Bahia',
  nomeEixo: 'Energia',
  textoAtualizacao: 'Dados atualizados em setembro de 2026',
  arquivoTaxonomia: 'dados/temas.csv',
  arquivosProducoes: ['dados/production_themes_ai.csv'],
  // Endereço do site que serve as fotos. A coluna imagem_pesquisador do CSV traz só o
  // caminho (ex.: /researcher/image?researcher_id=...), que é somado a este endereço.
  // Vazio = sem foto (o painel mostra as iniciais do pesquisador).
  urlBaseImagensPesquisadores: 'https://observatoriocti.secti.ba.gov.br/simcc/api',
};
