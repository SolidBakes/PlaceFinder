let mapDiv;
let userLatitude = null;    // Globale Variablen zum Speichern der Koordinaten
let userLongitude = null;



document.addEventListener('DOMContentLoaded', function() {
  const currentCityEl = document.getElementById('current-city');
  const loadingEl = document.getElementById('loading');
  const mapDiv = document.getElementById('map');

  const radiusInput = document.getElementById('searchRadius');
  const radiusValueEl = document.getElementById('radiusValue');

  // Wenn sich der Slider bewegt, Text updaten
  radiusInput.addEventListener('input', function() {
  radiusValueEl.textContent = radiusInput.value;
});


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
        // Sobald du die Koordinaten hast und die Karte erzeugst:
        mapDiv.style.display = 'block';
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
    // Hol dir den aktuellen Wert vom Range-Input
    const radius = parseInt(radiusInput.value, 10) || 2000;

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
    { type: 'restaurant', category: 'essenTrinken' },
    { type: 'gas_station', category: 'tankenAuto' },
    { type: 'car_repair', category: 'tankenAuto' },
    { type: 'shopping_mall', category: 'freizeitEinkaufen' },
    { type: 'movie_theater', category: 'freizeitEinkaufen' },
    { type: 'bar', category: 'freizeitEinkaufen' },
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
      fields: ['name', 'website', 'url', 'geometry', 'rating', 'user_ratings_total', 'photos']
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
  liste.innerHTML = '';

  if (places.length === 0) {
    const li = document.createElement('li');
    li.textContent = "Keine Ergebnisse gefunden.";
    liste.appendChild(li);
    return;
  }

  places.forEach(place => {
    const li = document.createElement('li');

    // Kein place_id? -> kein getDetails möglich
    if (!place.place_id) {
      li.textContent = place.name || "Unbekannter Ort";
      liste.appendChild(li);
      return;
    }

    // Ort-Details abrufen
    getPlaceDetails(service, place.place_id, (details) => {
      if (!details) {
        // Fallback, wenn getDetails fehlschlägt
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
        return;
      }

      // =========================
      // 1) NAME (als erstes)
      // =========================
      const nameDiv = document.createElement('div');
      nameDiv.classList.add('place-name'); // Optional für CSS

      if (details.website) {
        // Website-Link
        const link = document.createElement('a');
        link.href = details.website;
        link.target = '_blank';
        link.textContent = details.name || "Unbekannter Ort";
        nameDiv.appendChild(link);

      } else if (details.url) {
        // Google-Maps-URL
        const link = document.createElement('a');
        link.href = details.url;
        link.target = '_blank';
        link.textContent = details.name || "Unbekannter Ort";
        nameDiv.appendChild(link);

      } else if (details.geometry && details.geometry.location) {
        // Nur Koordinaten-Link
        const lat = details.geometry.location.lat();
        const lng = details.geometry.location.lng();
        const link = document.createElement('a');
        link.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        link.target = '_blank';
        link.textContent = details.name || "Unbekannter Ort";
        nameDiv.appendChild(link);

      } else {
        // Fallback: kein Link, nur Name
        nameDiv.textContent = details.name || "Unbekannter Ort";
      }

      li.appendChild(nameDiv);

      // =========================
      // 2) ENTFERNUNG (darunter)
      // =========================
      if (details.geometry && details.geometry.location && google.maps.geometry?.spherical) {
        const lat = details.geometry.location.lat();
        const lng = details.geometry.location.lng();

        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(userLatitude, userLongitude),
          new google.maps.LatLng(lat, lng)
        );
        const distanceText = formatDistance(distance);

        const distanceDiv = document.createElement('div');
        distanceDiv.classList.add('place-distance'); // Optional für CSS
        distanceDiv.textContent = `Entfernung: ${distanceText}`;
        li.appendChild(distanceDiv);
      }

      // =========================
      // 3) BEWERTUNG (am Ende)
      // =========================
      if (details.rating !== undefined) {
        // Du hast vermutlich im CSS .stars-outer und .stars-inner definiert
        // Erzeugt z.B. 5 graue Sterne, und wir füllen sie je nach Prozentsatz mit Gold

        const ratingDiv = document.createElement('div');
        ratingDiv.classList.add('place-rating'); // Optional für CSS

        // Outer-Sterne:
        const starsOuter = document.createElement('div');
        starsOuter.classList.add('stars-outer');

        // Inner-Sterne:
        const starsInner = document.createElement('div');
        starsInner.classList.add('stars-inner');

        starsOuter.appendChild(starsInner);
        ratingDiv.appendChild(starsOuter);

        // Prozent ermitteln, z.B. 4.2 => 84%
        const maxRating = 5;
        const percentage = (details.rating / maxRating) * 100;
        starsInner.style.width = `${percentage}%`;

        // Anzahl der Bewertungen (optional)
        if (details.user_ratings_total !== undefined) {
          const ratingCount = document.createElement('span');
          ratingCount.style.marginLeft = '8px';
          ratingCount.textContent = `(${details.user_ratings_total} Bewertungen)`;
          ratingDiv.appendChild(ratingCount);
        }

        li.appendChild(ratingDiv);
      }
      if (details.photos && details.photos.length > 0) {
        // Erstes Foto nehmen
        const photoUrl = details.photos[0].getUrl({ maxWidth: 300 });
      
        // Bild-Element erzeugen
        const img = document.createElement('img');
        img.src = photoUrl;
        img.alt = details.name || "Foto";
        img.style.width = "300px";    // oder CSS-Klasse anhängen
        img.style.height = "auto";
      
        // In dein <li> oder wo auch immer einfügen
        li.appendChild(img);
      }      

    }); // getPlaceDetails Ende

    liste.appendChild(li);
  });
}



function formatDistance(meters) {
  if (meters < 1000) {
    return `${meters.toFixed(0)} m`;
  } else {
    return `${(meters / 1000).toFixed(2)} km`;
  }
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

/**
 * Erzeugt eine einfache Sterneanzeige (z.B. 3.5 => 3 volle Sterne + 1 halben Stern).
 */
function createStarRating(rating) {
  const maxStars = 5;
  
  // Ganze Sterne
  const fullStars = Math.floor(rating);
  // Prüfen, ob wir einen halben Stern brauchen
  const halfStar = (rating - fullStars) >= 0.5;

  let stars = '';
  for (let i = 0; i < fullStars; i++) {
    stars += '★'; // Volle Sterne
  }
  if (halfStar && fullStars < maxStars) {
    stars += '⯪'; // Symbol für halben Stern, z.B. '⯨' / '⯪' / '☆' ...
  }
  
  // Rest ggf. als leere Sterne
  const remaining = maxStars - fullStars - (halfStar ? 1 : 0);
  for (let j = 0; j < remaining; j++) {
    stars += '☆';
  }

  return stars;
}

// ...
// In deinem Callback:
if (details.rating !== undefined) {
  // Sterne
  const stars = createStarRating(details.rating);
  const ratingSpan = document.createElement('span');
  ratingSpan.style.marginLeft = '8px';
  
  // z. B. so anzeigen: ★★★★☆ (4.5) - 123 Bewertungen
  ratingSpan.textContent = ` ${stars} (${details.rating})`;
  if (details.user_ratings_total !== undefined) {
    ratingSpan.textContent += ` – ${details.user_ratings_total} Bewertungen`;
  }

  li.appendChild(ratingSpan);
}



  
  



