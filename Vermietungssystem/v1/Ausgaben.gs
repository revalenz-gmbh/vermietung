/**
 * Ausgaben.gs - Verwaltung von Ausgaben (final gebucht)
 * Vermietungs-Buchhaltungssystem v1.0
 *
 * NEU: Single-Entry System (keine doppelte Buchführung)
 */

/**
 * Ausgaben-Kategorien
 * @returns {Array} Array mit Kategorien
 */
function getAusgabenKategorien() {
  return [
    'Instandhaltung & Reparatur',
    'Grundsteuer',
    'Versicherung Gebäude',
    'Versicherung Haftpflicht',
    'Hauskosten Heizung',
    'Hauskosten Wasser',
    'Hauskosten Strom',
    'Hauskosten Müll',
    'Hauskosten Reinigung',
    'Hauskosten Hausmeister',
    'Verwaltung & Buchhaltung',
    'Finanzierung Zinsen',
    'Abschreibung (AfA)',
    'Sonstige Ausgaben',
    'Kaution Rückzahlung'
  ];
}

/**
 * Initialisiert Ausgaben-Sheet
 */
function initializeAusgaben() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Ausgaben');

  if (!sheet) {
    sheet = ss.insertSheet('Ausgaben');
  }

  // Prüfe ob bereits Daten vorhanden
  if (sheet.getLastRow() > 1) {
    Logger.log('Ausgaben-Sheet hat bereits Daten');
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
    'Immobilie-ID',
    'Umlagefähig',
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
  sheet.setColumnWidth(3, 180);   // Kategorie
  sheet.setColumnWidth(4, 100);   // Betrag
  sheet.setColumnWidth(5, 300);   // Verwendungszweck
  sheet.setColumnWidth(6, 100);   // Immobilie-ID
  sheet.setColumnWidth(7, 100);   // Umlagefähig
  sheet.setColumnWidth(8, 100);   // Zahlungsart
  sheet.setColumnWidth(9, 150);   // Beleg-Link
  sheet.setColumnWidth(10, 250);  // Kommentar

  // Zahlenformat
  sheet.getRange('D:D').setNumberFormat('#,##0.00 "€"');

  // Datumsformat
  sheet.getRange('A:A').setNumberFormat('dd.mm.yyyy');

  // Datenvalidierung für Kategorie
  const kategorieRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(getAusgabenKategorien(), true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('C2:C1000').setDataValidation(kategorieRule);

  // Datenvalidierung für Umlagefähig
  const umlageRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Ja', 'Nein'], true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('G2:G1000').setDataValidation(umlageRule);

  // Datenvalidierung für Zahlungsart
  const zahlungsartRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Bank', 'Bar', 'Kreditkarte', 'PayPal'], true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('H2:H1000').setDataValidation(zahlungsartRule);

  // Freeze erste Zeile
  sheet.setFrozenRows(1);

  Logger.log('Ausgaben-Sheet initialisiert');
}

/**
 * Fügt Ausgabe hinzu
 * @param {Object} ausgabeData - Ausgabe-Daten
 * @returns {boolean} Erfolg
 */
function addAusgabe(ausgabeData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Ausgaben');

    if (!sheet) {
      throw new Error('Ausgaben-Sheet nicht gefunden!');
    }

    const datum = ausgabeData.datum instanceof Date ? ausgabeData.datum : parseDatumDeutsch(ausgabeData.datum);
    const belegNr = ausgabeData.belegNr || generateBelegNr();

    sheet.appendRow([
      datum,
      belegNr,
      ausgabeData.kategorie,
      Math.abs(ausgabeData.betrag),  // Ausgaben immer positiv
      ausgabeData.verwendungszweck || '',
      ausgabeData.immobilieId || '',
      ausgabeData.umlagefaehig || 'Nein',
      ausgabeData.zahlungsart || 'Bank',
      ausgabeData.belegLink || '',
      ausgabeData.kommentar || ''
    ]);

    Logger.log('Ausgabe hinzugefügt: ' + belegNr + ' - ' + ausgabeData.betrag + ' € (' + ausgabeData.kategorie + ')');
    return true;

  } catch (e) {
    logError('addAusgabe', e);
    throw e;
  }
}

/**
 * Gibt alle Ausgaben zurück (mit Filter-Optionen)
 * @param {Object} filter - Filter-Optionen {jahr, kategorie, immobilieId, umlagefaehig}
 * @returns {Array} Array mit Ausgaben
 */
function getAusgaben(filter = {}) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Ausgaben');

    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const ausgaben = [];

    for (let i = 1; i < data.length; i++) {
      const datum = data[i][0];
      const jahr = datum instanceof Date ? datum.getFullYear() : null;

      // Filter anwenden
      if (filter.jahr && jahr !== filter.jahr) continue;
      if (filter.kategorie && data[i][2] !== filter.kategorie) continue;
      if (filter.immobilieId && data[i][5] !== filter.immobilieId) continue;
      if (filter.umlagefaehig !== undefined && data[i][6] !== filter.umlagefaehig) continue;

      ausgaben.push({
        datum: datum,
        belegNr: data[i][1],
        kategorie: data[i][2],
        betrag: data[i][3],
        verwendungszweck: data[i][4],
        immobilieId: data[i][5],
        umlagefaehig: data[i][6],
        zahlungsart: data[i][7],
        belegLink: data[i][8],
        kommentar: data[i][9]
      });
    }

    return ausgaben;

  } catch (e) {
    logError('getAusgaben', e);
    return [];
  }
}

/**
 * Summiert Ausgaben nach Kategorie
 * @param {number} jahr - Jahr (optional)
 * @returns {Object} {kategorie: betrag}
 */
function sumAusgabenByKategorie(jahr = null) {
  try {
    const filter = jahr ? { jahr: jahr } : {};
    const ausgaben = getAusgaben(filter);
    const summen = {};

    // Initialisiere alle Kategorien mit 0
    getAusgabenKategorien().forEach(kat => {
      summen[kat] = 0;
    });

    // Summiere
    ausgaben.forEach(a => {
      const kategorie = a.kategorie || 'Sonstige Ausgaben';
      summen[kategorie] = (summen[kategorie] || 0) + (a.betrag || 0);
    });

    return summen;

  } catch (e) {
    logError('sumAusgabenByKategorie', e);
    return {};
  }
}

/**
 * Summiert Ausgaben insgesamt
 * @param {number} jahr - Jahr (optional)
 * @returns {number} Gesamtsumme
 */
function sumAusgabenTotal(jahr = null) {
  const summen = sumAusgabenByKategorie(jahr);
  return Object.values(summen).reduce((a, b) => a + b, 0);
}

/**
 * Summiert umlagefähige Hauskosten (für Nebenkostenabrechnung)
 * @param {number} jahr - Jahr
 * @param {string} immobilieId - Immobilie-ID (optional)
 * @returns {number} Summe umlagefähige Kosten
 */
function sumUmlagefaehigeKosten(jahr, immobilieId = null) {
  const filter = { jahr: jahr, umlagefaehig: 'Ja' };
  if (immobilieId) filter.immobilieId = immobilieId;

  const ausgaben = getAusgaben(filter);
  return ausgaben.reduce((sum, a) => sum + (a.betrag || 0), 0);
}

/**
 * Test-Funktion
 */
function testAusgaben() {
  Logger.log('=== AUSGABEN TEST ===');

  Logger.log('Kategorien:');
  getAusgabenKategorien().forEach(kat => {
    Logger.log('  - ' + kat);
  });

  const ausgaben = getAusgaben({ jahr: 2025 });
  Logger.log('Anzahl Ausgaben (2025): ' + ausgaben.length);

  const summen = sumAusgabenByKategorie(2025);
  Logger.log('Summen nach Kategorie (2025):');
  Object.keys(summen).forEach(kat => {
    if (summen[kat] > 0) {
      Logger.log('  ' + kat + ': ' + formatBetrag(summen[kat]));
    }
  });

  const total = sumAusgabenTotal(2025);
  Logger.log('Gesamt-Ausgaben (2025): ' + formatBetrag(total));

  const umlagefaehig = sumUmlagefaehigeKosten(2025);
  Logger.log('Umlagefähige Kosten (2025): ' + formatBetrag(umlagefaehig));

  Logger.log('=== TEST ENDE ===');
}
