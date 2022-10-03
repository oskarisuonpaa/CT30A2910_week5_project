const fetchData = async () => {
  const url =
    "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326";
  const res = await fetch(url);
  const data = await res.json();

  fetchPositiveData(data);
};

const fetchPositiveData = async (data) => {
  const url =
    "https://statfin.stat.fi/PxWeb/sq/4bb2c735-1dc3-4c5e-bde7-2165df85e65f";
  const res = await fetch(url);
  const positiveMigrationData = await res.json();

  addPositiveMigration(data, positiveMigrationData);
};

const addPositiveMigration = (data, positiveMigrationData) => {
  data.features.forEach((feature) => {
    let properties = feature.properties;
    Object.entries(
      positiveMigrationData.dataset.dimension.Tuloalue.category.index
    ).forEach(([key, value]) => {
      if (key.slice(-3) === properties.kunta) {
        properties.positiveMigration =
          positiveMigrationData.dataset.value[value];
      }
    });
  });
  fetchNegativeData(data);
};

const fetchNegativeData = async (data) => {
  const url =
    "https://statfin.stat.fi/PxWeb/sq/944493ca-ea4d-4fd9-a75c-4975192f7b6e";
  const res = await fetch(url);
  const negativeMigrationData = await res.json();

  addNegativeMigration(data, negativeMigrationData);
};

const addNegativeMigration = (data, negativeMigrationData) => {
  data.features.forEach((feature) => {
    let properties = feature.properties;
    Object.entries(
      negativeMigrationData.dataset.dimension.Lähtöalue.category.index
    ).forEach(([key, value]) => {
      if (key.slice(-3) === properties.kunta) {
        properties.negativeMigration =
          negativeMigrationData.dataset.value[value];
      }
    });
  });
  initMap(data);
};

const initMap = (data) => {
  let map = L.map("map", {
    minZoom: -3
  });

  let geoJson = L.geoJSON(data, {
    onEachFeature: getFeature,
    style: getStyle,
    weight: 2
  }).addTo(map);

  let tiles = L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  map.fitBounds(geoJson.getBounds());
};

const getFeature = (feature, layer) => {
  if (!feature.properties.name) return;
  layer.bindPopup(`<ul>
  <li>Name: ${feature.properties.name}</li>
  <li>Positive migration: ${feature.properties.positiveMigration}</li>
  <li>Negative migration: ${feature.properties.negativeMigration}</li>
</ul>`);
  layer.bindTooltip(`${feature.properties.name}`);
};

const getStyle = (feature) => {
  let hue =
    Math.pow(
      feature.properties.positiveMigration /
        feature.properties.negativeMigration,
      3
    ) * 60;
  if (hue > 120) {
    hue = 120;
  }
  return {
    color: `hsla(${hue}, 75%, 50%)`
  };
};

fetchData();
