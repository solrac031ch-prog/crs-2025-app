from __future__ import annotations

import json
from pathlib import Path

import fitz

ROOT = Path('.')
FORM_DIR = ROOT / 'form-docs'
TARGETS = [
    'examenes-hph.pdf',
    'examenes-hph-editable.pdf',
    'examenes-hph-rellenable.pdf',
    'transfusion.pdf',
    'transfusion-editable.pdf',
    'transfusion-rellenable.pdf',
    'ley-urgencia-activacion-rellenable.pdf',
    'ley-urgencia-consentimiento-rellenable.pdf',
    'medicamentos-uso-ocasional-rellenable.pdf',
]


def nearby_words(page: fitz.Page, rect: fitz.Rect, pad: float = 32.0):
    area = fitz.Rect(rect.x0 - pad, rect.y0 - pad, rect.x1 + pad, rect.y1 + pad)
    result = []
    for word in page.get_text('words'):
        wrect = fitz.Rect(word[:4])
        if area.intersects(wrect):
            result.append({
                'text': word[4],
                'rect': [round(v, 2) for v in word[:4]],
            })
    return result[:40]


def nearby_drawings(page: fitz.Page, rect: fitz.Rect, pad: float = 24.0):
    area = fitz.Rect(rect.x0 - pad, rect.y0 - pad, rect.x1 + pad, rect.y1 + pad)
    result = []
    for drawing in page.get_drawings():
        drect = fitz.Rect(drawing.get('rect', (0, 0, 0, 0)))
        if area.intersects(drect):
            result.append({
                'rect': [round(drect.x0, 2), round(drect.y0, 2), round(drect.x1, 2), round(drect.y1, 2)],
                'width': round(float(drawing.get('width') or 0), 2),
                'items': [str(item[0]) for item in drawing.get('items', [])[:8]],
            })
    return result[:30]


report = {'files': [], 'available_pdfs': sorted(p.name for p in FORM_DIR.glob('*.pdf'))}

for name in TARGETS:
    path = FORM_DIR / name
    entry = {'file': name, 'exists': path.exists(), 'pages': []}
    report['files'].append(entry)
    if not path.exists():
        continue

    doc = fitz.open(path)
    for page_index, page in enumerate(doc):
        page_info = {
            'page': page_index + 1,
            'size': [round(page.rect.width, 2), round(page.rect.height, 2)],
            'widgets': [],
        }
        widgets = list(page.widgets() or [])
        for widget in widgets:
            rect = fitz.Rect(widget.rect)
            page_info['widgets'].append({
                'name': widget.field_name,
                'type': widget.field_type_string,
                'value': widget.field_value,
                'rect': [round(rect.x0, 2), round(rect.y0, 2), round(rect.x1, 2), round(rect.y1, 2)],
                'width': round(rect.width, 2),
                'height': round(rect.height, 2),
                'font': widget.text_font,
                'font_size': widget.text_fontsize,
                'nearby_words': nearby_words(page, rect),
                'nearby_drawings': nearby_drawings(page, rect),
            })
        entry['pages'].append(page_info)
    doc.close()

Path('pdf-form-layout-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')

lines = ['# Inspección geométrica de PDFs rellenables', '']
lines.append('PDF disponibles en `form-docs`: ' + ', '.join(report['available_pdfs']))
lines.append('')
for item in report['files']:
    lines.append(f"## {item['file']}")
    if not item['exists']:
        lines.append('- No existe en la rama.')
        lines.append('')
        continue
    count = sum(len(p['widgets']) for p in item['pages'])
    lines.append(f'- Campos detectados: {count}')
    for page in item['pages']:
        lines.append(f"- Página {page['page']}: {page['size'][0]} x {page['size'][1]} pt")
        for w in page['widgets']:
            words = ' '.join(x['text'] for x in w['nearby_words'][:12])
            lines.append(f"  - `{w['name']}` ({w['type']}): rect={w['rect']} tamaño={w['width']}x{w['height']} fuente={w['font']} {w['font_size']} | cerca: {words}")
    lines.append('')
Path('pdf-form-layout-report.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('Reporte geométrico generado.')
