function calcSemanaAtual(criadoEm) {
  if (!criadoEm) return 1;
  const inicio = new Date(criadoEm);
  const agora = new Date();
  const diffDias = Math.floor((agora - inicio) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(Math.ceil(diffDias / 7), 1), 12);
}
