(() => {
  const LEGACY_STORAGE_KEYS = ["crsPatientCasesBackupV1", "crsPriorityCases"];

  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  }

  window.CRS_PATIENT_PRIVACY_BOOTSTRAP = true;
})();
