/**
 * Einnahmen.gs - Verwaltung von Einnahmen (final gebucht)
 * Vermietungs-Buchhaltungssystem v1.0
 *
 * NEU: Single-Entry System (keine doppelte Buchführung)
 */

/**
 * Einnahmen-Kategorien
 * @returns {Array} Array mit Kategorien
 */
function getEinnahmenKategorien() {
  return [
    'Miete Kaltmiete',
    'Miete Nebenkosten',
    'Airbnb Miete',
    'Kaution Eingang',
    'Sonstige Einnahmen'
  ];
}

/**
 * Initialisiert Einnahmen-Sheet
 */
function initializeEinnahmen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Einnahmen');

  if (!sheet) {
    sheet = ss.insertSheet('Einnahmen');
  }

  // Prüfe ob bereits Daten vorhanden
  if (sheet.getLastRow() > 1) {
    Logger.log('Einnahmen-Sheet hat bereits Daten');
    return;
  }

  sheet.clear();

  // Header
  const headers = [
    'Datum',
    'Beleg-Nr',
    'Kategorie',
    'Betrag',
    'Verwendungszweck',
    'Vertrag-ID',
    'Immobilie-ID',
    'Zahlungsart',
    'Beleg-Link',
    'Kommentar'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formatierung Header
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // Spaltenbreiten
  sheet.setColumnWidth(1, 100);   // Datum
  sheet.setColumnWidth(2, 120);   // Beleg-Nr
  sheet.setColumnWidth(3, 150);   // Kategorie
  sheet.setColumnWidth(4, 100);   // Betrag
  sheet.setColumnWidth(5, 300);   // Verwendungszweck
  sheet.setColumnWidth(6, 120);   // Vertrag-ID
  sheet.setColumnWidth(7, 100);   // Immobilie-ID
  sheet.setColumnWidth(8, 100);   // Zahlungsart
  sheet.setColumnWidth(9, 150);   // Beleg-Link
  sheet.setColumnWidth(10, 250);  // Kommentar

  // Zahlenformat
  sheet.getRange('D:D').setNumberFormat('#,##0.00 "€"');

  // Datumsformat
  sheet.getRange('A:A').setNumberFormat('dd.mm.yyyy');

  // Datenvalidierung für Kategorie
  const kategorieRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(getEinnahmenKategorien(), true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('C2:C1000').setDataValidation(kategorieRule);

  // Datenvalidierung für Zahlungsart
  const zahlungsartRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Bank', 'Airbnb', 'PayPal', 'Bar'], true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('H2:H1000').setDataValidation(zahlungsartRule);

  // Freeze erste Zeile
  sheet.setFrozenRows(1);

  Logger.log('Einnahmen-Sheet initialisiert');
}

/**
 * Fügt Einnahme hinzu
 * @param {Object} einnahmeData - Einnahme-Daten
 * @returns {boolean} Erfolg
 */
function addEinnahme(einnahmeData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Einnahmen');

    if (!sheet) {
      throw new Error('Einnahmen-Sheet nicht gefunden!');
    }

    const datum = einnahmeData.datum instanceof Date ? einnahmeData.datum : parseDatumDeutsch(einnahmeData.datum);
    const belegNr = einnahmeData.belegNr || generateBelegNr();

    sheet.appendRow([
      datum,
      belegNr,
      einnahmeData.kategorie,
      einnahmeData.betrag,
      einnahmeData.verwendungszweck || '',
      einnahmeData.vertragId || '',
      einnahmeData.immobilieId || '',
      einnahmeData.zahlungsart || 'Bank',
      einnahmeData.belegLink || '',
      einnahmeData.kommentar || ''
    ]);

    Logger.log('Einnahme hinzugefügt: ' + belegNr + ' - ' + einnahmeData.betrag + ' € (' + einnahmeData.kategorie + ')');
    return true;

  } catch (e) {
    logError('addEinnahme', e);
    throw e;
  }
}

/**
 * Gibt alle Einnahmen zurück (mit Filter-Optionen)
 * @param {Object} filter - Filter-Optionen {jahr, kategorie, vertragId, immobilieId}
 * @returns {Array} Array mit Einnahmen
 */
function getEinnahmen(filter = {}) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Einnahmen');

    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const einnahmen = [];

    for (let i = 1; i < data.length; i++) {
      const datum = data[i][0];
      const jahr = datum instanceof Date ? datum.getFullYear() : null;

      // Filter anwenden
      if (filter.jahr && jahr !== filter.jahr) continue;
      if (filter.kategorie && data[i][2] !== filter.kategorie) continue;
      if (filter.vertragId && data[i][5] !== filter.vertragId) continue;
      if (filter.immobilieId && data[i][6] !== filter.immobilieId) continue;

      einnahmen.push({
        datum: datum,
        belegNr: data[i][1],
        kategorie: data[i][2],
        betrag: data[i][3],
        verwendungszweck: data[i][4],
        vertragId: data[i][5],
        immobilieId: data[i][6],
        zahlungsart: data[i][7],
        belegLink: data[i][8],
        kommentar: data[i][9]
      });
    }

    return einnahmen;

  } catch (e) {
    logError('getEinnahmen', e);
    return [];
  }
}

/**
 * Summiert Einnahmen nach Kategorie
 * @param {number} jahr - Jahr (optional)
 * @returns {Object} {kategorie: betrag}
 */
function sumEinnahmenByKategorie(jahr = null) {
  try {
    const filter = jahr ? { jahr: jahr } : {};
    const einnahmen = getEinnahmen(filter);
    const summen = {};

    // Initialisiere alle Kategorien mit 0
    getEinnahmenKategorien().forEach(kat => {
      summen[kat] = 0;
    });

    // Summiere
    einnahmen.forEach(e => {
      const kategorie = e.kategorie || 'Sonstige Einnahmen';
      summen[kategorie] = (summen[kategorie] || 0) + (e.betrag || 0);
    });

    return summen;

  } catch (e) {
    logError('sumEinnahmenByKategorie', e);
    return {};
  }
}

/**
 * Summiert Einnahmen insgesamt
 * @param {number} jahr - Jahr (optional)
 * @returns {number} Gesamtsumme
 */
function sumEinnahmenTotal(jahr = null) {
  const summen = sumEinnahmenByKategorie(jahr);
  return Object.values(summen).reduce((a, b) => a + b, 0);
}

/**
 * Test-Funktion
 */
function testEinnahmen() {
  Logger.log('=== EINNAHMEN TEST ===');

  Logger.log('Kategorien:');
  getEinnahmenKategorien().forEach(kat => {
    Logger.log('  - ' + kat);
  });

  const einnahmen = getEinnahmen({ jahr: 2025 });
  Logger.log('Anzahl Einnahmen (2025): ' + einnahmen.length);

  const summen = sumEinnahmenByKategorie(2025);
  Logger.log('Summen nach Kategorie (2025):');
  Object.keys(summen).forEach(kat => {
    if (summen[kat] > 0) {
      Logger.log('  ' + kat + ': ' + formatBetrag(summen[kat]));
    }
  });

  const total = sumEinnahmenTotal(2025);
  Logger.log('Gesamt-Einnahmen (2025): ' + formatBetrag(total));

  Logger.log('=== TEST ENDE ===');
}
