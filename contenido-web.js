(() => {
  // Fuente publica de Noticias, Educacion, Paper del mes y Procedimientos.
  // Todo lo que este aqui queda versionado junto a la web y se ve desde cualquier navegador.
  // Los campos aceptados son: id, title, description, url, eventUrl, month, category, createdAt.
  window.CRS_STATIC_CONTENT = {
    news: [],
    education: [
      {
        id: "educacion-youtube-hph",
        title: "Canal de YouTube Hospital Padre Hurtado",
        description: "Material audiovisual institucional disponible para el equipo.",
        url: "https://youtube.com/@hospitalpadrehurtado9819?si=oDPWrfC0hXeBHHZs",
        category: "Canal",
        createdAt: "2026-05-20T00:00:00.000Z"
      },
      {
        id: "educacion-podcast-hph",
        title: "Podcast Hospital Padre Hurtado",
        description: "Episodios y contenido de audio para educacion medica.",
        url: "https://open.spotify.com/show/4Yyb5LH2H6mj9NyDVajUMQ?si=LHra3q1PQl2s1-JQ8NysNg",
        category: "Podcast",
        createdAt: "2026-05-20T00:00:00.000Z"
      }
    ],
    papers: [],
    procedures: []
  };
})();
