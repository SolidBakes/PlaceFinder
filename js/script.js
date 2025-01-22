let mapDiv;
let userLatitude = null;    // Globale Variablen zum Speichern der Koordinaten
let userLongitude = null;

document.addEventListener('DOMContentLoaded', function() {
  const currentCityEl = document.getElementById('current-city');
  const loadingEl = document.getElementById('loading');
  const mapDiv = document.getElementById('map');

  // Button und Input-Feld für Radius
  const radiusInput = document.getElementById('searchRadius');
  const startSearchBtn = document.getElementById('startSearchBtn');

  // Standort ermitteln
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        userLatitude = position.coords.latitude;
        userLongitude = position.coords.longitude;

        console.log("Ermittelte Koordinaten:", userLatitude, userLongitude);

        displayCityFromCoordinates(userLatitude, userLongitude);

        // Beispiel: Karte sofort initialisieren
        const map = new google.maps.Map(mapDiv, {
          center: { lat: userLatitude, lng: userLongitude },
          zoom: 12
        });
        mapDiv.style.display = 'block';

        // Jetzt, wo Koordinaten bekannt sind, Button freigeben
        startSearchBtn.disabled = false;
      },
      function(error) {
        console.error("Fehler bei der Standortbestimmung:", error);
        loadingEl.textContent = "Fehler: " + error.message;
      }
    );
  } else {
    loadingEl.textContent = "Geolocation wird von diesem Browser nicht unterstützt.";
  }

  // Klick-Event auf den "Suche starten"-Button
  startSearchBtn.addEventListener('click', function() {
    // Eingegebenen Wert holen und in Zahl umwandeln
    const inputValue = radiusInput.value;
    const radius = parseInt(inputValue, 10) || 2000;

    console.log(`Suche Orte im Radius von ${radius} Metern...`);
    // Unsere Places-Suche starten
    initializePlaces(userLatitude, userLongitude, radius);
  });

}); // DOMContentLoaded Ende
  
  

/**
 * Geokodiert die eingegebene Adresse, zeigt den Stadtteil an und startet die Ortssuche.
 * @param {string} address - Die vom Nutzer eingegebene Adresse
 */
function geocodeAddress(address) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, function(results, status) {
        if (status === 'OK') {
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();

            // Stadtname aus den Adresskomponenten extrahieren
            let city = '';
            results[0].address_components.forEach(component => {
                if (component.types.includes('locality')) {
                    city = component.long_name;
                }
            });

            // Falls keine 'locality' gefunden wurde, andere Typen prüfen (z.B. administrative_area_level_2)
            if (!city) {
                results[0].address_components.forEach(component => {
                    if (component.types.includes('administrative_area_level_2')) {
                        city = component.long_name;
                    }
                });
            }

            // Stadtname anzeigen
            document.getElementById('current-city').textContent = city ? `Verwendeter Standort: ${city}` : '';

            initializePlaces(lat, lng);
        } else {
            alert('Geocoding war nicht erfolgreich: ' + status);
        }
    });
}

navigator.geolocation.getCurrentPosition(
    function(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      console.log("Ermittelte Koordinaten:", latitude, longitude);
      displayCityFromCoordinates(latitude, longitude);
      
      // Karte initialisieren (optional)
      const map = new google.maps.Map(mapDiv, {
        center: { lat: latitude, lng: longitude },
        zoom: 12
      });
      mapDiv.style.display = 'block';
  
      // Nach nahegelegenen Orten suchen und auflisten
      initializePlaces(latitude, longitude);
    },
    function(error) {
      console.error("Fehler bei der Standortbestimmung:", error);
      loadingEl.textContent = "Fehler bei der Standortbestimmung: " + error.message;
    }
  );
  

  

  function displayCityFromCoordinates(lat, lng) {
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };
  
    geocoder.geocode({ location: latlng }, function(results, status) {
      if (status === 'OK' && results[0]) {
        // City suchen ...
        let city = '';
        results[0].address_components.forEach(component => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
        });
        if (!city) {
          // Fallback administrative_area_level_2 ...
          results[0].address_components.forEach(component => {
            if (component.types.includes('administrative_area_level_2')) {
              city = component.long_name;
            }
          });
        }
        if (city) {
          document.getElementById('current-city').textContent = `Verwendeter Standort: ${city}`;
        } else {
          document.getElementById('current-city').textContent = 'Stadt konnte nicht ermittelt werden';
        }
      } else {
        console.warn('Keine Ergebnisse beim Reverse-Geocoding.');
        document.getElementById('current-city').textContent = 'Stadt konnte nicht ermittelt werden';
      }
      // Ladeanzeige ausblenden
      document.getElementById('loading').style.display = 'none';
    });
  }


/**
 * Initialisiert die Suche nach Orten mithilfe der Google Places API
 * @param {number} lat - Breitengrad
 * @param {number} lng - Längengrad
 * @param {number} radius - Umkreis in Metern
 */
function initializePlaces(lat, lng, radius) {
  // Ladeanzeige wieder einblenden (falls du möchtest)
  document.getElementById('loading').style.display = 'block';
  document.getElementById('kategorien').style.display = 'none';

  const location = new google.maps.LatLng(lat, lng);
  const map = new google.maps.Map(document.createElement('div'));
  const service = new google.maps.places.PlacesService(map);

  const kategorien = {
    essenTrinken: [],
    tankenAuto: [],
    freizeitEinkaufen: []
  };

  const suchanfragen = [
    { type: 'cafe', category: 'essenTrinken' },
    { type: 'restaurant', category: 'essenTrinken' },
    { type: 'gas_station', category: 'tankenAuto' },
    { type: 'car_repair', category: 'tankenAuto' },
    { type: 'shopping_mall', category: 'freizeitEinkaufen' },
    { type: 'movie_theater', category: 'freizeitEinkaufen' }
  ];

  let remainingRequests = suchanfragen.length;

  // Jede Suchanfrage ausführen
  suchanfragen.forEach(suche => {
    service.nearbySearch(
      {
        location: location,
        radius: radius, // <-- dynamischer Radius!
        type: suche.type
      },
      function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          kategorien[suche.category] = kategorien[suche.category].concat(results);
        } else {
          console.warn(`Keine Ergebnisse oder Fehler bei ${suche.type}:`, status);
        }
        remainingRequests--;
        if (remainingRequests === 0) {
          // Wenn alles fertig ist, Ergebnisse anzeigen
          anzeigen(kategorien, service);
        }
      }
    );
  });
}


/**
 * Zeigt die gefundenen Orte an
 * @param {Object} kategorien
 * @param {google.maps.places.PlacesService} service
 */
function anzeigen(kategorien, service) {
  // Ladeanzeige ausblenden
  document.getElementById('loading').style.display = 'none';
  // Kategorien-Bereich sichtbar machen
  document.getElementById('kategorien').style.display = 'block';

  // Duplikate entfernen & Anzahl begrenzen
  for (let key in kategorien) {
    kategorien[key] = removeDuplicates(kategorien[key], 'place_id').slice(0, 20);
  }

  // Ergebnisse in Listen eintragen
  zeigeErgebnisseInKategorie('listeEssenTrinken', kategorien.essenTrinken, service);
  zeigeErgebnisseInKategorie('listeTankenAuto', kategorien.tankenAuto, service);
  zeigeErgebnisseInKategorie('listeFreizeitEinkaufen', kategorien.freizeitEinkaufen, service);
}


/**
 * Ruft Detailinformationen zu einem Ort anhand seiner place_id ab.
 */
function getPlaceDetails(service, placeId, callback) {
  service.getDetails(
    {
      placeId: placeId,
      fields: ['name', 'website', 'url', 'geometry']
    },
    (placeResult, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        callback(placeResult);
      } else {
        callback(null);
      }
    }
  );
}



/**
 * Ruft Details ab und erzeugt Links
 */
function zeigeErgebnisseInKategorie(kategorieId, places, service) {
  const liste = document.getElementById(kategorieId);
  // Liste ggf. leeren, falls du schon mal gesucht hast
  liste.innerHTML = '';

  if (places.length === 0) {
    const li = document.createElement('li');
    li.textContent = "Keine Ergebnisse gefunden.";
    liste.appendChild(li);
    return;
  }

  places.forEach(place => {
    const li = document.createElement('li');
    if (!place.place_id) {
      li.textContent = place.name || "Unbekannter Ort";
      liste.appendChild(li);
      return;
    }

    // Details abfragen
    getPlaceDetails(service, place.place_id, (details) => {
      if (details) {
        // 1) Offizielle Website
        if (details.website) {
          const a = document.createElement('a');
          a.href = details.website;
          a.target = '_blank';
          a.textContent = details.name || "Unbekannter Ort";
          li.appendChild(a);
        }
        // 2) Google-Maps-URL
        else if (details.url) {
          const a = document.createElement('a');
          a.href = details.url;
          a.target = '_blank';
          a.textContent = details.name || "Unbekannter Ort";
          li.appendChild(a);
        }
        // 3) Koordinaten-Link
        else if (details.geometry && details.geometry.location) {
          const lat = details.geometry.location.lat();
          const lng = details.geometry.location.lng();
          const a = document.createElement('a');
          a.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
          a.target = '_blank';
          a.textContent = details.name || "Unbekannter Ort";
          li.appendChild(a);
        }
        else {
          // Fallback
          li.textContent = details.name || "Unbekannter Ort";
        }
      } else {
        // getDetails schlug fehl -> Koordinaten nutzen
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const a = document.createElement('a');
          a.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
          a.target = '_blank';
          a.textContent = place.name || "Unbekannter Ort";
          li.appendChild(a);
        } else {
          li.textContent = place.name || "Unbekannter Ort";
        }
      }
    });
    liste.appendChild(li);
  });
}

/**
 * Entfernt Duplikate aus einem Array basierend auf einem Schlüssel
 * @param {Array} arr - Das Array, aus dem Duplikate entfernt werden sollen
 * @param {string} key - Der Schlüssel, nach dem Duplikate identifiziert werden
 * @returns {Array} - Das Array ohne Duplikate
 */
function removeDuplicates(arr, key) {
  const seen = new Set();
  return arr.filter(item => {
    const val = item[key];
    if (seen.has(val)) {
      return false;
    }
    seen.add(val);
    return true;
  });
}


  
  



