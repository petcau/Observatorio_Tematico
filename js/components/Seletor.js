// Grupo de botões segmentado (uma opção ativa por vez).
function Seletor({ opcoes, valor, aoMudar, rotulo }) {
  return (
    <div role="group" aria-label={rotulo} className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={valor === o.valor}
          onClick={() => aoMudar(o.valor)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            valor === o.valor ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
