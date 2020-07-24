export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoidHJpdmVkaCIsImEiOiJjazhkNWdpMWwwcXN6M210NzFqcGRrdWM4In0.puzDvYfQd6sJ0G6vWjueYA';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/trivedh/ck8d5qzgn1y9m1ilaoa25pvnn',
    scrollZoom: false
    //   center: [-118.11, 34.111],
    //   zoom: 10,
    //   interactive: false
  });
  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach(loc => {
    // Create a div and add marker to it
    const el = document.createElement('div');
    el.className = 'marker';
    //   Add the marker to map
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    // Add Popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day: ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    //Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100
    }
  });
};
