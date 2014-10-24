CREATE OR REPLACE FUNCTION gvlc_antipodes_point(geom Geometry, OUT point Geometry)
AS $$
DECLARE
    X numeric;
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


CREATE OR REPLACE FUNCTION gvlc_getschools(IN pgeom Geometry, OUT cod_es varchar, OUT cod_nz VARCHAR)
RETURNS Record
AS $$ 
DECLARE
   ANTI Geometry;
   stm1 VARCHAR;
   stm2 VARCHAR;
BEGIN    
    -- THE ANTIPODAL
    ANTI:= gvlc_antipodes_point(pgeom);
    -- WHERE IS THE POINT? HOW FAR IT IS FROM MADRID?
    IF (ST_Distance(pgeom::geography, ST_PointFromText('POINT(-3.68 40.4)')::geography)/1000.0) < 2000 THEN
        -- THE POINT IS IN SPAIN
        stm1 = E'SELECT cod FROM registro_centros_es ORDER BY ST_Distance(geom::geography, st_geomfromtext(\'' || st_astext(pgeom) || E'\')::geography) ASC LIMIT 1' ;
        stm2 = E'SELECT zid FROM registro_centros_nz ORDER BY ST_Distance(geom::geography, st_geomfromtext(\'' || st_astext(ANTI) || E'\')::geography) ASC LIMIT 1' ;
    ELSE
        -- THE POINT IS IN NZ
        stm1 = E'SELECT cod FROM registro_centros_es ORDER BY ST_Distance(geom::geography, st_geomfromtext(\'' || st_astext(ANTI) || E'\')::geography) ASC LIMIT 1' ;
        stm2 = E'SELECT zid FROM registro_centros_nz ORDER BY ST_Distance(geom::geography, st_geomfromtext(\'' || st_astext(pgeom) || E'\')::geography) ASC LIMIT 1' ;
    END IF;

    EXECUTE stm1 INTO cod_es;
    EXECUTE stm2 INTO cod_nz;

END;
$$ LANGUAGE 'plpgsql' STRICT IMMUTABLE;

-- USAGE
-- SELECT cod_es, cod_nz FROM gvlc_getschools(st_geomfromtext('POINT(-5.8118 41.6501)'))
