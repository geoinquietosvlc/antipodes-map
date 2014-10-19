var showHelp = function(){
  console.log("Showing help");
  var tour = new Tour({
    steps: [
    {
      element: "#leftmap .ol-zoom",
      title: "Navigate the maps",
      content: "Zoom in and out or use your mouse wheel"
    },
    {
      element: "#leftmapdetails .selecting-school",
      title: "Select your school",
      placement: "top",
      content: "Type your school name or select it from the list. Then click on the Go button to navigate."
    },
    {
      element: "#leftmapdetails .lanlot",
      title: "School details",
      content: "Once a school is selected, its address and coordinates will be shown."
    },
    {
      element: "#leftmapdetails .directionToCenter",
      title: "Direction to the map centre",
      content: "Distance and azimuth of the selected school to the map centre. If you dont't see the school follow the direction!!"
    },{
      element: ".title-distances",
      title: "Distance between schools",
      placement: "top",
      content: "Check the distance over the surface of the Earth and digging a direct hole!!"
    }
  ]});

  // Initialize the tour
  tour.init(true);

  // Start the tour
  tour.start();
}
