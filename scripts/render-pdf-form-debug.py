from pathlib import Path

import fitz

FORM_DIR = Path('form-docs')
OUT = Path('pdf-debug-renders')
OUT.mkdir(exist_ok=True)
TARGETS = [
    'examenes-hph-editable.pdf',
    'examenes-hph-rellenable.pdf',
    'transfusion-editable.pdf',
    'transfusion-rellenable.pdf',
    'ley-urgencia-activacion-rellenable.pdf',
    'ley-urgencia-consentimiento-rellenable.pdf',
    'medicamentos-uso-ocasional-rellenable.pdf',
]

for name in TARGETS:
    doc = fitz.open(FORM_DIR / name)
    for page_index, page in enumerate(doc):
        widgets = list(page.widgets() or [])
        if not widgets and page_index > 0:
            continue
        shape = page.new_shape()
        for widget in widgets:
            rect = fitz.Rect(widget.rect)
            shape.draw_rect(rect)
            label = str(widget.field_name or '')[:26]
            y = max(8, rect.y0 - 2)
            shape.insert_text((rect.x0, y), label, fontsize=max(5, min(9, rect.height * 0.35)), color=(0.85, 0.05, 0.05))
        shape.finish(color=(0.9, 0.05, 0.05), width=max(0.6, page.rect.width / 1000))
        shape.commit()
        matrix = fitz.Matrix(1.5, 1.5) if page.rect.width <= 700 else fitz.Matrix(0.55, 0.55)
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        pix.save(OUT / f'{Path(name).stem}-p{page_index + 1}.png')
    doc.close()
print('Renders diagnósticos generados.')
