#registro_centros_es[zoom < 14]{
  marker-fill: #FFCC00; 
  marker-width: 10; 
  marker-line-color: #FFF; 
  marker-line-width: 1.5; 
  marker-line-opacity: 1; 
  marker-fill-opacity: 0.9; 
  marker-comp-op: multiply; 
  marker-type: ellipse; 
  marker-placement: point; 
  marker-allow-overlap: true; 
  marker-clip: false; 
  marker-multi-policy: largest; 
}

#registro_centros_es[zoom > 13]{
  marker-fill: #FFCC00; 
  marker-width: 10; 
  marker-line-color: #FFF; 
  marker-line-width: 1.5; 
  marker-line-opacity: 1; 
  marker-fill-opacity: 0.9;
  marker-type: ellipse; 
  marker-placement: point; 
  marker-allow-overlap: true; 
  marker-clip: false; 
  marker-multi-policy: largest; 
}

#registro_centros_es::labels[zoom > 14]{
  text-name: [dee];
  text-face-name: 'DejaVu Sans Book';
  text-size: 10;
  text-label-position-tolerance: 50;
  text-fill: #000;
  text-halo-fill: #FFF;
  text-halo-radius: 1;
  text-dx: 5;
  text-dy: -10;
  text-allow-overlap: false;
  text-placement: point;
  text-placement-type: simple;
}
