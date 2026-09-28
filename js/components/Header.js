function Header() {
  const { nomeObservatorio, nomeEixo } = OBS_CONFIG;
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6">
        <p className="text-sm font-medium" style={{ color: '#1B5FBF' }}>
          {nomeObservatorio}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Eixo Temático: {nomeEixo}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Distribuição das produções científicas e técnicas do eixo Energia,
          organizadas por tema e subtema.
        </p>
      </div>
    </header>
  );
}
