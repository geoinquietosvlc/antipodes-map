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

En primer lugar se normalizan los nombres de las columnas para eliminar espacios y carácteres extendidos de forma que queden de la siguiente forma:

+---------------------+------------------+
| **nombre anterior** | **nuevo nombre** |
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

Para la conversión a geojson hace falta crear un archivo .vrt con la siguiente información:

.. code:: xml

    <OGRVRTDataSource>
        <OGRVRTLayer name="data_gal">
            <SrcDataSource>data_gal.csv</SrcDataSource>
            <GeometryType>wkbPoint</GeometryType>
            <LayerSRS>WGS84</LayerSRS>
            <GeometryField encoding="PointFromColumns" x="lon" y="lat"/>
        </OGRVRTLayer>
    </OGRVRTDataSource>

Y por último se crean el archivo geojson con los datos.

.. code::

   $ ogr2ogr -f GEOJson data_gal.geojson data_gal.vrt


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
