(() => {
  if (window.CRS_SPECIALTY_SEARCH_SAFE) return;

  const cleanSearch = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = (value) => cleanSearch(value).split(" ").filter(Boolean);

  function phraseMatch(text, phrase) {
    const haystack = ` ${cleanSearch(text)} `;
    const needle = ` ${cleanSearch(phrase)} `;
    return Boolean(cleanSearch(phrase)) && haystack.includes(needle);
  }

  function prefixTokensMatch(text, query) {
    const haystackWords = words(text);
    const queryWords = words(query);
    if (!queryWords.length) return false;
    return queryWords.every((token) => token.length >= 2 && haystackWords.some((word) => word.startsWith(token)));
  }

  function scoreProtocol(protocol, query) {
    const q = cleanSearch(query);
    if (!q) return 1;

    const title = cleanSearch(displayTitle(protocol.title || ""));
    const rawTitle = cleanSearch(protocol.title || "");
    const tags = (protocol.tags || []).map(cleanSearch).filter(Boolean);
    const haystack = cleanSearch(protocolHaystack(protocol));
    const qWords = words(q);

    if (title === q || rawTitle === q) return 1200;
    if (tags.includes(q)) return 1100;

    if (qWords.length === 1) {
      const token = qWords[0];
      if (token.length >= 2 && words(title).some((word) => word.startsWith(token))) return 1000;
      if (token.length >= 2 && tags.some((tag) => words(tag).some((word) => word.startsWith(token)))) return 900;
    }

    if (prefixTokensMatch(title, q)) return 850;
    if (tags.some((tag) => prefixTokensMatch(tag, q))) return 800;
    if (phraseMatch(haystack, q)) return 600;
    if (qWords.every((token) => token.length >= 2 && words(haystack).some((word) => word.startsWith(token)))) return 400;

    return 0;
  }

  const previousFilteredProtocols = filteredProtocols;

  filteredProtocols = function safeFilteredProtocols() {
    const q = cleanSearch(state.query);
    if (!q) return previousFilteredProtocols();

    return protocols
      .map((protocol, index) => ({ protocol, index, score: scoreProtocol(protocol, q) }))
      .filter(({ protocol, score }) => {
        const categoryMatch = state.category === "Todos" || protocol.category === state.category;
        return score > 0 && categoryMatch && isShiftMatch(protocol);
      })
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(({ protocol }) => protocol);
  };

  window.CRS_SPECIALTY_SEARCH_SAFE = Object.freeze({
    score: scoreProtocol,
    version: 1
  });
})();
