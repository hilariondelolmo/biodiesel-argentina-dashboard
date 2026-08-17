#!/usr/bin/env python3
"""Spec combinada para el documento único "Fundamentos + Respaldo en datos".

Junta:
  - el docx "2026.08.17 Fundamentos jurídicos modificaciones propuestas.docx"
    (intro: Objeto y método / Marco normativo / Cuadro de correspondencia,
    y por artículo: Normas violadas + Justificación de la modificación), y
  - los popups "Respaldo en datos" del HTML generado del sitio
    (via exportar_respaldo_spec, con cifras, gráficos, imágenes y tablas).

Uso:  python3 scripts/exportar_dossier_spec.py > dossier.json
"""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exportar_respaldo_spec import MiniDom, bloques_de_popup  # noqa: E402

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
CARPETA = ('/Users/hilariondelolmo/Desktop/01. Notas, articulos/Ley Ejecutivo/'
           'Finales/Propuestas Secretaria de Energia/Ultima Version/')
DOCX_FUND = CARPETA + '2026.08.17 Fundamentos jurídicos modificaciones propuestas.docx'
HTML = Path(__file__).resolve().parent.parent / 'src/content/propuesta-s80926pl.html'

# Misma regla que el sitio: guion simple, nunca rayas; y correcciones HDO
def limpiar(t):
    return t.replace('—', '-').replace('–', '-').replace(
        'USD 1.979 millones', 'USD 2.040 millones')


def runs_docx(par):
    """[(texto, negrita)] de un párrafo Word, colapsando corridas iguales."""
    runs = []
    for r in par.findall(W + 'r'):
        t = ''.join(x.text or '' for x in r.iter(W + 't'))
        if not t:
            continue
        rpr = r.find(W + 'rPr')
        b = rpr is not None and rpr.find(W + 'b') is not None and \
            (rpr.find(W + 'b').get(W + 'val') not in ('0', 'false', 'none'))
        if runs and runs[-1][1] == b:
            runs[-1][0] += t
        else:
            runs.append([t, b])
    return [[limpiar(re.sub(r'\s+', ' ', t)), b] for t, b in runs if t.strip()]


def sin_lead(runs, lead):
    """Quita el rótulo inicial ('Normas violadas.') consumiendo runs."""
    vivo = ''.join(t for t, _ in runs)
    if not vivo.lstrip().startswith(lead):
        return runs
    corte = vivo.index(lead) + len(lead)
    while corte < len(vivo) and vivo[corte] == ' ':
        corte += 1
    out, pos = [], 0
    for t, b in runs:
        ini, pos = pos, pos + len(t)
        if pos <= corte:
            continue
        out.append([t[max(corte - ini, 0):], b])
    return out


def tabla_docx(tbl):
    filas = []
    for i, tr in enumerate(tbl.findall(W + 'tr')):
        celdas = []
        for tc in tr.findall(W + 'tc'):
            texto = '\n'.join(
                limpiar(re.sub(r'\s+', ' ', ''.join(x.text or '' for x in p.iter(W + 't')).strip()))
                for p in tc.findall(W + 'p')
                if ''.join(x.text or '' for x in p.iter(W + 't')).strip())
            celdas.append({'texto': texto, 'encabezado': i == 0, 'rowspan': 1})
        if celdas:
            filas.append(celdas)
    return filas


def parsear_fundamentos():
    z = zipfile.ZipFile(DOCX_FUND)
    body = ET.fromstring(z.read('word/document.xml')).find(W + 'body')
    intro = {'objeto': [], 'marco': [], 'cuadro': None}
    articulos = {}
    seccion = None
    art = None
    for el in body:
        if el.tag == W + 'tbl':
            if seccion == 'cuadro':
                intro['cuadro'] = tabla_docx(el)
            continue
        if el.tag != W + 'p':
            continue
        ppr = el.find(W + 'pPr')
        style = ''
        if ppr is not None:
            ps = ppr.find(W + 'pStyle')
            style = ps.get(W + 'val') if ps is not None else ''
        txt = limpiar(''.join(x.text or '' for x in el.iter(W + 't')).strip())
        if not txt:
            continue
        # Heading2 real = título de sección/artículo corto; el docx trae dos
        # párrafos de Objeto y método con estilo Heading2 por un quirk
        if style == 'Heading2' and len(txt) < 90:
            m = re.match(r'Art[ií]culo\s+(\d+)', txt)
            if m:
                art = int(m.group(1))
                seccion = 'articulo'
                articulos[art] = {'titulo': txt.replace('- ', ' · ', 1),
                                  'normas': [], 'just': []}
            elif txt.startswith('Objeto'):
                seccion, art = 'objeto', None
            elif txt.startswith('Marco'):
                seccion, art = 'marco', None
            elif txt.startswith('Cuadro'):
                seccion, art = 'cuadro', None
            else:
                seccion, art = None, None
            continue
        if style == 'Heading1':
            continue
        runs = runs_docx(el)
        if not runs:
            continue
        if seccion == 'articulo':
            vivo = ''.join(t for t, _ in runs)
            if vivo.lstrip().startswith('Justificación de la modificación'):
                articulos[art]['just'].append(
                    sin_lead(runs, 'Justificación de la modificación.'))
            elif vivo.lstrip().startswith('Normas violadas'):
                articulos[art]['normas'].append(sin_lead(runs, 'Normas violadas.'))
            elif articulos[art]['just']:
                articulos[art]['just'].append(runs)
            else:
                articulos[art]['normas'].append(runs)
        elif seccion in ('objeto', 'marco'):
            intro[seccion].append(runs)
    return intro, articulos


def main():
    intro, fund = parsear_fundamentos()

    dom = MiniDom()
    dom.feed(HTML.read_text())
    pops = {int(n.attrs['data-art']): n for n in dom.raiz.buscar(
        lambda n: 'pl-pop' in n.clase() and n.attrs.get('data-tipo') == 'hechos'
        and n.attrs.get('data-art', '').isdigit())}

    arts = []
    for nro in sorted(fund):
        if nro not in pops:
            sys.exit(f'ERROR: artículo {nro} sin popup de respaldo')
        arts.append({
            'nro': nro,
            'titulo': fund[nro]['titulo'],
            'normas': fund[nro]['normas'],
            'just': fund[nro]['just'],
            'respaldo': bloques_de_popup(pops[nro]),
        })
    json.dump({'intro': intro, 'articulos': arts}, sys.stdout,
              ensure_ascii=False, indent=1)
    print(f"\n{len(arts)} artículos · intro: objeto {len(intro['objeto'])}p, "
          f"marco {len(intro['marco'])}p, cuadro "
          f"{len(intro['cuadro'] or [])} filas", file=sys.stderr)


if __name__ == '__main__':
    main()
