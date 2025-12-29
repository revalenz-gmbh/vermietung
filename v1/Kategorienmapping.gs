/**
 * Kategorienmapping.gs - Auto-Zuordnung von Kategorien via Keywords
 * Vermietungs-Buchhaltungssystem v1.0
 *
 * NEU: Vereinfachtes Mapping für Einnahmen/Ausgaben Kategorien
 */

/**
 * Initialisiert Kategorienmapping-Sheet
 */
function initializeKategorienmapping() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Kategorienmapping');

  if (!sheet) {
    sheet = ss.insertSheet('Kategorienmapping');
  }

  // Prüfe ob bereits Daten vorhanden
  if (sheet.getLastRow() > 1) {
    Logger.log('Kategorienmapping-Sheet hat bereits Daten');
    return;
  }

  sheet.clear();

  // Header
  const headers = [
    'Schlüsselwort',
    'Kategorie',
    'Typ',
    'Immobilie-ID',
    'Kommentar'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formatierung Header
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // Standard-Mappings
  const mappings = getDefaultKategorienmapping();

  if (mappings.length > 0) {
    sheet.getRange(2, 1, mappings.length, 5).setValues(mappings);
  }

  // Spaltenbreiten
  sheet.setColumnWidth(1, 150);   // Schlüsselwort
  sheet.setColumnWidth(2, 200);   // Kategorie
  sheet.setColumnWidth(3, 100);   // Typ
  sheet.setColumnWidth(4, 100);   // Immobilie-ID
  sheet.setColumnWidth(5, 300);   // Kommentar

  // Datenvalidierung für Typ
  const typRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Einnahme', 'Ausgabe'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('C2:C1000').setDataValidation(typRule);

  // Freeze erste Zeile
  sheet.setFrozenRows(1);

  Logger.log('Kategorienmapping-Sheet initialisiert mit ' + mappings.length + ' Standard-Mappings');
}

/**
 * Standard-Mappings für Vermietung
 * @returns {Array} Array mit Mapping-Daten
 */
function getDefaultKategorienmapping() {
  return [
    // === EINNAHMEN ===
    ['revalenz', 'Miete Kaltmiete', 'Einnahme', 'IMM-001', 'Revalenz Office rent'],
    ['airbnb', 'Airbnb Miete', 'Einnahme', '', 'Airbnb payouts'],
    ['booking.com', 'Airbnb Miete', 'Einnahme', '', 'Booking.com payouts'],
    ['kaution', 'Kaution Eingang', 'Einnahme', '', 'Security deposit'],
    ['miete', 'Miete Kaltmiete', 'Einnahme', '', 'Generic rent'],
    ['nebenkosten', 'Miete Nebenkosten', 'Einnahme', '', 'Utility costs from tenant'],

    // === AUSGABEN: Hauskosten ===
    ['stadtwerke', 'Hauskosten Strom', 'Ausgabe', 'IMM-001', 'Electricity'],
    ['gasag', 'Hauskosten Heizung', 'Ausgabe', 'IMM-001', 'Gas heating'],
    ['fernwärme', 'Hauskosten Heizung', 'Ausgabe', '', 'District heating'],
    ['wasserwerke', 'Hauskosten Wasser', 'Ausgabe', 'IMM-001', 'Water'],
    ['awb', 'Hauskosten Müll', 'Ausgabe', 'IMM-001', 'Waste management'],
    ['bsr', 'Hauskosten Müll', 'Ausgabe', 'IMM-001', 'Berlin waste'],
    ['abfall', 'Hauskosten Müll', 'Ausgabe', '', 'Waste'],
    ['reinigung', 'Hauskosten Reinigung', 'Ausgabe', '', 'Cleaning'],
    ['hausmeister', 'Hauskosten Hausmeister', 'Ausgabe', '', 'Caretaker'],

    // === AUSGABEN: Steuern & Versicherungen ===
    ['grundsteuer', 'Grundsteuer', 'Ausgabe', '', 'Property tax'],
    ['versicherung', 'Versicherung Gebäude', 'Ausgabe', '', 'Building insurance'],
    ['haftpflicht', 'Versicherung Haftpflicht', 'Ausgabe', '', 'Liability insurance'],
    ['gebäudeversicherung', 'Versicherung Gebäude', 'Ausgabe', '', 'Building insurance'],

    // === AUSGABEN: Instandhaltung ===
    ['handwerker', 'Instandhaltung & Reparatur', 'Ausgabe', '', 'Craftsman'],
    ['reparatur', 'Instandhaltung & Reparatur', 'Ausgabe', '', 'Repair'],
    ['baumarkt', 'Instandhaltung & Reparatur', 'Ausgabe', '', 'Hardware store'],
    ['obi', 'Instandhaltung & Reparatur', 'Ausgabe', '', 'OBI hardware'],
    ['hornbach', 'Instandhaltung & Reparatur', 'Ausgabe', '', 'Hornbach hardware'],
    ['toom', 'Instandhaltung & Reparatur', 'Ausgabe', '', 'Toom hardware'],
    ['streichen', 'Instandhaltung & Reparatur', 'Ausgabe', '', 'Painting'],
    ['sanitär', 'Instandhaltung & Reparatur', 'Ausgabe', '', 'Plumbing'],
    ['elektro', 'Instandhaltung & Reparatur', 'Ausgabe', '', 'Electrical'],

    // === AUSGABEN: Verwaltung ===
    ['hausverwaltung', 'Verwaltung & Buchhaltung', 'Ausgabe', '', 'Property management'],
    ['steuerberater', 'Verwaltung & Buchhaltung', 'Ausgabe', '', 'Tax advisor'],
    ['verwaltung', 'Verwaltung & Buchhaltung', 'Ausgabe', '', 'Administration'],

    // === AUSGABEN: Finanzierung ===
    ['zinsen', 'Finanzierung Zinsen', 'Ausgabe', '', 'Loan interest'],
    ['darlehen', 'Finanzierung Zinsen', 'Ausgabe', '', 'Loan'],
    ['kredit', 'Finanzierung Zinsen', 'Ausgabe', '', 'Credit']
  ];
}

/**
 * Findet Kategorie anhand Verwendungszweck
 * @param {string} verwendungszweck - Verwendungszweck-Text
 * @param {number} betrag - Betrag (für Typ-Erkennung: positiv=Einnahme, negativ=Ausgabe)
 * @returns {Object} {kategorie, typ, immobilieId, confidence}
 */
function findKategorieByText(verwendungszweck, betrag = 0) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Kategorienmapping');

    if (!sheet || sheet.getLastRow() <= 1) {
      return { kategorie: null, typ: null, immobilieId: null, confidence: 'Low' };
    }

    const textLower = verwendungszweck.toLowerCase();
    const typ = betrag >= 0 ? 'Einnahme' : 'Ausgabe';

    const data = sheet.getDataRange().getValues();

    // Durchsuche alle Mappings
    for (let i = 1; i < data.length; i++) {
      const keyword = data[i][0] ? data[i][0].toString().toLowerCase() : '';
      const kategorie = data[i][1];
      const mappingTyp = data[i][2];
      const immobilieId = data[i][3] || '';

      // Skip wenn Typ nicht passt
      if (mappingTyp && mappingTyp !== typ) continue;

      // Prüfe ob Keyword im Text vorkommt
      if (keyword && textLower.includes(keyword)) {
        return {
          kategorie: kategorie,
          typ: mappingTyp,
          immobilieId: immobilieId,
          confidence: 'High'
        };
      }
    }

    // Kein Match gefunden → Default-Kategorie
    const defaultKategorie = betrag >= 0 ? 'Sonstige Einnahmen' : 'Sonstige Ausgaben';

    return {
      kategorie: defaultKategorie,
      typ: typ,
      immobilieId: '',
      confidence: 'Low'
    };

  } catch (e) {
    logError('findKategorieByText', e);
    return { kategorie: null, typ: null, immobilieId: null, confidence: 'Error' };
  }
}

/**
 * Fügt neues Mapping hinzu
 * @param {string} keyword - Schlüsselwort
 * @param {string} kategorie - Kategorie
 * @param {string} typ - Typ (Einnahme/Ausgabe)
 * @param {string} immobilieId - Immobilie-ID (optional)
 * @param {string} kommentar - Kommentar (optional)
 * @returns {boolean} Erfolg
 */
function addKategorienMapping(keyword, kategorie, typ, immobilieId = '', kommentar = '') {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Kategorienmapping');

    if (!sheet) {
      throw new Error('Kategorienmapping-Sheet nicht gefunden!');
    }

    sheet.appendRow([
      keyword.toLowerCase(),
      kategorie,
      typ,
      immobilieId,
      kommentar
    ]);

    Logger.log('Kategorienmapping hinzugefügt: ' + keyword + ' → ' + kategorie);
    return true;

  } catch (e) {
    logError('addKategorienMapping', e);
    return false;
  }
}

/**
 * Lernfunktion: Lernt aus bereits gebuchten Kontobewegungen
 * Erstellt Mappings für häufige Verwendungszwecke
 * (Optional - kann später implementiert werden)
 */
function learnFromKontobewegungen() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const kbSheet = ss.getSheetByName('Kontobewegungen');

    if (!kbSheet || kbSheet.getLastRow() <= 1) {
      Logger.log('Keine Kontobewegungen zum Lernen vorhanden');
      return;
    }

    // TODO: Implementiere Machine Learning Logic
    // 1. Finde gebuchte Kontobewegungen (Status: Gebucht)
    // 2. Analysiere häufige Verwendungszwecke
    // 3. Erstelle neue Mappings

    Logger.log('Lernfunktion noch nicht implementiert');

  } catch (e) {
    logError('learnFromKontobewegungen', e);
  }
}

/**
 * Test-Funktion
 */
function testKategorienmapping() {
  Logger.log('=== KATEGORIENMAPPING TEST ===');

  // Test verschiedene Verwendungszwecke
  const testCases = [
    { text: 'Überweisung von Revalenz GmbH', betrag: 800, expected: 'Miete Kaltmiete' },
    { text: 'Airbnb Auszahlung März', betrag: 1500, expected: 'Airbnb Miete' },
    { text: 'Stadtwerke Strom 01/2025', betrag: -120, expected: 'Hauskosten Strom' },
    { text: 'Grundsteuer 2025', betrag: -300, expected: 'Grundsteuer' },
    { text: 'Handwerker Malerarbeiten', betrag: -450, expected: 'Instandhaltung & Reparatur' },
    { text: 'Unbekannte Zahlung', betrag: 100, expected: 'Sonstige Einnahmen' },
    { text: 'Unbekannte Ausgabe', betrag: -50, expected: 'Sonstige Ausgaben' }
  ];

  testCases.forEach(test => {
    const result = findKategorieByText(test.text, test.betrag);
    const match = result.kategorie === test.expected ? '✓' : '✗';
    Logger.log(match + ' "' + test.text + '" (' + test.betrag + ' €) → ' + result.kategorie + ' [' + result.confidence + ']');
  });

  Logger.log('=== TEST ENDE ===');
}
