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
f('pct_05', 'PERCENTIL.INC de 10 datos inventados al 5 %', 'PERCENTILE({3;1;4;1;5;9;2;6;5;3};0.05)')
f('pct_95', 'PERCENTIL.INC de 10 datos inventados al 95 %', 'PERCENTILE({3;1;4;1;5;9;2;6;5;3};0.95)')
f('pct_50', 'PERCENTIL.INC de 10 datos inventados al 50 %', 'PERCENTILE({3;1;4;1;5;9;2;6;5;3};0.5)')
f('z_95', 'Normal estándar inversa al 95 % (NORMINV(0,95;0;1))', 'NORMINV(0.95;0;1)')
f('banda_log_inf', 'Banda lognormal: 100 x EXP(0,0002 x 20 - z95 x 0,01 x RAIZ(20))', '100*EXP(0.0002*20-NORMINV(0.95;0;1)*0.01*SQRT(20))')
f('banda_log_sup', 'Banda lognormal: 100 x EXP(0,0002 x 20 + z95 x 0,01 x RAIZ(20))', '100*EXP(0.0002*20+NORMINV(0.95;0;1)*0.01*SQRT(20))')
f('banda_adi_sup', 'Banda aditiva: 2,5 + 0,001 x 12 + z95 x 0,05 x RAIZ(12)', '2.5+0.001*12+NORMINV(0.95;0;1)*0.05*SQRT(12)')
f('mae_ej', 'Error medio absoluto: reales 10, 12, 11, 13 frente a 11, 11, 12, 12', '(ABS(10-11)+ABS(12-11)+ABS(11-12)+ABS(13-12))/4')
f('rmse_ej', 'Raíz del error cuadrático medio: reales 10, 12, 11, 14 frente a 11, 11, 12, 12', 'SQRT(SUMXMY2({10;12;11;14};{11;11;12;12})/4)')
f('esc_fx_actual', 'Escenario: 100.000 USD a 1,0850 USD por EUR', '100000/1.085')
f('esc_fx_menos5', 'Escenario: 100.000 USD con el EUR/USD un 5 % más bajo', '100000/(1.085*0.95)')
f('esc_eur_cuota', 'Escenario Euribor: 150.000, 300 meses, Euribor 2,50 % + 0,80 %', 'PMT((0.025+0.008)/12;300;-150000)')
f('esc_eur_mas100', 'Escenario Euribor: igual con Euribor +100 pb (3,50 %)', 'PMT((0.035+0.008)/12;300;-150000)')
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

# --- Fase 7: empresas (ejemplos inventados, importes redondos) ---
# Análisis de estados financieros: ventas 2.000.000; EBIT 180.000; amortizaciones 70.000;
# gastos financieros 40.000; BN 100.000; deuda CP 150.000 y LP 650.000; caja 120.000;
# FP 900.000; activo 2.400.000; AC 1.000.000; PC 700.000; CFADS 260.000; cuotas 200.000.
f('rat_ebitda', 'EBITDA = EBIT + amortizaciones', '180000+70000')
f('rat_margen_ebitda', 'Margen EBITDA = EBITDA / ventas', '(180000+70000)/2000000')
f('rat_margen_neto', 'Margen neto = BN / ventas', '100000/2000000')
f('rat_crec_ventas', 'Crecimiento de ventas 2.000.000 frente a 1.850.000', '(2000000-1850000)/1850000')
f('rat_dfn', 'DFN = deuda CP + LP - caja', '150000+650000-120000')
f('rat_dfn_ebitda', 'DFN / EBITDA', '(150000+650000-120000)/(180000+70000)')
f('rat_autonomia', 'Autonomía financiera = FP / activo total', '900000/2400000')
f('rat_fm', 'Fondo de maniobra = AC - PC', '1000000-700000')
f('rat_liquidez', 'Ratio de liquidez = AC / PC', '1000000/700000')
f('rat_tes_neta', 'Tesorería neta = caja - deuda CP', '120000-150000')
f('rat_dscr', 'DSCR = CFADS / cuotas', '260000/200000')
f('rat_cobertura', 'Cobertura de intereses = EBITDA / gastos financieros', '(180000+70000)/40000')
f('rat_roe', 'ROE = BN / FP', '100000/900000')
f('rat_roa', 'ROA = BN / activo total', '100000/2400000')
# Circulante: ventas 2.400.000; compras 1.500.000; coste de ventas 1.600.000; clientes 480.000;
# proveedores 300.000; existencias 250.000; 365 días; saldos con IVA del 21 %.
f('circ_pmc_iva', 'PMC con saldos con IVA 21 %: clientes/1,21/ventas x 365', '480000/1.21/2400000*365')
f('circ_pmp_iva', 'PMP con saldos con IVA 21 %: proveedores/1,21/compras x 365', '300000/1.21/1500000*365')
f('circ_pma', 'PMA = existencias / coste de ventas x 365', '250000/1600000*365')
f('circ_ciclo_caja_iva', 'Ciclo de caja = PMA + PMC - PMP (con IVA)', '250000/1600000*365+480000/1.21/2400000*365-300000/1.21/1500000*365')
f('circ_pmc', 'PMC sin ajuste de IVA', '480000/2400000*365')
f('circ_ciclo_mad', 'Ciclo de maduración sin IVA = PMA + PMC', '250000/1600000*365+480000/2400000*365')
f('circ_nof', 'NOF = existencias + clientes + tesorería 20.000 - proveedores - otros 30.000', '250000+480000+20000-300000-30000')
# Póliza: límite 200.000; 12 meses; saldo medio 120.000; 5 % Act/360 trimestral; apertura 0,5 %;
# estudio 0,25 %; no disponibilidad 0,10 %. Periodo de 365/4 días.
f('pol_int_trim', 'Póliza: intereses por trimestre = 120.000 x 5 % x (365/4)/360', '120000*0.05*(365/4)/360')
f('pol_int', 'Póliza: intereses del año (4 liquidaciones)', '4*120000*0.05*(365/4)/360')
f('pol_nodisp', 'Póliza: no disponibilidad = 80.000 x 0,10 % x (365/4)/360 x 4', '4*80000*0.001*(365/4)/360')
f('pol_total', 'Póliza: coste total = intereses + no disponibilidad + apertura 1.000 + estudio 500', '4*(120000*0.05+80000*0.001)*(365/4)/360+1000+500')
f('pol_tae', 'Póliza: coste efectivo = (1 + TASA(4; -pago trimestral; 120.000 - 1.500; -120.000))^4 - 1', '(1+RATE(4;-(120000*0.05+80000*0.001)*(365/4)/360;120000-1500;-120000))^4-1')
f('pol2_total', 'Póliza mensual Act/365: límite 200.000; saldo 150.000 al 6 %; no disp. 0,15 %; excedido 10.000 al 12 %; apertura 0,5 %: coste total', '12*(150000*0.06+50000*0.0015+10000*0.12)*(365/12)/365+1000')
f('pol2_tae', 'Idem: coste efectivo sobre 160.000 (dispuesto + excedido)', '(1+RATE(12;-(150000*0.06+50000*0.0015+10000*0.12)*(365/12)/365;160000-1000;-160000))^12-1')
# Préstamo con comisiones: 100.000; 5 % mensual; 60 cuotas francés sin carencia; apertura 1 %,
# estudio 0,25 %, gastos 300.
f('pre_com_tae', 'Préstamo francés con comisiones 1.250 y gastos 300: TAE', '(1+RATE(60;-PMT(0.05/12;60;-100000);100000-1250-300))^12-1')
f('pre_com_total', 'Idem: coste financiero total = intereses + 1.550', '-CUMIPMT(0.05/12;60;100000;1;60;0)+1550')
# Factoring: 100.000; anticipo 80 %; 90 días; 5 % Act/360; comisión 0,8 %; estudio 60 x 1 deudor.
f('fac_int', 'Factoring: intereses = 80.000 x 5 % x 90/360', '80000*0.05*90/360')
f('fac_efe', 'Factoring: efectivo = 80.000 - intereses - 800 - 60', '80000-80000*0.05*90/360-800-60')
f('fac_tae', 'Factoring: coste efectivo = (80.000/efectivo)^(365/90) - 1', '(80000/(80000-80000*0.05*90/360-800-60))^(365/90)-1')
# Confirming (cliente pagador): 50.000; comisión 0,10 %; aplazamiento 30 días al 4,5 % Act/360.
f('cnf_int', 'Confirming pagador: intereses de aplazamiento = 50.000 x 4,5 % x 30/360', '50000*0.045*30/360')
f('cnf_tae', 'Confirming pagador: coste efectivo = ((50.000 + intereses)/(50.000 - 50))^(365/30) - 1', '((50000+50000*0.045*30/360)/(50000-50))^(365/30)-1')
# Avales: 100.000; 365 días; 1 % trimestral, mínimo 30; formalización 0,5 %; gastos 50.
f('ava_total', 'Aval 100.000 un año: 4 x MAX(250; 30) + 500 + 50', '4*MAX(100000*0.01/4;30)+100000*0.005+50')
f('ava_anual', 'Idem: % anual equivalente = coste / 100.000 x 365/365', '(4*MAX(100000*0.01/4;30)+100000*0.005+50)/100000*365/365')
f('ava2_total', 'Aval 10.000 a 200 días: CEILING(200 x 4/365) periodos x MAX(25; 30) + 0,5 % + 50', 'CEILING(200*4/365;1)*MAX(10000*0.01/4;30)+10000*0.005+50')
f('ava2_anual', 'Idem: % anual equivalente (base 365)', '(CEILING(200*4/365;1)*MAX(10000*0.01/4;30)+10000*0.005+50)/10000*365/200')

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
