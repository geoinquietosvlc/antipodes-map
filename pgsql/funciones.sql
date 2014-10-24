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

    stm:= E'SELECT st_geomfromtext(\'POINT(' || X || ' ' || Y || E')\')';
    EXECUTE stm INTO point;
END;
$$ LANGUAGE'plpgsql' STRICT IMMUTABLE