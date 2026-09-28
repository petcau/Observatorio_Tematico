window.Obs = window.Obs || {};

Obs.formato = (function () {
  function numero(n) {
    return n.toLocaleString('pt-BR');
  }

  function pct(parte, total) {
    if (!total) return '0%';
    return `${((parte / total) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  }

  function producoes(n) {
    return `${numero(n)} ${n === 1 ? 'produção' : 'produções'}`;
  }

  function compararAnos(a, b) {
    return String(a).localeCompare(String(b), 'pt-BR', { numeric: true });
  }

  // "2020–2026" quando os anos são consecutivos; senão "2022, 2025, 2026".
  function periodo(anos) {
    const ordenados = [...anos].sort(compararAnos);
    if (ordenados.length === 0) return '—';
    if (ordenados.length === 1) return String(ordenados[0]);
    const consecutivos = ordenados.every((a, i) => i === 0 || Number(a) === Number(ordenados[i - 1]) + 1);
    return consecutivos
      ? `${ordenados[0]}–${ordenados[ordenados.length - 1]}`
      : ordenados.join(', ');
  }

  return { numero, pct, producoes, compararAnos, periodo };
})();
