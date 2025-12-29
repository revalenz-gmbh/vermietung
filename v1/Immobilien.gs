/**
 * Immobilien.gs - Verwaltung von Immobilien und Räumen
 * Vermietungs-Buchhaltungssystem v1.0
 *
 * NEU: Für Multi-Property Support
 */

/**
 * Initialisiert Immobilien-Sheet
 */
function initializeImmobilien() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Immobilien');

  if (!sheet) {
    sheet = ss.insertSheet('Immobilien');
  }

  // Prüfe ob bereits Daten vorhanden
  if (sheet.getLastRow() > 1) {
    Logger.log('Immobilien-Sheet hat bereits Daten');
    return;
  }

  sheet.clear();

  // Header
  const headers = [
    'Immobilie-ID',
    'Name',
    'Adresse',
    'Baujahr',
    'Wohnfläche (m²)',
    'Anzahl Räume',
    'Aktiv',
    'Notizen'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formatierung Header
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // Beispiel-Immobilien
  const beispielDaten = [
    ['IMM-001', 'Eigenes Haus', '', '', 150, 3, 'Ja', '2 Zimmer + 1 Büro'],
    ['IMM-002', 'Haus Münster', '', '', 80, 2, 'Ja', 'Bald verfügbar']
  ];

  sheet.getRange(2, 1, beispielDaten.length, 8).setValues(beispielDaten);

  // Spaltenbreiten
  sheet.setColumnWidth(1, 100);   // Immobilie-ID
  sheet.setColumnWidth(2, 150);   // Name
  sheet.setColumnWidth(3, 250);   // Adresse
  sheet.setColumnWidth(4, 80);    // Baujahr
  sheet.setColumnWidth(5, 120);   // Wohnfläche
  sheet.setColumnWidth(6, 110);   // Anzahl Räume
  sheet.setColumnWidth(7, 70);    // Aktiv
  sheet.setColumnWidth(8, 300);   // Notizen

  // Freeze erste Zeile
  sheet.setFrozenRows(1);

  Logger.log('Immobilien-Sheet initialisiert mit ' + beispielDaten.length + ' Beispiel-Immobilien');
}

/**
 * Initialisiert Räume-Sheet
 */
function initializeRaeume() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Räume');

  if (!sheet) {
    sheet = ss.insertSheet('Räume');
  }

  // Prüfe ob bereits Daten vorhanden
  if (sheet.getLastRow() > 1) {
    Logger.log('Räume-Sheet hat bereits Daten');
    return;
  }

  sheet.clear();

  // Header
  const headers = [
    'Raum-ID',
    'Immobilie-ID',
    'Raum-Bezeichnung',
    'Typ',
    'Größe (m²)',
    'Grundmiete (€)',
    'Nebenkosten (€)',
    'Aktiv',
    'Notizen'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formatierung Header
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // Beispiel-Räume
  const beispielDaten = [
    ['RAUM-001', 'IMM-001', 'Zimmer 1', 'Zimmer', 20, 600, 150, 'Ja', 'Digital Nomad'],
    ['RAUM-002', 'IMM-001', 'Zimmer 2', 'Zimmer', 18, 550, 150, 'Ja', 'Digital Nomad'],
    ['RAUM-003', 'IMM-001', 'Büro Revalenz', 'Büro', 25, 800, 200, 'Ja', 'Langzeit']
  ];

  sheet.getRange(2, 1, beispielDaten.length, 9).setValues(beispielDaten);

  // Spaltenbreiten
  sheet.setColumnWidth(1, 100);   // Raum-ID
  sheet.setColumnWidth(2, 100);   // Immobilie-ID
  sheet.setColumnWidth(3, 180);   // Raum-Bezeichnung
  sheet.setColumnWidth(4, 80);    // Typ
  sheet.setColumnWidth(5, 90);    // Größe
  sheet.setColumnWidth(6, 110);   // Grundmiete
  sheet.setColumnWidth(7, 120);   // Nebenkosten
  sheet.setColumnWidth(8, 70);    // Aktiv
  sheet.setColumnWidth(9, 250);   // Notizen

  // Zahlenformat für Miete
  sheet.getRange('F:F').setNumberFormat('#,##0.00 "€"');
  sheet.getRange('G:G').setNumberFormat('#,##0.00 "€"');

  // Datenvalidierung für Typ
  const typRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Zimmer', 'Büro', 'Apartment', 'Gewerbe', 'Sonstiges'], true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('D2:D1000').setDataValidation(typRule);

  // Freeze erste Zeile
  sheet.setFrozenRows(1);

  Logger.log('Räume-Sheet initialisiert mit ' + beispielDaten.length + ' Beispiel-Räumen');
}

/**
 * Gibt alle aktiven Immobilien zurück
 * @returns {Array} Array mit Immobilien-Objekten
 */
function getAlleImmobilien() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Immobilien');

    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const immobilien = [];

    for (let i = 1; i < data.length; i++) {
      const aktiv = data[i][6] ? data[i][6].toString() : '';
      if (aktiv === 'Ja') {
        immobilien.push({
          immobilieId: data[i][0],
          name: data[i][1],
          adresse: data[i][2],
          baujahr: data[i][3],
          wohnflaeche: data[i][4],
          anzahlRaeume: data[i][5],
          notizen: data[i][7]
        });
      }
    }

    return immobilien;

  } catch (e) {
    logError('getAlleImmobilien', e);
    return [];
  }
}

/**
 * Gibt alle Räume einer Immobilie zurück
 * @param {string} immobilieId - Immobilie-ID
 * @returns {Array} Array mit Raum-Objekten
 */
function getRaeumeByImmobilie(immobilieId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Räume');

    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const raeume = [];

    for (let i = 1; i < data.length; i++) {
      const raumImmobilieId = data[i][1] ? data[i][1].toString() : '';
      const aktiv = data[i][7] ? data[i][7].toString() : '';

      if (raumImmobilieId === immobilieId && aktiv === 'Ja') {
        raeume.push({
          raumId: data[i][0],
          immobilieId: data[i][1],
          bezeichnung: data[i][2],
          typ: data[i][3],
          groesse: data[i][4],
          grundmiete: data[i][5],
          nebenkosten: data[i][6],
          notizen: data[i][8]
        });
      }
    }

    return raeume;

  } catch (e) {
    logError('getRaeumeByImmobilie', e);
    return [];
  }
}

/**
 * Gibt alle aktiven Räume zurück
 * @returns {Array} Array mit Raum-Objekten
 */
function getAlleRaeume() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Räume');

    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const raeume = [];

    for (let i = 1; i < data.length; i++) {
      const aktiv = data[i][7] ? data[i][7].toString() : '';
      if (aktiv === 'Ja') {
        raeume.push({
          raumId: data[i][0],
          immobilieId: data[i][1],
          bezeichnung: data[i][2],
          typ: data[i][3],
          groesse: data[i][4],
          grundmiete: data[i][5],
          nebenkosten: data[i][6],
          notizen: data[i][8]
        });
      }
    }

    return raeume;

  } catch (e) {
    logError('getAlleRaeume', e);
    return [];
  }
}

/**
 * Gibt Raum-Info zurück
 * @param {string} raumId - Raum-ID
 * @returns {Object|null} Raum-Objekt oder null
 */
function getRaumInfo(raumId) {
  const raeume = getAlleRaeume();
  return raeume.find(r => r.raumId === raumId) || null;
}

/**
 * Gibt Immobilie-Info zurück
 * @param {string} immobilieId - Immobilie-ID
 * @returns {Object|null} Immobilie-Objekt oder null
 */
function getImmobilieInfo(immobilieId) {
  const immobilien = getAlleImmobilien();
  return immobilien.find(i => i.immobilieId === immobilieId) || null;
}

/**
 * Generiert nächste Immobilie-ID
 * @returns {string} Immobilie-ID (IMM-NNN)
 */
function generateImmobilieId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Immobilien');

  if (!sheet || sheet.getLastRow() <= 1) {
    return 'IMM-001';
  }

  const data = sheet.getDataRange().getValues();
  let maxNr = 0;

  for (let i = 1; i < data.length; i++) {
    const id = data[i][0] ? data[i][0].toString() : '';
    const match = id.match(/^IMM-(\d+)$/);
    if (match) {
      const nr = parseInt(match[1]);
      if (nr > maxNr) maxNr = nr;
    }
  }

  const nextNr = (maxNr + 1).toString().padStart(3, '0');
  return 'IMM-' + nextNr;
}

/**
 * Generiert nächste Raum-ID
 * @returns {string} Raum-ID (RAUM-NNN)
 */
function generateRaumId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Räume');

  if (!sheet || sheet.getLastRow() <= 1) {
    return 'RAUM-001';
  }

  const data = sheet.getDataRange().getValues();
  let maxNr = 0;

  for (let i = 1; i < data.length; i++) {
    const id = data[i][0] ? data[i][0].toString() : '';
    const match = id.match(/^RAUM-(\d+)$/);
    if (match) {
      const nr = parseInt(match[1]);
      if (nr > maxNr) maxNr = nr;
    }
  }

  const nextNr = (maxNr + 1).toString().padStart(3, '0');
  return 'RAUM-' + nextNr;
}

/**
 * Fügt neue Immobilie hinzu
 * @param {string} name - Name der Immobilie
 * @param {string} adresse - Adresse
 * @param {string} baujahr - Baujahr
 * @param {number} wohnflaeche - Wohnfläche in m²
 * @param {number} anzahlRaeume - Anzahl Räume
 * @param {string} notizen - Notizen
 * @returns {string} Immobilie-ID
 */
function addImmobilie(name, adresse = '', baujahr = '', wohnflaeche = 0, anzahlRaeume = 0, notizen = '') {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Immobilien');

    if (!sheet) {
      throw new Error('Immobilien-Sheet nicht gefunden!');
    }

    const immobilieId = generateImmobilieId();

    sheet.appendRow([
      immobilieId,
      name,
      adresse,
      baujahr,
      wohnflaeche,
      anzahlRaeume,
      'Ja',
      notizen
    ]);

    Logger.log('Immobilie hinzugefügt: ' + immobilieId + ' - ' + name);
    return immobilieId;

  } catch (e) {
    logError('addImmobilie', e);
    throw e;
  }
}

/**
 * Fügt neuen Raum hinzu
 * @param {string} immobilieId - Immobilie-ID
 * @param {string} bezeichnung - Raum-Bezeichnung
 * @param {string} typ - Typ (Zimmer, Büro, etc.)
 * @param {number} groesse - Größe in m²
 * @param {number} grundmiete - Grundmiete in €
 * @param {number} nebenkosten - Nebenkosten in €
 * @param {string} notizen - Notizen
 * @returns {string} Raum-ID
 */
function addRaum(immobilieId, bezeichnung, typ = 'Zimmer', groesse = 0, grundmiete = 0, nebenkosten = 0, notizen = '') {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Räume');

    if (!sheet) {
      throw new Error('Räume-Sheet nicht gefunden!');
    }

    // Prüfe ob Immobilie existiert
    const immobilie = getImmobilieInfo(immobilieId);
    if (!immobilie) {
      throw new Error('Immobilie ' + immobilieId + ' nicht gefunden!');
    }

    const raumId = generateRaumId();

    sheet.appendRow([
      raumId,
      immobilieId,
      bezeichnung,
      typ,
      groesse,
      grundmiete,
      nebenkosten,
      'Ja',
      notizen
    ]);

    Logger.log('Raum hinzugefügt: ' + raumId + ' - ' + bezeichnung + ' (' + immobilieId + ')');
    return raumId;

  } catch (e) {
    logError('addRaum', e);
    throw e;
  }
}

/**
 * Gibt Immobilien-Übersicht zurück (für Dashboard)
 * @returns {Object} Übersicht mit Kennzahlen
 */
function getImmobilienOverview() {
  try {
    const immobilien = getAlleImmobilien();
    const raeume = getAlleRaeume();

    const overview = {
      anzahlImmobilien: immobilien.length,
      anzahlRaeume: raeume.length,
      gesamtFlaeche: 0,
      immobilienDetails: []
    };

    immobilien.forEach(immo => {
      overview.gesamtFlaeche += immo.wohnflaeche || 0;

      const immoRaeume = raeume.filter(r => r.immobilieId === immo.immobilieId);

      overview.immobilienDetails.push({
        immobilieId: immo.immobilieId,
        name: immo.name,
        anzahlRaeume: immoRaeume.length,
        raeume: immoRaeume
      });
    });

    return overview;

  } catch (e) {
    logError('getImmobilienOverview', e);
    return null;
  }
}

/**
 * Test-Funktion
 */
function testImmobilien() {
  Logger.log('=== IMMOBILIEN TEST ===');

  const immobilien = getAlleImmobilien();
  Logger.log('Anzahl Immobilien: ' + immobilien.length);

  immobilien.forEach(immo => {
    Logger.log('  ' + immo.immobilieId + ' - ' + immo.name);
    const raeume = getRaeumeByImmobilie(immo.immobilieId);
    Logger.log('    Räume: ' + raeume.length);
    raeume.forEach(raum => {
      Logger.log('      ' + raum.raumId + ' - ' + raum.bezeichnung + ' (' + raum.grundmiete + ' €)');
    });
  });

  const overview = getImmobilienOverview();
  Logger.log('Overview:');
  Logger.log('  Gesamt Immobilien: ' + overview.anzahlImmobilien);
  Logger.log('  Gesamt Räume: ' + overview.anzahlRaeume);
  Logger.log('  Gesamt Fläche: ' + overview.gesamtFlaeche + ' m²');

  Logger.log('=== TEST ENDE ===');
}
