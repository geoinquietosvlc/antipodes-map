#registro_centros_es{
  marker-fill: #229a00; 
  marker-width: 10; 
  marker-line-color: #FFFFFF; 
  marker-line-width: 1.5; 
  marker-line-opacity: 1; 
  marker-fill-opacity: 0.9; 
  marker-type: ellipse; 
  marker-placement: point; 
  marker-allow-overlap: true; 
  marker-clip: false; 
  marker-multi-policy: largest; 
  [zoom < 14] {
    marker-comp-op: multiply; 
    }
}

#registro_centros_es::labels[zoom > 14]{
  text-name: [dee];
  text-face-name: 'DejaVu Sans Book';
  text-size: 10;
  text-label-position-tolerance: 50;
  text-fill: #000;
  text-halo-fill: #FFF;
  text-halo-radius: 2;
  text-dy: -10;
  text-allow-overlap: true;
  text-placement: point;
  text-wrap-width: 50;
}
