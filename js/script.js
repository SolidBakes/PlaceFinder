let mapDiv;

document.addEventListener('DOMContentLoaded', function() {
    const currentCityEl = document.getElementById('current-city');
    const loadingEl = document.getElementById('loading');
    mapDiv = document.getElementById('map');
  
    function displayCityFromCoordinates(lat, lng) {
      const geocoder = new google.maps.Geocoder();
      const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };
  
      geocoder.geocode({ location: latlng }, function(results, status) {
        console.log("Geocoder Status:", status);
        console.log("Geocoder Ergebnisse:", results);
        loadingEl.style.display = 'none'; // Ladeanzeige ausblenden
        if (status === 'OK' && results[0]) {
          let city = '';
          results[0].address_components.forEach(component => {
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
          });
          if (!city) {
            results[0].address_components.forEach(component => {
              if (component.types.includes('administrative_area_level_2')) {
                city = component.long_name;
              }
            });
          }
          currentCityEl.textContent = city
            ? `Verwendeter Standort: ${city}`
            : 'Stadt konnte nicht ermittelt werden';
        } else {
          currentCityEl.textContent = 'Stadt konnte nicht ermittelt werden';
          console.warn('Keine Ergebnisse beim Reverse-Geocoding.');
        }
      });
    }
  
    if ("geolocation" in navigator) {
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
        },
        function(error) {
          console.error("Fehler bei der Standortbestimmung:", error);
          loadingEl.textContent = "Fehler bei der Standortbestimmung: " + error.message;
        }
      );
    } else {
      loadingEl.textContent = "Geolocation wird von diesem Browser nicht unterstützt.";
    }
  });
  
  



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

  function anzeigen(kategorien) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('kategorien').style.display = 'block';
  
    for (let key in kategorien) {
      kategorien[key] = removeDuplicates(kategorien[key], 'place_id').slice(0, 20);
    }
  
    zeigeErgebnisseInKategorie('listeEssenTrinken', kategorien.essenTrinken);
    zeigeErgebnisseInKategorie('listeTankenAuto', kategorien.tankenAuto);
    zeigeErgebnisseInKategorie('listeFreizeitEinkaufen', kategorien.freizeitEinkaufen);
  }
  
  function zeigeErgebnisseInKategorie(kategorieId, places) {
    const liste = document.getElementById(kategorieId);
    if (places.length === 0) {
      const li = document.createElement('li');
      li.textContent = "Keine Ergebnisse gefunden.";
      liste.appendChild(li);
      return;
    }
    places.forEach(place => {
      const li = document.createElement('li');
      li.textContent = place.name || "Unbekannter Ort";
      liste.appendChild(li);
    });
  }
  
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
  

function displayCityFromCoordinates(lat, lng) {
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };
    
    geocoder.geocode({ location: latlng }, function(results, status) {
      if (status === 'OK' && results[0]) {
        let city = '';
        // Durchsuchen der Adresskomponenten nach dem Typ "locality"
        results[0].address_components.forEach(component => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
        });
        
        // Alternative Suche nach "administrative_area_level_2" oder anderen Ebenen, falls "locality" fehlt
        if (!city) {
          results[0].address_components.forEach(component => {
            if (component.types.includes('administrative_area_level_2')) {
              city = component.long_name;
            }
          });
        }
        
        // Ausgabe des Stadtnamens oder entsprechende Meldung
        if (city) {
          document.getElementById('current-city').textContent = `Verwendeter Standort: ${city}`;
        } else {
          document.getElementById('current-city').textContent = 'Stadt konnte nicht ermittelt werden';
        }
      } else {
        console.warn('Keine Ergebnisse beim Reverse-Geocoding.');
        document.getElementById('current-city').textContent = 'Stadt konnte nicht ermittelt werden';
      }
    });
  }


  /**
 * Initialisiert die Suche nach Orten mithilfe der Google Places API
 * @param {number} lat - Breitengrad
 * @param {number} lng - Längengrad
 */
function initializePlaces(lat, lng) {
    const location = new google.maps.LatLng(lat, lng);
    const map = new google.maps.Map(document.createElement('div')); // Karte ist hier nicht sichtbar
    const service = new google.maps.places.PlacesService(map);

    // Kategorieninitialisierung
    const kategorien = {
        essenTrinken: [],
        tankenAuto: [],
        freizeitEinkaufen: []
    };

    // Suchanfragen definieren
    const suchanfragen = [
        { type: 'cafe', category: 'essenTrinken' },
        { type: 'restaurant', category: 'essenTrinken' },
        { type: 'gas_station', category: 'tankenAuto' },
        { type: 'car_repair', category: 'tankenAuto' },
        { type: 'shopping_mall', category: 'freizeitEinkaufen' },
        { type: 'movie_theater', category: 'freizeitEinkaufen' }
    ];
    
    

    let remainingRequests = suchanfragen.length;

    // Für jede Suchanfrage eine Nearby Search durchführen
    suchanfragen.forEach(suche => {
        service.nearbySearch(
            {
                location: location,
                radius: 25000, // Suchradius in Metern
                type: suche.type
            },
            function(results, status) {
              console.log(`Suche nach ${suche.type} – Status:`, status);
              if (status === google.maps.places.PlacesServiceStatus.OK) {
                console.log(`Ergebnisse für ${suche.type}:`, results);
                kategorien[suche.category] = kategorien[suche.category].concat(results);
              } else {
                console.warn(`Keine Ergebnisse für ${suche.type} oder Fehler:`, status);
              }
              remainingRequests--;
              if (remainingRequests === 0) {
                anzeigen(kategorien);
              }
            }
        );
    });
}

/**
 * Zeigt die Ergebnisse in den jeweiligen Kategorien an
 * @param {Object} kategorien - Objekt mit kategorisierten Orten
 */
function anzeigen(kategorien) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('kategorien').style.display = 'block';

    // Duplikate entfernen und Anzahl der Ergebnisse begrenzen
    for (let key in kategorien) {
        kategorien[key] = removeDuplicates(kategorien[key], 'place_id').slice(0, 5); // Maximal 20 pro Kategorie
    }

    // Ergebnisse anzeigen
    zeigeErgebnisseInKategorie('listeEssenTrinken', kategorien.essenTrinken);
    zeigeErgebnisseInKategorie('listeTankenAuto', kategorien.tankenAuto);
    zeigeErgebnisseInKategorie('listeFreizeitEinkaufen', kategorien.freizeitEinkaufen);
}

/**
 * Fügt die Orte einer Kategorie zur HTML-Liste hinzu
 * @param {string} kategorieId - Die ID der HTML-Liste
 * @param {Array} places - Array der gefundenen Orte
 */
function zeigeErgebnisseInKategorie(kategorieId, places) {
    const liste = document.getElementById(kategorieId);
    if (places.length === 0) {
        const li = document.createElement('li');
        li.textContent = "Keine Ergebnisse gefunden.";
        liste.appendChild(li);
        return;
    }
    places.forEach(place => {
        const li = document.createElement('li');
        if (place.place_id) {  // Prüfen, ob eine place_id vorhanden ist
            const a = document.createElement('a');
            // Erstellen der Google Maps URL mit der place_id
            a.href = `https://www.google.com/maps/search/?api=1&query_place_id=${place.place_id}`;
            a.target = '_blank';  // Öffnen des Links in einem neuen Tab
            a.textContent = place.name || "Unbekannter Ort";
            li.appendChild(a);
        } else {
            // Fallback, falls keine place_id vorhanden ist
            li.textContent = place.name || "Unbekannter Ort";
        }
        liste.appendChild(li);
    });
}

  
  



