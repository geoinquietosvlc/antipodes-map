CREATE OR REPLACE FUNCTION gvlc_antipodes_point(geom Geometry, OUT point Geometry)
AS $$
DECLARE
    X NUMERIC;
    Y NUMERIC;
BEGIN
    IF (ST_X(geom) > 0) 
        THEN X:= ST_X(geom) - 180;
        ELSE X:= ST_X(geom) + 180;
    END IF;
    Y:= ST_Y(geom) * -1;

    point:= st_geomfromtext('POINT(' || X || ' ' || Y || E')');
END;
$$ LANGUAGE'plpgsql' STRICT IMMUTABLE;

CREATE OR REPLACE FUNCTION gvlc_xyz_wgs84(IN punto geometry, OUT puntoxyz geometry)
  RETURNS geometry AS
$BODY$
    DECLARE
        a NUMERIC;
        b NUMERIC;
        f NUMERIC;
        lat NUMERIC;
        lon NUMERIC;
        H NUMERIC;
        sinfi NUMERIC;
        cosfi NUMERIC;
        sinla NUMERIC;
        cosla NUMERIC;
        eSq NUMERIC;
        nu NUMERIC;
        x NUMERIC;
        y NUMERIC;
        z NUMERIC;
    BEGIN
        a:= 6378137.0;
        b:= 6356752.314245;
        f:= 1 / 298.257223563;
        lat:= radians(st_y(punto));
        lon:= radians(st_x(punto));
        H:= 0;

        sinfi:= sin(lat);
        cosfi:= cos(lat);
        sinla:= sin(lon);
        cosla:= cos(lon);

        eSq:=(a^2 - b^2) / (a^2);
        nu:= a / |/(1 - eSq * (sinfi^2));

        x:= (nu + H) * cosfi * cosla;
        y:= (nu + H) * cosfi * sinla;
        z:= ((1 - eSq) * nu + H) * sinfi;

        puntoxyz:= ST_geomfromtext('POINT(' || x || ' ' || y || ' ' || z || ')');
    END;
$BODY$
LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION gvlc_getschools(IN pgeom Geometry, OUT cod_es varchar, OUT cod_nz VARCHAR, OUT dist NUMERIC, OUT tunn NUMERIC)
RETURNS Record
AS $$
    DECLARE
        stm1 VARCHAR;
        stm2 VARCHAR;
        dis1 Geometry;
        dis2 Geometry;
        dis3 Geometry;
        dis4 Geometry;
    BEGIN
        IF (ST_Distance(pgeom::geography, ST_PointFromText('POINT(-3.68 40.4)')::geography)/1000.0) < 2000
        THEN
            stm1 = E'SELECT cod FROM registro_centros_es ORDER BY ST_Distance(the_geom::geography, st_geomfromtext(\'' || st_astext(pgeom) || E'\')::geography) ASC LIMIT 1' ;
            stm2 = E'SELECT zid FROM registro_centros_nz ORDER BY ST_Distance(the_geom::geography, st_geomfromtext(\'' || st_astext(gvlc_antipodes_point(pgeom)) || E'\')::geography) ASC LIMIT 1' ;
        ELSE
            stm1 = E'SELECT cod FROM registro_centros_es ORDER BY ST_Distance(the_geom::geography, st_geomfromtext(\'' || st_astext(gvlc_antipodes_point(pgeom)) || E'\')::geography) ASC LIMIT 1' ;
            stm2 = E'SELECT zid FROM registro_centros_nz ORDER BY ST_Distance(the_geom::geography, st_geomfromtext(\'' || st_astext(pgeom) || E'\')::geography) ASC LIMIT 1' ;
        END IF;
        EXECUTE stm1 INTO cod_es;
        EXECUTE stm2 INTO cod_nz;

        EXECUTE E'(SELECT the_geom FROM registro_centros_es WHERE cod = \'' || cod_es || E'\')' INTO dis1;
        EXECUTE E'(SELECT the_geom FROM registro_centros_nz WHERE zid = \'' || cod_nz || E'\')' INTO dis2;
        dist:= ST_Distance(dis1::geography, dis2::geography );
        dis3:= gvlc_xyz_wgs84(dis1);
        dis4:= gvlc_xyz_wgs84(dis2);
        tunn:= (|/( (ST_X(dis3) - ST_X(dis4))^2 + (ST_Y(dis3) - ST_Y(dis4))^2 + (ST_Z(dis3) - ST_Z(dis4))^2 )) / 1000;
    END;
$$ LANGUAGE 'plpgsql' STRICT IMMUTABLE;

-- USAGE
-- SELECT cod_es, cod_nz, dist, tunn FROM gvlc_getschools(st_geomfromtext('POINT(-5.8118 41.6501)'))
