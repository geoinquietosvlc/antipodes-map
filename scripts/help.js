var showHelp = function(){
  console.log("Showing help");
  var tour = new Tour({
    steps: [
    {
      element: "#leftmap-search .selecting-school",
      title: "Select your school",
      placement: "bottom",
      content: "Type your school name and select it from the list. Then click on the Go button to navigate."
    },
    {
      element: "#leftmap .ol-zoom",
      title: "Navigate the maps",
      content: "Zoom in and out or use your mouse wheel. Click on the map to move to that location. Both maps are synchronized and NZ map shows in orange schools that teach Spanish!"
    },
    {
      element: "#leftmap-details .lanlot",
      title: "School details",
      content: "Once a school is selected, its address and coordinates will be shown."
    },
    {
      element: "#leftmap-details .directionToCenter",
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
