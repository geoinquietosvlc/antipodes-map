#!/usr/bin/env python
# −*− coding: UTF−8 −*−

# #############################################################################
# Archivo para realizar el webscrapping de Centros Docentes no Universitarios
#
# :Autor: @vehrka
# :Fecha: 2014-10-20
#
# NOTAS:
#
# Como todo buen webscrapping dependerá de que no alteren la estructura de la 
# página web
# #############################################################################

import bs4
import csv
import logging
import requests
import time

# Argumentos del logger. Por defecto el nivel debería ser INFO
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = logging.FileHandler('centros_ws.log')
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Los datos provienen del Registro Estatal de Centros Docentes no Universitarios
# https://www.educacion.gob.es/centros/home.do

url1 = 'https://www.educacion.gob.es/centros/home.do'
url2 = 'https://www.educacion.gob.es/centros/buscar.do'

# Diccionario con los datos para la petición POST
values = {'nombreaut': '',
          'nombrepro': '',
          'textotipocentro': 'Todos',
          'textomunicipio': '',
          'textolocalidad': '',
          'textonivel': 'Todos',
          'tipocaso': '0',
          'textoensenanza': 'Todos',
          'textofamilia': 'Todos',
          'textonaturaleza': 'Todos',
          'textoconcertado': 'Todos',
          'textomodalidad': 'Todas',
          'textosub': '',
          'textocomarca': '',
          'textopais': '',
          'limite': '100',
          'simostrar': 'no',
          'codaut': '00',
          'valor': '',
          'texto': '',
          'codprov': '00',
          'codprovincia': '19',
          'sconcerta': '0',
          'codcen': '04000018'
          }

# Los datos de enseñanzas ya han sido tratados con anterioridad
ensefile = open("ensenyanzas.csv", "r")
dr = csv.reader(ensefile, delimiter=',', quotechar='"')
ensedict = {}
for linea in dr:
    # Cargamos los datos de enseñanzas en un diccionario
    ensedict[linea[0].replace(' ', '')] = linea[1]

ensefile.close()

# El servidor de educación sufre BASTANTE si siempre hacemos peticiones de 33K
# recomiendo acceder a url1 en un navegador, buscar en todas las comunidades
# y todos los centros, tarda un poco pero genera una página web on los datos
# básicos de todos los centros que guardamos en un archivo registro.html

# Ya tenemos la web descargada
f = open("registro.html", "r")
# creamos la sopa
soup = bs4.BeautifulSoup(f.read())
f.close()

# los datos están en las filas de la primera tabla
trs = soup.find_all('tr')
# la primera fila es la cabecera
trs.pop(0)

# guardaremos el parseo en un archivo csv
regfile = open("registro_centros.csv", 'w')
wr = csv.writer(regfile, quoting=csv.QUOTE_ALL)
# Escribimos la cabecera
wr.writerow(['cod', 'dee', 'dng', 'loc', 'pro', 'nat', 'tel', 'ema', 'web', 'mun', 'adr', 'cop', 'ensecat', 'lat', 'lon'])

s = requests.Session()

# Recorremos las filas y parseamos la información
for tr in trs:
    aes = tr('a')
    pro = aes[0].string.replace('\n\t\t   \t      ', '').replace('\n\t\t   \t   ', '')
    loc = aes[1].string.replace('\n\t\t   \t', '').replace('\n\t\t   \t', '')
    dng = aes[2].string.replace('\n\t\t   \t', '').replace('\n\t\t   \t', '')
    dee = aes[3].string.replace('\n\t\t   \t', '').replace('\n\t\t   \t', '')
    cod = aes[4].string.replace('\n\t\t   \t', '').replace('\n\t\t   \t', '')
    nat = aes[5].string.replace('\n\t\t   \t', '').replace('\n\t\t   \t', '')

    values['codcen'] = cod
    # Para cada centro obtener su ficha
    r2 = s.post(url2, data=values, verify=False, allow_redirects=False)
    soup = bs4.BeautifulSoup(r2.text)

    try:
        tel = soup('li')[4].text[10:]
        ema = soup('li')[6].text[32:][:-2]
        web = soup('a')[4].string
        mun = soup('li')[13].text[11:]
        adr = soup('li')[15].text[11:]
        cop = soup('li')[16].text[15:]
    except IndexError:
        adr = ''
        cop = ''

    # la información de enseñanzas está en una tabla con id = maten
    maten = soup.find_all(id='maten')
    # Pero a veces no está
    if len(maten) > 0:
        trs = maten[0]('tr')
        # descartamos la cabecera
        trs.pop(0)
        ensecat = ''
        for tr in trs:
            cat = ''
            ensetxt = tr('td')[2].string.replace('\r', '').replace('\n', '').replace('\t', '').replace('(Nocturno)', '')
            try:
                # recuperamos la categoría según nuestro código
                cat = ensedict[ensetxt.replace(' ', '')]
            except KeyError:
                logger.debug("Error treating {} enseñanza type ::{}".format(cod, ensetxt))
                # En caso de error lo reseña en el log y marca como categoría la X
                cat = 'X'
                pass
            # solo añade la categoría si esta no está ya presente
            if ensecat.find(cat) < 0:
                ensecat += cat
    else:
        ensecat = ''

    # Las fichas tienen los datos de coordenadas
    llat = soup.find_all(id='latitud')
    # Pero a veces no está
    if len(llat) > 0:
        lat = llat[0]['value']
        lon = soup.find_all(id='longitud')[0]['value']
    else:
        lat = '0'
        lon = '0'

    # Guardamos la información en el CSV
    wr.writerow([cod, dee, dng, loc, pro, nat, tel, ema, web, mun, adr, cop, ensecat, lat, lon])
    time.sleep(0.5)

# Cerramos el csv
regfile.close()
# Cerramos el logger
handler.close()
