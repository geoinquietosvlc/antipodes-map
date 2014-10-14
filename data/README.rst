Listado de fuentes por CCAA
===========================

01 Andalucía
------------

La información está en la página de la Consejería de Educación de la Junta de Andalucía

http://www.juntadeandalucia.es/educacion/vscripts/centros/index.asp

Sin embargo la información está por provincias y falta su geocodificación.

02 Aragón
---------

La información está en la página de Datos Abiertos del Gobierno de Aragón

http://opendata.aragon.es/catalogo/matriculados-infantil-primaria-y-secundaria

Sin embargo está sin geocodificar

03 Asturias
-----------

En la web de la Consejería de Educación existe un listado de centros, pero habría que hacer webscrapping y luego geocodificar.

http://www.educastur.es/index.php?option=com_dbquery&Itemid=100&task=ExecuteQuery&qid=13&limit=600&limitstart=0

04 Baleares
-----------

05 Canarias
-----------

06 Cantabria
------------

07 Castilla - La Mancha
-----------------------

08 Castilla y León
------------------

Información obtenida en el portal de datos abiertos del Gobierno de España

http://www.datosabiertos.jcyl.es/web/jcyl/risp/es/directorio/centrosdocentes/1284200521439.csv

Transformación de datos
~~~~~~~~~~~~~~~~~~~~~~~

Los datos de Colegios proporcionados por la Junta de Castilla y León no están en UTF-8 por lo que hay que realizar una conversión de los mismos:

.. code::

    $ iconv -f ISO8859-1 -t UTF-8 raw/data_08_cyl.csv > data_08_cyl.csv

A continuación se normalizan los nombres de las columnas para eliminar espacios y carácteres extendidos de forma que tengan las siguientes equivalencias:

+-----------------------------+------------------+
| **Nombre original**         | **Nuevo nombre** |
+-----------------------------+------------------+
| CURSO ACADÉMICO             | curaca           |
+-----------------------------+------------------+
| CÓDIGO                      | id               |
+-----------------------------+------------------+
| C.SITUACIÓN                 | codsit           |
+-----------------------------+------------------+
| SITUACIÓN                   | sit              |
+-----------------------------+------------------+
| C.NATURALEZA                | codnat           |
+-----------------------------+------------------+
| NATURALEZA                  | nat              |
+-----------------------------+------------------+
| C.DENOMINACIÓN GENÉRICA     | coddge           |
+-----------------------------+------------------+
| DENOMINACIÓN GENÉRICA       | dengen           |
+-----------------------------+------------------+
| DENOMINACIÓN GENÉRICA BREVE | dengeb           |
+-----------------------------+------------------+
| DENOMINACIÓN ESPECÍFICA     | denesp           |
+-----------------------------+------------------+
| C.VÍA                       | codvia           |
+-----------------------------+------------------+
| VÍA                         | via              |
+-----------------------------+------------------+
| NOMBRE DE LA VÍA            | nomvia           |
+-----------------------------+------------------+
| NÚMERO                      | num              |
+-----------------------------+------------------+
| NÚMERO(EXT)                 | numext           |
+-----------------------------+------------------+
| PISO                        | piso             |
+-----------------------------+------------------+
| PISO(EXT)                   | pisext           |
+-----------------------------+------------------+
| ESCALERA                    | esc              |
+-----------------------------+------------------+
| LETRA                       | let              |
+-----------------------------+------------------+
| C.PROV                      | codpro           |
+-----------------------------+------------------+
| C.MUNI                      | codmun           |
+-----------------------------+------------------+
| C.LOCA                      | codloc           |
+-----------------------------+------------------+
| PROVINCIA                   | nompro           |
+-----------------------------+------------------+
| MUNICIPIO                   | nommun           |
+-----------------------------+------------------+
| LOCALIDAD                   | nomloc           |
+-----------------------------+------------------+
| C.POSTAL                    | codpos           |
+-----------------------------+------------------+
| TELÉFONO                    | tel              |
+-----------------------------+------------------+
| FAX                         | fax              |
+-----------------------------+------------------+
| LETRA                       | letb             |
+-----------------------------+------------------+
| CORREO ELECTRÓNICO          | email            |
+-----------------------------+------------------+
| WEB                         | web              |
+-----------------------------+------------------+
| COORD. LONGITUD             | lon              |
+-----------------------------+------------------+
| COORD. LATITUD              | lat              |
+-----------------------------+------------------+
| C.R.A                       | cra              |
+-----------------------------+------------------+
| INTERNADO                   | int              |
+-----------------------------+------------------+
| CONCIERTO                   | con              |
+-----------------------------+------------------+
| JORNADA CONTINUA            | jorcon           |
+-----------------------------+------------------+
| COMEDOR                     | com              |
+-----------------------------+------------------+
| TRANSPORTE                  | tra              |
+-----------------------------+------------------+
|                             | field0           |
+-----------------------------+------------------+

.. code::

   $ sed -ie '1s/.*/curaca;id;codsit;sit;codnat;nat;coddge;dengen;dengeb;denesp;codvia;via;nomvia;num;numext;piso;pisext;esc;let;codpro;codmun;codloc;nompro;nommun;nomloc;codpos;tel;fax;letb;email;web;lon;lat;cra;int;con;jorcon;com;tra;field0/g;' data_08_cyl.csv
   $ < data_08_cyl.csv csvformat -d ";" > raw/data_08_cyl.csv

A continuación se transforman los datos para adecuarlos a las columnas necesarias en el geojson:

.. code::

   $ < raw/data_08_cyl.csv csvsql --blanks --no-inference --query "SELECT id, denesp as name, via || ' ' || nomvia || ', ' || CASE WHEN num IS NULL THEN numext ELSE num END || ', ' || nommun || ', ' || codpos || ' ' || nompro as address, REPLACE(lon,',','.') as lon, REPLACE(lat,',','.') as lat FROM stdin;" > data_cyl.csv


09 Cataluña
-----------

Información obtenida en el portal de Open Data del gobierno de Cataluña

http://serveisoberts.gencat.cat/equipaments/search/csv?q=educaci%C3%B3

10 Extremadura
--------------

11 Galicia
----------

Información obtenida en el portal de Open Data de la Xunta

http://abertos.xunta.es/catalogo/ensino-formacion/-/dataset/0257/centros-educativos-galicia

Transformación de datos
~~~~~~~~~~~~~~~~~~~~~~~

En primer lugar se normalizan los nombres de las columnas para eliminar espacios y carácteres extendidos de forma que tengan las siguientes equivalencias:

+---------------------+------------------+
| **Nombre original** | **Nuevo nombre** |
+---------------------+------------------+
| Código              | codigo           |
+---------------------+------------------+
| Nome                | nome             |
+---------------------+------------------+
| Enderezo            | enderezo         |
+---------------------+------------------+
| Concello            | concello         |
+---------------------+------------------+
| Provincia           | provincia        |
+---------------------+------------------+
| Cód. postal         | cpostal          |
+---------------------+------------------+
| Tel&eacute;fono     | telf             |
+---------------------+------------------+
| Coordenada X        | lat              |
+---------------------+------------------+
| Coordenada Y        | lon              |
+---------------------+------------------+
| Titularidade        | titularidade     |
+---------------------+------------------+
| Ensino concertado   | concertado       |
+---------------------+------------------+
| Dependente          | dependente       |
+---------------------+------------------+

.. code::

   $ sed -rie '1s/.*/codigo,nome,enderezo,concello,provincia,cpostal,telf,lat,lon,titularidade,concertado,dependente/g;' raw/data_11_galicia.csv

A continuación se transforman los datos para adecuarlos a las columnas necesarias en el geojson:

.. code::

    $ < raw/data_11_galicia.csv csvsql --query "SELECT codigo as id, nome as name, enderezo || ' ' || concello || ' ' || cpostal || ' ' || provincia as address, lon, lat FROM stdin"> data_gal.csv

12 Madrid
---------

13 Navarra
----------

Información obtenida en el portal de Open Data del gobierno de Navarra

http://www.gobiernoabierto.navarra.es/es/open-data/datos/centros-educativos

14 País Vasco
-------------

15 Murcia
---------

16 Rioja
--------

17 Comunidad Valenciana
-----------------------

Información obtenida en la página web de la Conselleria de Educaciò

http://www.cece.gva.es/ocd/areacd/bd/registre.ods

18 Ceuta
--------

19 Melilla
----------

Unión de España
---------------

En primer lugar se unen los csv de las distintas comunidades

.. code::

    $ csvstack data_*.csv > data_es.csv


Para la conversión a geojson hace falta crear un archivo .vrt con la siguiente información:

.. code:: xml

    <OGRVRTDataSource>
        <OGRVRTLayer name="data_es">
            <SrcDataSource>data_es.csv</SrcDataSource>
            <GeometryType>wkbPoint</GeometryType>
            <LayerSRS>WGS84</LayerSRS>
            <GeometryField encoding="PointFromColumns" x="lon" y="lat"/>
        </OGRVRTLayer>
    </OGRVRTDataSource>

Y por último se crean el archivo geojson con los datos.

.. code::

   $ ogr2ogr -f GEOJson data_es.geojson data_es.vrt

Nueva Zelanda
-------------

Para procesar los datos de Nueva Zelanda empezaremos por extraer solamente las columnas que vamos a emplear

.. code::

   $ raw/data_nz.csv csvcut -c 1,2,5,9,10 > data_nz.csv

Remplazaremos los nombres de las columnas para que sean consistentes con el resto.

.. code::

   $ sed -rie '1s/.*/id,name,address,lon,lat/g;' data_nz.csv

Crearemos el archivo .vrt

.. code:: xml

    <OGRVRTDataSource>
        <OGRVRTLayer name="data_nz">
            <SrcDataSource>data_nz.csv</SrcDataSource>
            <GeometryType>wkbPoint</GeometryType>
            <LayerSRS>WGS84</LayerSRS>
            <GeometryField encoding="PointFromColumns" x="lon" y="lat"/>
        </OGRVRTLayer>
    </OGRVRTDataSource>

Y por último creamos el archivo geojson:

.. code::

   $ ogr2ogr -f GEOJson data_nz.geojson data_nz.vrt

Agradecimientos
===============

Miguel García González por los datos de Navarra.

Jordi Graells y Conchita Catalán por los datos de Cataluña.

Carlos Leal por los datos de Andalucía.

Carlos Galcerán por los datos de Nueva Zelanda
