// --------------------------------------------------------
//
// This file is to configure the configurable settings.
// Load this file before script.js file at gmap.html.
//
// --------------------------------------------------------

// -- Output Settings -------------------------------------
// Show metric values
Metric = true; // true or false

// -- Map settings ----------------------------------------
// The Latitude and Longitude in decimal format
// CONST_CENTERLAT = 45.0;
// CONST_CENTERLON = 9.0;

CONST_CENTERLAT = -33.95;
CONST_CENTERLON = 151.18;


// The google maps zoom level, 0 - 16, lower is further out
CONST_ZOOMLVL   = 8;

// -- Marker settings -------------------------------------
// The default marker color
MarkerColor	  = "rgb(127, 127, 127)";
SelectedColor = "rgb(225, 225, 225)";

// -- Site Settings ---------------------------------------
SiteShow    = true; // true or false
// The Latitude and Longitude in decimal format
// SiteLat     = 45.0;
// SiteLon     = 9.0;

SiteLat = -33.95;
SiteLon = 151.18;

SiteCircles = true; // true or false (Only shown if SiteShow is true)
// In nautical miles or km (depending settings value 'Metric')
SiteCirclesDistances = new Array(10,50,100);

