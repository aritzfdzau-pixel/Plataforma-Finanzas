# Uso: soffice --headless --convert-to csv --outdir /tmp/x referencias.fods
#      python3 extraer.py /tmp/x/referencias.csv > referencias.json
# Convierte los valores calculados por LibreOffice Calc en JSON para los tests.
import csv, json, sys
out = {"_fuente": "LibreOffice Calc (soffice --headless --convert-to csv referencias.fods)", "valores": {}}
for fila in list(csv.reader(open(sys.argv[1], encoding='utf-8')))[1:]:
    i, d = fila[0], fila[1]
    vals = [v for v in fila[2:] if v != '']
    def num(v): return float(v[:-1]) / 100 if v.endswith('%') else float(v)
    if i in ('precios', 'r_simples', 'r_log'):
        out["valores"][i] = {"descripcion": d, "valor": [num(v) for v in vals]}
    else:
        out["valores"][i] = {"descripcion": d, "valor": num(vals[0])}
json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
print()
