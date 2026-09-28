function Header() {
  const { nomeObservatorio, nomeEixo } = OBS_CONFIG;
  return (
    <header className="border-b border-slate-200 bg-[#f2f7fb]">
      <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <a
            href="./"
            aria-label="Observatório de CT&I da Bahia — voltar para a página inicial"
            className="shrink-0 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <img
              src="assets/logo.jpeg"
              alt="Logo do Observatório de CT&I da Bahia"
              className="h-16 w-16 object-contain sm:h-20 sm:w-20"
            />
          </a>
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: '#1B5FBF' }}>
              {nomeObservatorio}
            </p>
            <a
              href="./"
              aria-label="Voltar para a página inicial"
              className="mt-1 inline-block rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <h1 className="text-2xl font-bold text-slate-900 transition-colors hover:text-blue-800 sm:text-3xl">
                Eixo Temático: {nomeEixo}
              </h1>
            </a>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Distribuição das produções científicas e técnicas do eixo Energia,
              organizadas por tema e subtema.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
