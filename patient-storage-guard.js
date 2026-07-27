(() => {
  const BLOCKED_KEYS = new Set(["crsPatientCasesBackupV1", "crsPriorityCases"]);
  const marker = Symbol.for("crs.patientStorageGuard");
  const proto = window.Storage?.prototype;

  function purge(storage) {
    for (const key of BLOCKED_KEYS) {
      try { storage?.removeItem?.(key); } catch (_) {}
    }
  }

  purge(window.localStorage);

  if (!proto || proto[marker]) return;

  const originalSetItem = proto.setItem;
  Object.defineProperty(proto, marker, { value: true, configurable: false });
  Object.defineProperty(proto, "setItem", {
    configurable: true,
    writable: true,
    value(key, value) {
      if (this === window.localStorage && BLOCKED_KEYS.has(String(key))) {
        try { this.removeItem(String(key)); } catch (_) {}
        console.warn(`CRS bloqueó persistencia local sensible: ${String(key)}`);
        return;
      }
      return originalSetItem.call(this, key, value);
    }
  });
})();
