# Uso: python3 generar_fods.py referencias.fods
# Genera una hoja de cálculo (ODF plana) con las fórmulas de referencia.
import sys, html
filas = []  # (id, descripcion, formula ODF sin 'of:=')
def f(i, d, fo): filas.append((i, d, fo))

# --- 1. FX forward (paridad cubierta) ---
f('fwd_usd', 'EUR/USD spot 1,0850; r EUR 3% Act/360; r USD 4,5% Act/360; 90 días', '1.085*(1+0.045*90/360)/(1+0.03*90/360)')
f('fwd_gbp', 'EUR/GBP spot 0,8500; r EUR 3% Act/360; r GBP 4,75% Act/365; 180 días', '0.85*(1+0.0475*180/365)/(1+0.03*180/360)')
f('fwd_jpy', 'EUR/JPY spot 162,35; r EUR 3% Act/360; r JPY 0,5% Act/365; 90 días', '162.35*(1+0.005*90/365)/(1+0.03*90/360)')
# --- 2. Conversión BCE ---
f('conv_eur_usd', '10.000 EUR a USD con tipo 1,0850', 'ROUND(10000*1.085;2)')
f('conv_usd_eur', '5.000 USD a EUR con tipo 1,0850', 'ROUND(5000/1.085;2)')
f('conv_eur_jpy', '1.000 EUR a JPY con tipo 162,35 (0 decimales)', 'ROUND(1000*162.35;0)')
f('conv_jpy_eur', '250.000 JPY a EUR con tipo 162,35', 'ROUND(250000/162.35;2)')
# --- 3. Préstamos ---
f('fr_cuota_60', 'Francés 100.000; TIN 5% mensual; 60 cuotas', 'PMT(0.05/12;60;-100000)')
f('fr_int_60', 'Francés 100.000; 5%; 60: intereses totales', '-CUMIPMT(0.05/12;60;100000;1;60;0)')
f('fr_pend_12', 'Francés 100.000; 5%; 60: pendiente tras 12 cuotas', '-FV(0.05/12;12;-PMT(0.05/12;60;-100000);100000)')
f('fr_carp_cuota', 'Francés 100.000; 5%; 60 periodos con 6 de carencia parcial: cuota', 'PMT(0.05/12;54;-100000)')
f('fr_carp_int', 'Idem: intereses totales', '6*100000*0.05/12+54*PMT(0.05/12;54;-100000)-100000')
f('fr_cart_cap', 'Francés 100.000; 5%; carencia total 6: capital tras carencia', '100000*(1+0.05/12)^6')
f('fr_cart_cuota', 'Idem: cuota', 'PMT(0.05/12;54;-100000*(1+0.05/12)^6)')
f('fr_cart_int', 'Idem: intereses totales (pagados)', '54*PMT(0.05/12;54;-100000*(1+0.05/12)^6)-100000')
f('al_cuota1', 'Alemán 100.000; 5% mensual; 60: primera cuota', '100000/60+100000*0.05/12')
f('al_int', 'Alemán 100.000; 5%; 60: intereses totales', '0.05/12*100000*(60+1)/2')
f('al_carp_int', 'Alemán 100.000; 5%; 60 con 6 de carencia parcial: intereses totales', '6*100000*0.05/12+0.05/12*100000*(54+1)/2')
f('am_cuota', 'Americano (bullet) 100.000; 5% mensual; 60: cuota de intereses', '100000*0.05/12')
f('am_ultima', 'Americano 100.000; 5%; 60: última cuota (intereses + capital)', '100000*0.05/12+100000')
f('am_int', 'Americano 100.000; 5%; 60: intereses totales', '60*100000*0.05/12')
f('am_cart_int', 'Americano 100.000; 5%; 60 con 6 de carencia total: intereses totales', '54*100000*(1+0.05/12)^6*0.05/12+100000*(1+0.05/12)^6-100000')
f('bce_var_usd', 'Variación tipo BCE (muestra inventada): 1,0850 / 1,0800 - 1', '1.085/1.08-1')
f('bce_var_jpy', 'Variación tipo BCE (muestra inventada): 161,20 / 162,35 - 1', '161.2/162.35-1')
f('mm3_primera', 'Media móvil 3 de la serie de precios: primera (100, 102, 101)', 'AVERAGE(100;102;101)')
f('mm3_ultima', 'Media móvil 3 de la serie de precios: última (105, 104, 108)', 'AVERAGE(105;104;108)')
f('ewma_var', 'EWMA lambda 0,94 de las rentabilidades log de la serie de precios: varianza final', '(0.94*(0.94*(0.94*(0.94*(LN(102/100))^2+0.06*(LN(101/102))^2)+0.06*(LN(105/101))^2)+0.06*(LN(104/105))^2)+0.06*(LN(108/104))^2)')
f('ewma_vol_252', 'EWMA: volatilidad anualizada (raíz de varianza x 252)', 'SQRT(((0.94*(0.94*(0.94*(0.94*(LN(102/100))^2+0.06*(LN(101/102))^2)+0.06*(LN(105/101))^2)+0.06*(LN(104/105))^2)+0.06*(LN(108/104))^2))*252)')
f('correl_xy', 'Correlación de Pearson de dos series inventadas', 'CORREL({0.02;-0.0098;0.0396;-0.0095;0.0385};{0.01;-0.005;0.03;-0.02;0.025})')
f('mdd_q', 'Máximo drawdown de 100, 110, 105, 95, 120, 90, 100', 'MIN(110/MAX(100;110)-1;105/MAX(100;110;105)-1;95/MAX(100;110;105;95)-1;120/MAX(100;110;105;95;120)-1;90/MAX(100;110;105;95;120;90)-1;100/MAX(100;110;105;95;120;90;100)-1)')
f('fr_trim_cuota', 'Francés 50.000; TIN 6% trimestral; 3 años (12 cuotas)', 'PMT(0.06/4;12;-50000)')
# --- 4. Descuento / confirming ---
f('dto_int', 'Descuento 20.000; 60 días; 6% Act/360: intereses', '20000*0.06*60/360')
f('dto_com', 'Idem: comisión 0,5% (mín. 6)', 'MAX(20000*0.005;6)')
f('dto_efe', 'Idem: efectivo (gastos 3)', '20000-20000*0.06*60/360-MAX(20000*0.005;6)-3')
f('dto_tae', 'Idem: coste efectivo anual (365, compuesto)', '(20000/(20000-20000*0.06*60/360-MAX(20000*0.005;6)-3))^(365/60)-1')
f('dto2_efe', 'Descuento 800; 30 días; 6%; 0,5% mín. 6; gastos 3: efectivo', '800-800*0.06*30/360-MAX(800*0.005;6)-3')
f('dto2_tae', 'Idem: coste efectivo anual', '(800/(800-800*0.06*30/360-MAX(800*0.005;6)-3))^(365/30)-1')
f('conf_efe', 'Confirming 50.000; 90 días; 4,5%; comisión 0,25%; sin gastos: efectivo', '50000-50000*0.045*90/360-50000*0.0025')
f('conf_tae', 'Idem: coste efectivo anual', '(50000/(50000-50000*0.045*90/360-50000*0.0025))^(365/90)-1')
# --- 5. TIN / TAE ---
f('tae_6_12', 'TIN 6% mensual -> TAE', 'EFFECT(0.06;12)')
f('tae_12_12', 'TIN 12% mensual -> TAE', 'EFFECT(0.12;12)')
f('tae_5_4', 'TIN 5% trimestral -> TAE', 'EFFECT(0.05;4)')
f('tin_6_12', 'TAE 6% -> TIN mensual', 'NOMINAL(0.06;12)')
f('tae_com', 'Préstamo 10.000; TIN 6%; 36 meses; comisión apertura 1%: TAE', '(1+RATE(36;-PMT(0.06/12;36;-10000);9900))^12-1')
# --- 7. VAN / TIR ---
f('tir_a', 'TIR de -100; 39; 59; 55; 20', 'IRR({-100;39;59;55;20})')
f('van_a', 'VAN al 10% de -100; 39; 59; 55; 20 (t=0 sin descontar)', 'NPV(0.1;39;59;55;20)-100')
f('tir_b', 'TIR de -1000; 300; 400; 500', 'IRR({-1000;300;400;500})')
f('van_b', 'VAN al 8% de -1000; 300; 400; 500', 'NPV(0.08;300;400;500)-1000')
f('tir_c', 'TIR de -50000 y 6 flujos de 12000', 'IRR({-50000;12000;12000;12000;12000;12000;12000})')
f('tir_d', 'TIR de -1000; 0; 0; 0; 0; 0; 0; 0; 0; 0; 5000', 'IRR({-1000;0;0;0;0;0;0;0;0;0;5000})')
# --- 8. Hipoteca variable ---
f('hip_cuota', 'Hipoteca 200.000; 25 años; Euribor 2,5% + 0,9%: cuota', 'PMT(0.034/12;300;-200000)')
f('hip_pend', 'Idem: pendiente a los 12 meses', '-FV(0.034/12;12;-PMT(0.034/12;300;-200000);200000)')
f('hip_cuota2', 'Idem: revisión con Euribor 2,1% + 0,9%: nueva cuota', 'PMT(0.03/12;288;FV(0.034/12;12;-PMT(0.034/12;300;-200000);200000))')
f('hip6_pend', 'Hipoteca 150.000; 20 años; 3,75%+1%: pendiente a 6 meses', '-FV(0.0475/12;6;-PMT(0.0475/12;240;-150000);150000)')
f('hip6_cuota2', 'Idem: revisión semestral con 3,25%+1%: nueva cuota', 'PMT(0.0425/12;234;FV(0.0475/12;6;-PMT(0.0475/12;240;-150000);150000))')

# --- Contraste con material de estudio externo (fase 1, revisión) ---
f('fwd_libro_12m', 'Forward EUR/USD: spot 1,10; EUR 1,2%; USD 1,8%; 360 días (Act/360 ambas)', '1.1*(1+0.018*360/360)/(1+0.012*360/360)')
f('fwd_libro_3m', 'Forward EUR/USD: spot 1,12; EUR 1%; USD 0,5%; 90 días (Act/360 ambas)', '1.12*(1+0.005*90/360)/(1+0.01*90/360)')
f('cruce_eurchf', 'Tipo cruzado EUR/CHF = EUR/USD 1,0850 x USD/CHF 0,8800', '1.085*0.88')
f('cruce_eurjpy', 'Tipo cruzado EUR/JPY = EUR/USD 1,0850 x USD/JPY 150,00', '1.085*150')
f('cruce_gbpusd_eurgbp', 'Tipo cruzado EUR/GBP = EUR/USD 1,0850 / GBP/USD 1,2700', '1.085/1.27')
f('bidask_usd_a_eur', 'Cliente vende 100.000 USD y compra EUR al ask 1,0852 (EUR/USD 1,0850/1,0852)', 'ROUND(100000/1.0852;2)')
f('bidask_eur_a_usd', 'Cliente vende 100.000 EUR y recibe USD al bid 1,0850', 'ROUND(100000*1.085;2)')
f('bidask_mid', 'Precio medio de 1,0850/1,0852', '(1.085+1.0852)/2')
f('letra_precio', 'Letra del Tesoro: nominal 1.000; 364 días; tipo 2,50% (Act/360, simple)', '1000/(1+0.025*364/360)')
f('macro_deflactor', 'Deflactor del PIB: PIB nominal 1.500 / PIB real 1.400 x 100', '1500/1400*100')
f('macro_inflacion_ipc', 'Inflación interanual: IPC 112,4 / IPC 108,0 - 1', '112.4/108-1')
f('macro_tipo_real', 'Tipo real (Fisher exacta): (1+3,5%)/(1+2,5%) - 1', '(1+0.035)/(1+0.025)-1')
f('macro_poder_compra', 'Poder adquisitivo de 1.000 € tras 3 años al 3% de inflación', '1000/(1+0.03)^3')
f('letra_precio_6m', 'Letra del Tesoro: nominal 1.000; 182 días; tipo 2,25% (Act/360, simple)', '1000/(1+0.0225*182/360)')

# --- 6. Rentabilidades: bloque de datos en celdas ---
precios = [100, 102, 101, 105, 104, 108]

def cell(v=None, formula=None, text=None):
    if formula: return f'<table:table-cell table:formula="of:={html.escape(formula)}"/>'
    if text is not None: return f'<table:table-cell office:value-type="string"><text:p>{html.escape(text)}</text:p></table:table-cell>'
    return f'<table:table-cell office:value-type="float" office:value="{v}"/>'

rows = []
rows.append(cell(text='id') + cell(text='descripcion') + cell(text='valor'))
for i, d, fo in filas:
    rows.append(cell(text=i) + cell(text=d) + cell(formula=fo))
# fila de precios en D..I de la fila siguiente a las fórmulas
n0 = len(rows) + 1  # número de fila (1-based) de los precios
rows.append(cell(text='precios') + cell(text='Serie inventada (6 precios)') + cell(text='') + ''.join(cell(v=p) for p in precios))
cols = 'DEFGHI'
simples = ';'.join(f'[.{cols[k+1]}{n0}]/[.{cols[k]}{n0}]-1' for k in range(5))
# rentabilidades en filas auxiliares
rows.append(cell(text='r_simples') + cell(text='Rentabilidades simples') + cell(text='') + cell(text='') + ''.join(cell(formula=f'[.{cols[k+1]}{n0}]/[.{cols[k]}{n0}]-1') for k in range(5)))
rows.append(cell(text='r_log') + cell(text='Rentabilidades logarítmicas') + cell(text='') + cell(text='') + ''.join(cell(formula=f'LN([.{cols[k+1]}{n0}]/[.{cols[k]}{n0}])') for k in range(5)))
rs, rl = n0 + 1, n0 + 2
R_S, R_L = f'[.E{rs}:.I{rs}]', f'[.E{rl}:.I{rl}]'
for i, d, fo in [
    ('rent_total', 'Rentabilidad total (108/100-1)', f'[.I{n0}]/[.D{n0}]-1'),
    ('media_s', 'Media de rentabilidades simples', f'AVERAGE({R_S})'),
    ('media_l', 'Media de rentabilidades log', f'AVERAGE({R_L})'),
    ('var_s', 'Varianza muestral simples (VAR.S)', f'VAR({R_S})'),
    ('var_l', 'Varianza muestral log (VAR.S)', f'VAR({R_L})'),
    ('sd_s', 'Desviación típica muestral simples', f'STDEV({R_S})'),
    ('sd_l', 'Desviación típica muestral log', f'STDEV({R_L})'),
    ('vol_s_252', 'Volatilidad anualizada simples (x raíz 252)', f'STDEV({R_S})*SQRT(252)'),
    ('vol_l_252', 'Volatilidad anualizada log (x raíz 252)', f'STDEV({R_L})*SQRT(252)'),
    ('vol_l_12', 'Volatilidad anualizada log (x raíz 12)', f'STDEV({R_L})*SQRT(12)'),
]:
    rows.append(cell(text=i) + cell(text=d) + cell(formula=fo))

body = ''.join(f'<table:table-row>{r}</table:table-row>' for r in rows)
doc = f'''<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:of="urn:oasis:names:tc:opendocument:xmlns:of:1.2" office:version="1.2" office:mimetype="application/vnd.oasis.opendocument.spreadsheet">
<office:body><office:spreadsheet><table:table table:name="referencias">{body}</table:table></office:spreadsheet></office:body></office:document>
'''
open(sys.argv[1], 'w').write(doc)
