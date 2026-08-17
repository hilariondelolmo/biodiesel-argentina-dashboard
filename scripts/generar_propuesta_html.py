#!/usr/bin/env python3
"""Genera src/content/propuesta-s80926pl.html desde los docx del 11/08.

- Propuesta (control de cambios): texto final = orig + ins; los del se
  descartan. Las inserciones salen como <ins> (rojo subrayado vía CSS).
- Numeración automática de Word resuelta desde numbering.xml (incisos a., b., ...).
- Informe: intro (Objeto y método / Marco normativo / Cuadro) + popups
  "Normas violadas" y "Justificación" por artículo + Cierre.
"""
import re, sys, zipfile, html
import xml.etree.ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
CARPETA = ('/Users/hilariondelolmo/Desktop/01. Notas, articulos/Ley Ejecutivo/'
           'Finales/Propuestas Secretaria de Energia/Ultima Version/')
DOCX_PROP = CARPETA + '2026.08.11 Propuesta ley S80926PL SE_260729 cc HDO.docx'
DOCX_INF = CARPETA + 'Informe_fundamentos_modificaciones_S80926PL_11-08-2026.docx'
SALIDA = '/Users/hilariondelolmo/Explora_projects/Explorarg_Marketscan/src/content/propuesta-s80926pl.html'

ARTS_INFORME = [3, 5, 6, 10, 12, 13, 14, 15, 16, 17, 19, 20, 26, 28, 33, 36, 38, 39, 40, 41, 42]

# Overrides dictados por HDO: pisan el texto del informe docx en el popup
# indicado. Clave: (artículo, tipo) con tipo 'normas' | 'just'.
OVERRIDES = {}

# Artículos con modificaciones que no violan norma alguna: llevan solo la
# oblea de Justificación, con texto dictado por HDO (2026-08-10).
JUST_SOLO = {}

# Consistencia del Cuadro de correspondencia con las decisiones de HDO:
# filas reemplazadas (el informe v8 traía otra cosa) o agregadas (3 y 5 no
# figuraban). Columnas: Modificación · Norma comprometida · Efecto.
CUADRO_FILAS = {}


# ── numeración automática ──────────────────────────────────────────────
def roman(n):
    vals = [(1000,'m'),(900,'cm'),(500,'d'),(400,'cd'),(100,'c'),(90,'xc'),
            (50,'l'),(40,'xl'),(10,'x'),(9,'ix'),(5,'v'),(4,'iv'),(1,'i')]
    out = ''
    for v, s in vals:
        while n >= v:
            out += s; n -= v
    return out

def letra(n):
    out = ''
    while n > 0:
        n, r = divmod(n - 1, 26)
        out = chr(ord('a') + r) + out
    return out

def fmt_num(fmt, n):
    if fmt == 'decimal': return str(n)
    if fmt == 'lowerLetter': return letra(n)
    if fmt == 'upperLetter': return letra(n).upper()
    if fmt == 'lowerRoman': return roman(n)
    if fmt == 'upperRoman': return roman(n).upper()
    if fmt in ('bullet', 'none'): return ''
    return str(n)

class Numeracion:
    def __init__(self, z):
        self.defs = {}     # numId -> {ilvl: (start, fmt, lvlText)}
        self.contador = {} # (numId) -> {ilvl: n}
        try:
            xml = z.read('word/numbering.xml')
        except KeyError:
            return
        root = ET.fromstring(xml)
        abstractos = {}
        for a in root.findall(W + 'abstractNum'):
            aid = a.get(W + 'abstractNumId')
            lvls = {}
            for l in a.findall(W + 'lvl'):
                ilvl = int(l.get(W + 'ilvl'))
                start = l.find(W + 'start')
                nf = l.find(W + 'numFmt')
                lt = l.find(W + 'lvlText')
                lvls[ilvl] = (
                    int(start.get(W + 'val')) if start is not None else 1,
                    nf.get(W + 'val') if nf is not None else 'decimal',
                    lt.get(W + 'val') if lt is not None else '%1.',
                )
            abstractos[aid] = lvls
        for n in root.findall(W + 'num'):
            nid = n.get(W + 'numId')
            ref = n.find(W + 'abstractNumId')
            lvls = dict(abstractos.get(ref.get(W + 'val'), {})) if ref is not None else {}
            for ov in n.findall(W + 'lvlOverride'):
                ilvl = int(ov.get(W + 'ilvl'))
                so = ov.find(W + 'startOverride')
                if so is not None and ilvl in lvls:
                    s, f, t = lvls[ilvl]
                    lvls[ilvl] = (int(so.get(W + 'val')), f, t)
            self.defs[nid] = lvls

    def etiqueta(self, num_id, ilvl):
        lvls = self.defs.get(num_id)
        if not lvls or ilvl not in lvls:
            return ''
        cnt = self.contador.setdefault(num_id, {})
        cnt[ilvl] = cnt.get(ilvl, lvls[ilvl][0] - 1) + 1
        for deeper in [l for l in cnt if l > ilvl]:
            del cnt[deeper]
        start, fmt, texto = lvls[ilvl]
        if fmt in ('bullet', 'none'):
            return '·'
        out = texto
        for l in range(9):
            if f'%{l+1}' in out:
                n = cnt.get(l, lvls.get(l, (1,))[0])
                f_l = lvls.get(l, (1, 'decimal', ''))[1]
                out = out.replace(f'%{l+1}', fmt_num(f_l, n))
        return out


# ── extracción de párrafos/tablas ──────────────────────────────────────
def run_fmt(r):
    rpr = r.find(W + 'rPr')
    fmt = ''
    if rpr is not None:
        def on(tag):
            el = rpr.find(W + tag)
            if el is None: return False
            return el.get(W + 'val') not in ('0', 'false', 'none')
        if on('b'): fmt += 'b'
        if on('i'): fmt += 'i'
    return fmt

def run_text(r):
    parts = []
    for node in r.iter():
        if node.tag in (W + 't', W + 'delText'):
            parts.append(node.text or '')
        elif node.tag == W + 'tab':
            parts.append('\t')
        elif node.tag == W + 'br':
            parts.append('\n')
    return ''.join(parts)

def runs_de(p):
    runs = []
    def emit(kind, r):
        t = run_text(r)
        if t:
            runs.append((kind, t, run_fmt(r)))
    def walk(el, kind):
        for child in el:
            if child.tag == W + 'r':
                emit(kind, child)
            elif child.tag in (W + 'ins', W + 'moveTo'):
                walk(child, 'ins')
            elif child.tag in (W + 'del', W + 'moveFrom'):
                walk(child, 'del')
            elif child.tag in (W + 'smartTag', W + 'hyperlink'):
                walk(child, kind)
    walk(p, 'orig')
    return runs

def info_p(p, num):
    ppr = p.find(W + 'pPr')
    style = ''
    etiqueta = ''
    if ppr is not None:
        st = ppr.find(W + 'pStyle')
        style = st.get(W + 'val') if st is not None else ''
        npr = ppr.find(W + 'numPr')
        if npr is not None:
            nid = npr.find(W + 'numId')
            ilvl = npr.find(W + 'ilvl')
            if nid is not None:
                runs = runs_de(p)
                vivo = any(k != 'del' for k, t, f in runs if t.strip())
                if vivo:
                    etiqueta = num.etiqueta(nid.get(W + 'val'),
                                            int(ilvl.get(W + 'val')) if ilvl is not None else 0)
    return style, etiqueta

def extraer(path):
    """Lista de bloques: {'tipo':'p', ...} | {'tipo':'tabla', 'filas':[[celda...]]}
    celda = lista de párrafos."""
    z = zipfile.ZipFile(path)
    num = Numeracion(z)
    root = ET.fromstring(z.read('word/document.xml'))
    body = root.find(W + 'body')
    bloques = []
    def parrafo(p):
        style, etiqueta = info_p(p, num)
        return {'tipo': 'p', 'style': style, 'etiqueta': etiqueta, 'runs': runs_de(p)}
    for child in body:
        if child.tag == W + 'p':
            bloques.append(parrafo(child))
        elif child.tag == W + 'tbl':
            filas = []
            for tr in child.findall(W + 'tr'):
                fila = []
                for tc in tr.findall(W + 'tc'):
                    tcpr = tc.find(W + 'tcPr')
                    vm = tcpr.find(W + 'vMerge') if tcpr is not None else None
                    vmerge = None
                    if vm is not None:
                        vmerge = 'restart' if vm.get(W + 'val') == 'restart' else 'cont'
                    fila.append({'vmerge': vmerge,
                                 'parrafos': [parrafo(p) for p in tc.findall(W + 'p')]})
                if fila:
                    filas.append(fila)
            bloques.append({'tipo': 'tabla', 'filas': filas})
    return bloques


# ── render HTML ────────────────────────────────────────────────────────
def render_runs(runs):
    """Texto final: orig + ins (los del se descartan). ins → <ins>."""
    out = []
    for kind, texto, fmt in runs:
        if kind == 'del' or not texto:
            continue
        t = html.escape(texto).replace('\n', '<br/>')
        if 'b' in fmt: t = f'<strong>{t}</strong>'
        if 'i' in fmt: t = f'<em>{t}</em>'
        out.append((kind, t))
    # fusionar <ins> contiguos
    partes = []
    for kind, t in out:
        if kind == 'ins' and partes and partes[-1][0] == 'ins':
            partes[-1][1] += t
        else:
            partes.append([kind, t])
    return ''.join(f'<ins>{t}</ins>' if k == 'ins' else t for k, t in partes)

def texto_final(runs):
    return ''.join(t for k, t, f in runs if k != 'del')

def render_p(b, clase=''):
    cuerpo = render_runs(b['runs'])
    if not cuerpo.strip():
        return ''
    if b['etiqueta']:
        cuerpo = f'<span class="pl-inciso">{html.escape(b["etiqueta"])}</span> {cuerpo}'
        clase = (clase + ' pl-li').strip()
    attr = f' class="{clase}"' if clase else ''
    return f'<p{attr}>{cuerpo}</p>'

def render_tabla(b, clase='pl-tabla'):
    """Respeta los merges verticales del docx: la celda 'restart' toma
    rowspan por las 'cont' que la siguen en su columna, centrada."""
    def fila_vacia(fila):
        return all(not texto_final(p['runs']).strip()
                   for c in fila for p in c['parrafos'])
    filas_src = [f for f in b['filas'] if not fila_vacia(f)]
    if not filas_src:
        return ''
    filas = []
    for i, fila in enumerate(filas_src):
        tag = 'th' if i == 0 else 'td'
        celdas = []
        for j, celda in enumerate(fila):
            if celda['vmerge'] == 'cont':
                continue
            # clase por columna real (j cuenta también las celdas 'cont',
            # así que sobrevive a los rowspan)
            clases = [f'pl-c{j + 1}'] if j < 2 else []
            rowspan = ''
            if celda['vmerge'] == 'restart':
                span = 1
                for sig in filas_src[i + 1:]:
                    if j < len(sig) and sig[j]['vmerge'] == 'cont':
                        span += 1
                    else:
                        break
                if span > 1:
                    rowspan = f' rowspan="{span}"'
                    clases.append('pl-celda-merge')
            attrs = rowspan + (f' class="{" ".join(clases)}"' if clases else '')
            inner = ''.join(render_p(p) for p in celda['parrafos']) or '<p>&nbsp;</p>'
            celdas.append(f'<{tag}{attrs}>{inner}</{tag}>')
        filas.append('<tr>' + ''.join(celdas) + '</tr>')
    return (f'<div class="pl-tabla-scroll"><table class="{clase}">'
            + ''.join(filas) + '</table></div>')


# ── propuesta → cuerpo de la ley ───────────────────────────────────────
def generar_ley(bloques):
    out = []
    seccion = None      # nro de artículo abierto
    hay_mod = False     # el artículo abierto tiene <ins> o <del>

    def cerrar():
        nonlocal seccion, hay_mod
        if seccion is None:
            return
        if seccion in ARTS_INFORME:
            out.append(
                '<div class="pl-obleas">'
                f'<button type="button" class="pl-oblea pl-oblea-normas" data-art="{seccion}" data-tipo="normas">'
                'Normas que viola el proyecto oficial</button>'
                f'<button type="button" class="pl-oblea pl-oblea-just" data-art="{seccion}" data-tipo="just">'
                'Justificación de la modificación</button>'
                '</div>')
        elif seccion in JUST_SOLO:
            out.append(
                '<div class="pl-obleas">'
                f'<button type="button" class="pl-oblea pl-oblea-just" data-art="{seccion}" data-tipo="just">'
                'Justificación de la modificación</button>'
                '</div>')
        out.append('</section>')
        seccion = None
        hay_mod = False

    for b in bloques:
        if b['tipo'] == 'tabla':
            out.append(render_tabla(b))
            continue
        txt = texto_final(b['runs']).strip()
        if not txt:
            continue
        style = b['style']
        m = re.match(r'ART[IÍ]CULO\s+(\d+)', txt)
        if m:
            cerrar()
            nro = int(m.group(1))
            seccion = nro
            clases = 'pl-art' + (' pl-art-informe' if nro in ARTS_INFORME or nro in JUST_SOLO else '')
            out.append(f'<section class="{clases}" id="art-{nro}">')
            out.append(render_p(b, 'pl-art-p1'))
            continue
        if style == 'Heading1':
            cerrar()
            out.append(f'<h2 class="pl-titulo">{render_runs(b["runs"])}</h2>')
            continue
        if style == 'Heading2':
            cerrar()
            out.append(f'<h3 class="pl-capitulo">{render_runs(b["runs"])}</h3>')
            continue
        if seccion is None:
            # portada: (S-0809/2026), PROYECTO DE LEY, fórmula de sanción
            if txt == 'PROYECTO DE LEY':
                out.append(f'<p class="pl-rotulo">{html.escape(txt)}</p>')
            elif re.match(r'\(S-', txt):
                out.append(f'<p class="pl-expediente">{html.escape(txt)}</p>')
            else:
                out.append(render_p(b))
            continue
        out.append(render_p(b))
    cerrar()
    return '\n'.join(out)


# ── informe → intro + popups + cierre ──────────────────────────────────
def strip_lead(parrafos, lead):
    """Quita el rótulo en negrita ('Normas violadas.') del primer párrafo,
    consumiéndolo a nivel de runs (Word lo parte en varios)."""
    out = []
    primero = True
    for b in parrafos:
        if primero and b['tipo'] == 'p':
            vivo = ''.join(t for k, t, f in b['runs'] if k != 'del')
            if vivo.lstrip().startswith(lead):
                corte = vivo.index(lead) + len(lead)
                while corte < len(vivo) and vivo[corte] == ' ':
                    corte += 1
                runs = []
                pos = 0
                for kind, texto, fmt in b['runs']:
                    if kind == 'del':
                        runs.append((kind, texto, fmt))
                        continue
                    ini, pos = pos, pos + len(texto)
                    if pos <= corte:
                        continue
                    runs.append((kind, texto[max(corte - ini, 0):], fmt))
                b = dict(b, runs=runs)
            primero = False
        out.append(render_p(b) if b['tipo'] == 'p' else render_tabla(b))
    return ''.join(out)

def generar_informe(bloques):
    secciones = {}   # titulo -> lista de bloques
    orden = []
    actual = None
    for b in bloques:
        if b['tipo'] == 'p' and b['style'] == 'Heading2':
            actual = texto_final(b['runs']).strip()
            secciones[actual] = []
            orden.append(actual)
            continue
        if b['tipo'] == 'p' and b['style'] == 'Heading1':
            continue
        if actual is not None:
            secciones[actual].append(b)

    # popups de la intro (Objeto / Marco / Cuadro); las obleas que los abren
    # viven en el JSX, dentro del encabezado fijo
    INTRO = [('objeto', 'Objeto y método', 'Objeto y método'),
             ('marco', 'Marco normativo de referencia', 'Marco normativo de referencia'),
             ('cuadro', 'Cuadro de correspondencia', 'Cuadro de correspondencia'),
             ('cierre', 'Cierre', 'Criterio para modificaciones')]
    pops_intro = []
    for clave, titulo, rotulo in INTRO:
        cuerpo = []
        if clave == 'cuadro':
            cuerpo.append('<p class="pl-cuadro-ayuda">Cada fila lleva al artículo modificado.</p>')
        for b in secciones.get(titulo, []):
            if b['tipo'] == 'p':
                cuerpo.append(render_p(b))
            elif b['tipo'] == 'tabla':
                filas = []
                # filas como (nro, html_celdas) para poder reemplazar/insertar
                encabezado = ''
                datos = []
                for i, fila in enumerate(b['filas']):
                    if i == 0:
                        celdas = ''.join(
                            '<th>' + (''.join(render_p(p) for p in c['parrafos']) or '&nbsp;') + '</th>'
                            for c in fila)
                        encabezado = '<tr>' + celdas + '</tr>'
                        continue
                    m_nro = re.match(r'(\d+)', texto_final(fila[0]['parrafos'][0]['runs']).strip())
                    nro = int(m_nro.group(1)) if m_nro else None
                    if nro in CUADRO_FILAS:
                        continue  # la versión de HDO reemplaza a la del docx
                    celdas = ''.join(
                        '<td>' + (''.join(render_p(p) for p in c['parrafos']) or '&nbsp;') + '</td>'
                        for c in fila)
                    datos.append((nro if nro is not None else 999, nro, celdas))
                for nro, (c1, c2, c3, c4) in CUADRO_FILAS.items():
                    celdas = ''.join(f'<td><p>{html.escape(t)}</p></td>' for t in (c1, c2, c3, c4))
                    datos.append((nro, nro, celdas))
                datos.sort(key=lambda d: d[0])
                filas.append(encabezado)
                for _, nro, celdas in datos:
                    attr = f' class="pl-cuadro-fila" data-art="{nro}"' if nro is not None else ''
                    filas.append(f'<tr{attr}>' + celdas + '</tr>')
                cuerpo.append('<div class="pl-tabla-scroll"><table class="pl-cuadro">'
                              + ''.join(filas) + '</table></div>')
        pops_intro.append(f'<div class="pl-pop" data-art="intro" data-tipo="{clave}" '
                          f'data-titulo="{html.escape(rotulo)}" data-sub="Informe de fundamentos">'
                          + ''.join(cuerpo) + '</div>')

    # popups por artículo
    pops = ['<div class="pl-popups" hidden>'] + pops_intro
    for nro, (titulo, texto) in JUST_SOLO.items():
        pops.append(f'<div class="pl-pop" data-art="{nro}" data-tipo="just" '
                    f'data-titulo="{html.escape(titulo)}" data-sub="Justificación de la modificación">'
                    + texto + '</div>')
    for titulo in orden:
        m = re.match(r'Art[ií]culo\s+(\d+)', titulo)
        if not m:
            continue
        nro = int(m.group(1))
        if nro in JUST_SOLO:
            # el texto dictado por HDO reemplaza por completo a la sección
            # del informe (p.ej. art. 40: no hay violación normativa)
            continue
        normas, just = [], []
        balde = None
        for b in secciones[titulo]:
            if b['tipo'] != 'p':
                (balde if balde is not None else normas).append(b)
                continue
            txt = texto_final(b['runs']).strip()
            if txt.startswith('Normas violadas'):
                balde = normas
            elif txt.startswith('Justificación de la modificación'):
                balde = just
            if balde is not None:
                balde.append(b)
        tit = html.escape(titulo.replace('- ', ' · ', 1))
        html_normas = OVERRIDES.get((nro, 'normas')) or strip_lead(normas, 'Normas violadas.')
        html_just = OVERRIDES.get((nro, 'just')) or strip_lead(just, 'Justificación de la modificación.')
        pops.append(f'<div class="pl-pop" data-art="{nro}" data-tipo="normas" '
                    f'data-titulo="{tit}" data-sub="Normas que viola el proyecto oficial">'
                    + html_normas + '</div>')
        pops.append(f'<div class="pl-pop" data-art="{nro}" data-tipo="just" '
                    f'data-titulo="{tit}" data-sub="Justificación de la modificación">'
                    + html_just + '</div>')
    pops.append('</div>')

    return '\n'.join(pops)


def fusionar_encabezados(bloques):
    """Un 'ARTÍCULO N.-' que quedó como párrafo suelto (quirk del cc del
    11/08 en el art. 17) se fusiona con el párrafo siguiente."""
    out = []
    i = 0
    while i < len(bloques):
        b = bloques[i]
        if (b['tipo'] == 'p'
                and re.fullmatch(r'ART[IÍ]CULO\s+\d+\.?-?', texto_final(b['runs']).strip())
                and i + 1 < len(bloques) and bloques[i + 1]['tipo'] == 'p'):
            sig = bloques[i + 1]
            pegote = [] if texto_final(b['runs']).endswith(' ') else [('orig', ' ', '')]
            out.append(dict(sig, style=b['style'] or sig['style'],
                            runs=b['runs'] + pegote + sig['runs']))
            i += 2
            continue
        out.append(b)
        i += 1
    return out


def main():
    prop = fusionar_encabezados(extraer(DOCX_PROP))
    inf = extraer(DOCX_INF)
    pops = generar_informe(inf)
    ley = generar_ley(prop)
    doc = (
        '<!-- Generado desde los docx del 11/08 (propuesta cc HDO + informe de fundamentos).\n'
        '     Script: scripts/generar_propuesta_html.py — no editar a mano\n'
        '     los textos legales; regenerar desde el docx. -->\n'
        f'<div class="pl-ley">\n{ley}\n</div>\n{pops}\n'
    )
    with open(SALIDA, 'w') as f:
        f.write(doc)
    ins_n = doc.count('<ins>')
    print(f'OK → {SALIDA}')
    print(f'  <ins>: {ins_n} · obleas: {doc.count("pl-oblea ")} · popups: {doc.count("pl-pop ")}')

if __name__ == '__main__':
    main()
