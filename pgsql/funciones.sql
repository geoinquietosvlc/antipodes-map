CREATE OR REPLACE FUNCTION gvlc_antipodes_point(geom Geometry, OUT point Geometry)
AS $$
DECLARE
    X numeric;
    Y NUMERIC;
    stm Varchar;
BEGIN
    IF (ST_X(geom) > 0) 
        THEN X:= ST_X(geom) - 180;
        ELSE X:= ST_X(geom) + 180;
    END IF;
    Y:= ST_Y(geom) * -1;

    point:= st_geomfromtext('POINT(' || X || ' ' || Y || E')');
    
END;
$$ LANGUAGE'plpgsql' STRICT IMMUTABLE