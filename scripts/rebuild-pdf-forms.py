from __future__ import annotations

from pathlib import Path
import os

import cv2
import fitz
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FORMS = ROOT / "form-docs"
DPI = 60
SCALE = DPI / 72


def pxrect(x0: float, y0: float, x1: float, y1: float) -> fitz.Rect:
    return fitz.Rect(x0 / SCALE, y0 / SCALE, x1 / SCALE, y1 / SCALE)


def add_text(page: fitz.Page, name: str, rect: fitz.Rect, font_size: float = 24, multiline: bool = False) -> None:
    widget = fitz.Widget()
    widget.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    widget.field_name = name
    widget.field_label = name.replace("_", " ")
    widget.field_value = ""
    widget.rect = rect
    widget.text_font = "Helv"
    widget.text_fontsize = font_size
    widget.text_color = (0, 0, 0)
    widget.field_flags = fitz.PDF_TX_FIELD_IS_MULTILINE if multiline else 0
    widget.border_width = 0
    widget.fill_color = None
    page.add_widget(widget)


def add_check(page: fitz.Page, name: str, rect: fitz.Rect) -> None:
    widget = fitz.Widget()
    widget.field_type = fitz.PDF_WIDGET_TYPE_CHECKBOX
    widget.field_name = name
    widget.field_label = name.replace("_", " ")
    widget.field_value = "Off"
    widget.rect = rect
    widget.border_width = 0
    widget.fill_color = None
    widget.text_color = (0, 0, 0)
    page.add_widget(widget)


def save_atomic(doc: fitz.Document, target: Path) -> None:
    temp = target.with_suffix(".tmp.pdf")
    doc.save(temp, garbage=4, deflate=True)
    doc.close()
    os.replace(temp, target)


def page_gray_at_60dpi(page: fitz.Page) -> np.ndarray:
    pix = page.get_pixmap(matrix=fitz.Matrix(SCALE, SCALE), colorspace=fitz.csGRAY, alpha=False)
    array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
    return array[:, :, 0] if pix.n > 1 else array.reshape(pix.height, pix.width)


def rebuild_exams() -> None:
    source = FORMS / "examenes-hph.pdf"
    target = FORMS / "examenes-hph-rellenable.pdf"
    doc = fitz.open(source)
    page = doc[0]

    fields = {
        "fecha": (1185, 182, 1498, 210),
        "nombre": (205, 225, 1495, 256),
        "edad": (160, 278, 440, 306),
        "fecha_nacimiento": (535, 278, 810, 306),
        "rut": (875, 278, 1128, 306),
        "ficha": (1218, 278, 1495, 306),
        "servicio": (230, 323, 805, 351),
        "fono": (910, 323, 1125, 351),
        "prevision": (1320, 323, 1495, 351),
        "direccion": (245, 368, 820, 396),
        "villa_poblacion": (850, 368, 1125, 396),
        "comuna": (1188, 368, 1495, 396),
        "diagnostico": (245, 412, 822, 440),
        "otros_quimicos": (90, 1392, 820, 1424),
        "tipo_muestra_micro": (245, 1538, 790, 1567),
        "zona_cuerpo": (248, 1585, 792, 1614),
        "tipo_muestra_final": (88, 2020, 820, 2050),
        "otros_microbiologicos": (875, 2060, 1492, 2092),
        "medico_timbre": (480, 2162, 1192, 2194),
    }
    for name, box in fields.items():
        add_text(page, name, pxrect(*box), 24)

    gray = page_gray_at_60dpi(page)
    _, threshold = cv2.threshold(gray, 235, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(threshold, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    columns = [88, 445, 817, 1150]
    candidates: dict[int, list[tuple[int, int, int, int, float]]] = {column: [] for column in columns}

    for contour in contours:
        x, y, width, height = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        if not (30 <= width <= 55 and 15 <= height <= 35 and 480 <= y <= 2050):
            continue
        column = min(columns, key=lambda item: abs(item - x))
        if abs(column - x) < 25:
            candidates[column].append((x, y, width, height, area))

    for column in columns:
        chosen: list[tuple[int, int, int, int, float]] = []
        for row in sorted(candidates[column], key=lambda item: -item[4]):
            center_x = row[0] + row[2] / 2
            center_y = row[1] + row[3] / 2
            duplicate = any(
                abs(center_x - (other[0] + other[2] / 2)) < 5
                and abs(center_y - (other[1] + other[3] / 2)) < 5
                for other in chosen
            )
            if not duplicate:
                chosen.append(row)
        candidates[column] = sorted(chosen, key=lambda item: item[1])

    sections = [
        ("quim_sangre", 88, 500, 1400, 35),
        ("micro_izq", 88, 1650, 2020, 13),
        ("quim_orina", 445, 500, 970, 18),
        ("serologia", 445, 1000, 1120, 3),
        ("farmacos", 445, 1150, 1340, 6),
        ("micro_centro_izq", 445, 1650, 1950, 10),
        ("hematologia", 817, 500, 850, 12),
        ("hormonas", 817, 900, 1350, 16),
        ("micro_centro_der", 817, 1650, 1830, 6),
        ("inmunologia", 1150, 500, 900, 15),
        ("citoquimicos", 1150, 930, 1120, 6),
        ("perfil_gases_elp", 1150, 1180, 1260, 1),
        ("micro_der", 1150, 1650, 1830, 6),
        ("fecales", 1150, 1840, 1920, 2),
    ]

    for section, column, y_min, y_max, expected in sections:
        rows = [
            item
            for item in candidates[column]
            if y_min <= item[1] + item[3] / 2 <= y_max
        ]
        if len(rows) != expected:
            raise RuntimeError(f"{section}: se detectaron {len(rows)} casillas y se esperaban {expected}")
        for index, (x, y, width, height, _) in enumerate(rows, 1):
            rect = pxrect(x + 4, y + 3, x + width - 4, y + height - 3)
            name = section if expected == 1 else f"{section}_{index:02d}"
            add_check(page, name, rect)

    save_atomic(doc, target)


def rebuild_transfusion() -> None:
    source = FORMS / "transfusion.pdf"
    target = FORMS / "transfusion-rellenable.pdf"
    doc = fitz.open(source)
    page = doc[0]

    fields = {
        "etiqueta_umt": (140, 305, 500, 505, 18, True),
        "grupo_sanguineo_umt": (1060, 215, 1210, 320, 20, True),
        "fecha_hora": (960, 415, 1355, 458, 24, False),
        "apellido_paterno": (140, 532, 500, 582, 24, False),
        "apellido_materno": (505, 532, 850, 582, 24, False),
        "nombres": (855, 532, 1355, 582, 24, False),
        "servicio": (140, 660, 340, 692, 22, False),
        "sala_pabellon": (365, 657, 640, 692, 22, False),
        "cama": (665, 654, 832, 689, 22, False),
        "rut": (855, 650, 1038, 685, 22, False),
        "ficha": (1055, 642, 1210, 682, 22, False),
        "motivo": (140, 758, 830, 795, 22, False),
        "sexo": (855, 752, 940, 786, 22, False),
        "edad": (955, 750, 1038, 784, 22, False),
        "peso": (1055, 747, 1148, 782, 22, False),
        "diagnostico": (140, 846, 1355, 894, 22, False),
        "hto": (142, 964, 244, 990, 18, False),
        "hb": (360, 961, 512, 988, 18, False),
        "recuento_pq": (662, 957, 832, 984, 18, False),
        "tp": (938, 954, 1004, 980, 18, False),
        "inr": (1045, 952, 1112, 978, 18, False),
        "ttpk": (1146, 950, 1206, 976, 18, False),
        "fibrinogeno": (1270, 948, 1330, 975, 18, False),
        "globulos_rojos_cantidad": (363, 1095, 510, 1118, 18, False),
        "plasma_fresco_cantidad": (363, 1194, 510, 1216, 18, False),
        "plaquetas_cantidad": (363, 1249, 510, 1272, 18, False),
        "crioprecipitado_cantidad": (363, 1331, 510, 1354, 18, False),
        "transfusiones_previas": (522, 1691, 650, 1722, 18, False),
        "tipo_reaccion": (1160, 1688, 1365, 1722, 18, False),
        "medico_solicitante": (135, 1792, 850, 1825, 20, False),
        "firma_codigo": (960, 1792, 1365, 1822, 20, False),
        "responsable_toma_muestra": (135, 1885, 850, 1918, 20, False),
        "firma": (960, 1925, 1365, 1952, 20, False),
    }
    for name, (x0, y0, x1, y1, font_size, multiline) in fields.items():
        add_text(page, name, pxrect(x0, y0, x1, y1), font_size, multiline)

    checks = {
        "caracter_inmediata": (856, 1187, 1017, 1211),
        "caracter_urgente": (856, 1242, 1017, 1266),
        "caracter_no_urgente": (856, 1325, 1017, 1349),
        "caracter_electiva": (856, 1389, 1017, 1413),
        "filtrados": (251, 1432, 345, 1455),
        "irradiados": (251, 1464, 345, 1487),
        "exanguineo_transfusion": (251, 1496, 345, 1519),
        "sangria_terapeutica": (250, 1527, 345, 1551),
        "intradialisis": (957, 1450, 1018, 1475),
        "reserva_pabellon_central": (957, 1482, 1018, 1507),
        "reserva_pabellon_ugcm": (957, 1514, 1018, 1539),
        "reacciones_si": (973, 1693, 1038, 1718),
        "reacciones_no": (1068, 1693, 1140, 1718),
    }
    for name, box in checks.items():
        add_check(page, name, pxrect(*box))

    save_atomic(doc, target)


def move_existing_fields(path: Path, positions: dict[str, tuple[float, float, float, float]]) -> None:
    doc = fitz.open(path)
    for page in doc:
        for widget in list(page.widgets() or []):
            target = positions.get(widget.field_name)
            if target is None:
                continue
            widget.rect = fitz.Rect(*target)
            widget.update()
    save_atomic(doc, path)


def polish_small_forms() -> None:
    move_existing_fields(
        FORMS / "medicamentos-uso-ocasional-rellenable.pdf",
        {
            "vb_jefe_cr": (323, 579, 410, 593),
            "fecha_jefe_cr": (412, 579, 500, 593),
            "vb_subdirector_administrativo": (315, 648, 410, 662),
            "fecha_subdirector": (412, 648, 500, 662),
        },
    )
    move_existing_fields(
        FORMS / "ley-urgencia-activacion-rellenable.pdf",
        {
            "fecha_nacimiento": (184, 352, 480, 366),
            "comuna_paciente": (125, 374, 480, 388),
            "direccion_paciente": (125, 396, 480, 410),
            "region_paciente": (125, 458, 260, 472),
            "fono_paciente": (116, 482, 260, 496),
        },
    )


def validate() -> None:
    expected_counts = {
        "examenes-hph-rellenable.pdf": 168,
        "transfusion-rellenable.pdf": 46,
        "ley-urgencia-activacion-rellenable.pdf": 36,
        "medicamentos-uso-ocasional-rellenable.pdf": 18,
    }
    for filename, expected in expected_counts.items():
        doc = fitz.open(FORMS / filename)
        widgets = [widget for page in doc for widget in list(page.widgets() or [])]
        names = [widget.field_name for widget in widgets]
        if len(widgets) != expected:
            raise RuntimeError(f"{filename}: {len(widgets)} campos, se esperaban {expected}")
        if len(names) != len(set(names)):
            raise RuntimeError(f"{filename}: hay nombres de campo duplicados")
        for page in doc:
            for widget in list(page.widgets() or []):
                if not page.rect.contains(widget.rect):
                    raise RuntimeError(f"{filename}: {widget.field_name} queda fuera de la pagina")
        doc.close()


if __name__ == "__main__":
    rebuild_exams()
    rebuild_transfusion()
    polish_small_forms()
    validate()
    print("PDF rellenables reconstruidos y validados.")
