(() => {
  const protocols = window.CRS_PROTOCOLS;
  if (!Array.isArray(protocols)) return;

  protocols.forEach((protocol) => {
    protocol.hidePriority = true;
  });
})();
