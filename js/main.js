// Warten, bis das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', function() {
    // Überprüfen, ob Geolocation unterstützt wird
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                initializePlaces(latitude, longitude);
            },
            function(error) {
                document.getElementById('loading').textContent = "Fehler bei der Standortbestimmung: " + error.message;
            }
        );
    } else {
        alert("Geolocation wird von diesem Browser nicht unterstützt.");
    }
});

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
        {
            type: 'cafe',
            category: 'essenTrinken'
        },
        {
            type: 'restaurant',
            category: 'essenTrinken'
        },
        {
            type: 'gas_station',
            category: 'tankenAuto'
        },
        {
            type: 'car_repair',
            category: 'tankenAuto'
        },
        {
            type: 'shopping_mall',
            category: 'freizeitEinkaufen'
        },
        {
            type: 'movie_theater',
            category: 'freizeitEinkaufen'
        }
    ];

    let remainingRequests = suchanfragen.length;

    // Für jede Suchanfrage eine Nearby Search durchführen
    suchanfragen.forEach(suche => {
        service.nearbySearch(
            {
                location: location,
                radius: 5000, // Suchradius in Metern
                type: [suche.type]
            },
            function(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    kategorien[suche.category] = kategorien[suche.category].concat(results);
                }
                remainingRequests--;
                if (remainingRequests === 0) {
                    // Alle Anfragen abgeschlossen
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
        kategorien[key] = removeDuplicates(kategorien[key], 'place_id').slice(0, 20); // Maximal 20 pro Kategorie
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
        li.textContent = place.name || "Unbekannter Ort";
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
