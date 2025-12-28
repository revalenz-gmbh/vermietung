/**
 * Utils.gs - Helper Functions
 * Vermietungs-Buchhaltungssystem v1.0
 *
 * Angepasst von: Buchhaltungssystem v3.0
 * Änderungen: generateBelegNr() für Einnahmen/Ausgaben angepasst
 */

/**
 * Parst deutsches Datumsformat
 * Unterstützt: DD.MM.YYYY, DD.MM.YY, YYYY-MM-DD, ISO
 * @param {string} datumString - Datum als String
 * @returns {Date|null} Date-Objekt oder null
 */
function parseDatumDeutsch(datumString) {
  if (!datumString) return null;

  const str = datumString.toString().trim();

  // Bereits ein Date-Objekt?
  if (datumString instanceof Date) {
    return datumString;
  }

  // ISO Format: YYYY-MM-DD oder YYYY-MM-DDTHH:mm:ss
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(str);
  }

  // Deutsches Format: DD.MM.YYYY oder DD.MM.YY
  const match = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (match) {
    let tag = parseInt(match[1]);
    let monat = parseInt(match[2]) - 1; // JavaScript: 0-based
    let jahr = parseInt(match[3]);

    // 2-stelliges Jahr → 4-stellig
    if (jahr < 100) {
      jahr += (jahr < 50 ? 2000 : 1900);
    }

    return new Date(jahr, monat, tag);
  }

  // Fallback: Versuche Standard-Parsing
  try {
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
}

/**
 * Parst deutschen Betrag
 * Unterstützt: -123,45 | 123.456,78 | 1,234.56 | -1.234,56 €
 * @param {string|number} betragString - Betrag als String oder Number
 * @returns {number} Betrag als Float
 */
function parseBetragDeutsch(betragString) {
  if (typeof betragString === 'number') {
    return betragString;
  }

  if (!betragString) return 0;

  // String bereinigen
  let str = betragString.toString()
    .trim()
    .replace(/€/g, '')
    .replace(/\s/g, '')
    .trim();

  // Leer?
  if (!str) return 0;

  // Deutsches Format: 1.234,56 → 1234.56
  // Prüfe ob letztes Komma vor 2-3 Stellen steht (Dezimaltrennzeichen)
  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');

  if (lastComma > lastDot && lastComma === str.length - 3) {
    // Deutsches Format: 1.234,56
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastDot === str.length - 3) {
    // Englisches Format: 1,234.56
    str = str.replace(/,/g, '');
  } else {
    // Keine Dezimalstellen oder unklar → entferne alle Trennzeichen außer letztem
    str = str.replace(/[.,]/g, (match, offset) => {
      return (offset === str.lastIndexOf(',') || offset === str.lastIndexOf('.')) ? '.' : '';
    });
  }

  return parseFloat(str) || 0;
}

/**
 * Formatiert Datum für Anzeige
 * @param {Date} date - Date-Objekt
 * @returns {string} DD.MM.YYYY
 */
function formatDatum(date) {
  if (!date || !(date instanceof Date)) return '';

  const tag = date.getDate().toString().padStart(2, '0');
  const monat = (date.getMonth() + 1).toString().padStart(2, '0');
  const jahr = date.getFullYear();

  return `${tag}.${monat}.${jahr}`;
}

/**
 * Formatiert Betrag für Anzeige
 * @param {number} betrag - Betrag
 * @param {boolean} mitWaehrung - Mit € Symbol (default: true)
 * @returns {string} 1.234,56 €
 */
function formatBetrag(betrag, mitWaehrung = true) {
  if (typeof betrag !== 'number' || isNaN(betrag)) {
    betrag = 0;
  }

  const formatted = betrag.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return mitWaehrung ? formatted + ' €' : formatted;
}

/**
 * Generiert Belegnummer
 * Format: YYYY-NNN (z.B. 2025-001)
 * ANGEPASST: Prüft beide Sheets (Einnahmen UND Ausgaben) für max. Nummer
 * @returns {string} Belegnummer
 */
function generateBelegNr() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const einnahmenSheet = ss.getSheetByName('Einnahmen');
  const ausgabenSheet = ss.getSheetByName('Ausgaben');

  const jahr = new Date().getFullYear();
  let maxNr = 0;

  // Prüfe Einnahmen
  if (einnahmenSheet && einnahmenSheet.getLastRow() > 1) {
    const belegNrs = einnahmenSheet.getRange(2, 2, einnahmenSheet.getLastRow() - 1, 1).getValues();
    belegNrs.forEach(row => {
      const belegNr = row[0] ? row[0].toString() : '';
      const match = belegNr.match(/^(\d{4})-(\d+)$/);
      if (match && parseInt(match[1]) === jahr) {
        const nr = parseInt(match[2]);
        if (nr > maxNr) maxNr = nr;
      }
    });
  }

  // Prüfe Ausgaben
  if (ausgabenSheet && ausgabenSheet.getLastRow() > 1) {
    const belegNrs = ausgabenSheet.getRange(2, 2, ausgabenSheet.getLastRow() - 1, 1).getValues();
    belegNrs.forEach(row => {
      const belegNr = row[0] ? row[0].toString() : '';
      const match = belegNr.match(/^(\d{4})-(\d+)$/);
      if (match && parseInt(match[1]) === jahr) {
        const nr = parseInt(match[2]);
        if (nr > maxNr) maxNr = nr;
      }
    });
  }

  const nextNr = (maxNr + 1).toString().padStart(3, '0');
  return jahr + '-' + nextNr;
}

/**
 * Loggt Fehler in separates Sheet
 * @param {string} function_name - Name der Funktion
 * @param {Error} error - Error-Objekt
 */
function logError(function_name, error) {
  try {
    Logger.log('ERROR in ' + function_name + ': ' + error.toString());

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let errorSheet = ss.getSheetByName('_Errors');

    if (!errorSheet) {
      errorSheet = ss.insertSheet('_Errors');
      errorSheet.getRange(1, 1, 1, 5).setValues([
        ['Timestamp', 'Function', 'Error', 'Stack', 'User']
      ]);
      errorSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
      errorSheet.hideSheet();
    }

    const timestamp = new Date();
    const stack = error.stack || 'No stack';
    const user = Session.getActiveUser().getEmail();

    errorSheet.appendRow([
      timestamp,
      function_name,
      error.toString(),
      stack,
      user
    ]);

  } catch (e) {
    Logger.log('Failed to log error: ' + e.toString());
  }
}

/**
 * Prüft ob Sheet existiert
 * @param {string} sheetName - Name des Sheets
 * @returns {boolean} true wenn existiert
 */
function sheetExists(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(sheetName) !== null;
}

/**
 * Erstellt Sheet falls nicht vorhanden
 * @param {string} sheetName - Name des Sheets
 * @returns {Sheet} Sheet-Objekt
 */
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  return sheet;
}

/**
 * Schützt Sheet (nur letzte N Zeilen editierbar)
 * @param {Sheet} sheet - Sheet-Objekt
 * @param {number} editableRows - Anzahl editierbare Zeilen (default: 10)
 */
function protectSheet(sheet, editableRows = 10) {
  try {
    const lastRow = sheet.getLastRow();

    if (lastRow <= editableRows + 1) {
      // Zu wenig Zeilen, kein Schutz nötig
      return;
    }

    // Schütze Zeilen 1 bis (lastRow - editableRows)
    const protection = sheet.getRange(1, 1, lastRow - editableRows, sheet.getMaxColumns()).protect();
    protection.setDescription('Historische Buchungen sind geschützt');

    // Warnung aber kein harter Schutz (Owner kann bearbeiten)
    protection.setWarningOnly(true);

  } catch (e) {
    Logger.log('Fehler beim Schützen des Sheets: ' + e.toString());
  }
}

/**
 * Zeigt Toast-Nachricht an
 * @param {string} message - Nachricht
 * @param {string} title - Titel (optional)
 * @param {number} timeout - Dauer in Sekunden (default: 3)
 */
function showToast(message, title = 'Info', timeout = 3) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message, title, timeout);
}

/**
 * Zeigt Alert-Dialog
 * @param {string} message - Nachricht
 * @param {string} title - Titel (optional)
 */
function showAlert(message, title = 'Vermietung') {
  SpreadsheetApp.getUi().alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Zeigt Ja/Nein-Dialog
 * @param {string} message - Nachricht
 * @param {string} title - Titel (optional)
 * @returns {boolean} true wenn JA
 */
function showConfirm(message, title = 'Bestätigung') {
  const response = SpreadsheetApp.getUi().alert(
    title,
    message,
    SpreadsheetApp.getUi().ButtonSet.YES_NO
  );

  return response === SpreadsheetApp.getUi().Button.YES;
}

/**
 * Gibt aktuelle System-Version zurück
 * @returns {string} Version
 */
function getVersion() {
  return '1.0.0';
}

/**
 * Test-Funktion für Utils
 */
function testUtils() {
  Logger.log('=== UTILS TEST ===');

  // Test Datum-Parsing
  Logger.log('Datum: ' + formatDatum(parseDatumDeutsch('15.01.2025')));
  Logger.log('Datum: ' + formatDatum(parseDatumDeutsch('2025-01-15')));

  // Test Betrag-Parsing
  Logger.log('Betrag: ' + formatBetrag(parseBetragDeutsch('1.234,56')));
  Logger.log('Betrag: ' + formatBetrag(parseBetragDeutsch('-123,45 €')));
  Logger.log('Betrag: ' + formatBetrag(parseBetragDeutsch('1,234.56')));

  // Test Belegnummer
  Logger.log('BelegNr: ' + generateBelegNr());

  Logger.log('Version: ' + getVersion());
  Logger.log('=== TEST ENDE ===');

  showToast('Utils-Test abgeschlossen. Siehe Logs.', 'Test', 5);
}
