/**
 * Bankkonten.gs - Bank-Verwaltung
 * Vermietungs-Buchhaltungssystem v1.0
 *
 * Kopiert von: Buchhaltungssystem v3.0 (unverändert)
 */

/**
 * Initialisiert Bankkonten-Sheet
 */
function initializeBankkonten() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Bankkonten');

  if (!sheet) {
    sheet = ss.insertSheet('Bankkonten');
  }

  // Prüfe ob bereits Daten vorhanden
  if (sheet.getLastRow() > 1) {
    Logger.log('Bankkonten-Sheet hat bereits Daten');
    return;
  }

  sheet.clear();

  // Header
  const headers = ['Konto', 'Bezeichnung', 'IBAN', 'BIC', 'Bank', 'Aktiv'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formatierung Header
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // Standard-Bankkonten (für Vermietung)
  const standardKonten = [
    ['1200', 'Bank Hauptkonto (Mieteinnahmen)', '', '', 'Sparkasse', 'Ja'],
    ['1201', 'PayPal', '', '', 'PayPal', 'Ja']
  ];

  sheet.getRange(2, 1, standardKonten.length, 6).setValues(standardKonten);

  // Spaltenbreiten
  sheet.setColumnWidth(1, 80);    // Konto
  sheet.setColumnWidth(2, 250);   // Bezeichnung
  sheet.setColumnWidth(3, 200);   // IBAN
  sheet.setColumnWidth(4, 120);   // BIC
  sheet.setColumnWidth(5, 150);   // Bank
  sheet.setColumnWidth(6, 80);    // Aktiv

  // Freeze erste Zeile
  sheet.setFrozenRows(1);

  Logger.log('Bankkonten-Sheet initialisiert mit ' + standardKonten.length + ' Standard-Konten');
}

/**
 * Gibt alle aktiven Bankkonten zurück
 * @returns {Array} Array mit Bankkonten
 */
function getAlleBankkonten() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Bankkonten');

    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const konten = [];

    for (let i = 1; i < data.length; i++) {
      const konto = data[i][0] ? data[i][0].toString() : '';
      const bezeichnung = data[i][1] ? data[i][1].toString() : '';
      const iban = data[i][2] ? data[i][2].toString() : '';
      const bic = data[i][3] ? data[i][3].toString() : '';
      const bank = data[i][4] ? data[i][4].toString() : '';
      const aktiv = data[i][5] ? data[i][5].toString() : '';

      if (konto && aktiv === 'Ja') {
        konten.push({
          konto: konto,
          bezeichnung: bezeichnung,
          iban: iban,
          bic: bic,
          bank: bank
        });
      }
    }

    return konten;

  } catch (e) {
    logError('getAlleBankkonten', e);
    return [];
  }
}

/**
 * Findet Bankkonto anhand IBAN (Teil-String)
 * @param {string} ibanPart - Teil der IBAN
 * @returns {string|null} Kontonummer oder null
 */
function findBankkontoByIBAN(ibanPart) {
  if (!ibanPart || ibanPart.length < 10) {
    return null;
  }

  const konten = getAlleBankkonten();

  for (const konto of konten) {
    if (konto.iban && ibanPart.includes(konto.iban.substring(0, 10))) {
      return konto.konto;
    }
  }

  return null;
}

/**
 * Gibt Bankkonto-Info zurück
 * @param {string} kontoNr - Kontonummer
 * @returns {Object|null} Bankkonto-Objekt oder null
 */
function getBankkontoInfo(kontoNr) {
  const konten = getAlleBankkonten();
  return konten.find(k => k.konto === kontoNr.toString()) || null;
}

/**
 * Fügt neues Bankkonto hinzu
 * @param {string} konto - Kontonummer
 * @param {string} bezeichnung - Bezeichnung
 * @param {string} iban - IBAN
 * @param {string} bic - BIC
 * @param {string} bank - Bank-Name
 * @returns {boolean} Erfolg
 */
function addBankkonto(konto, bezeichnung, iban = '', bic = '', bank = '') {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Bankkonten');

    if (!sheet) {
      throw new Error('Bankkonten-Sheet nicht gefunden!');
    }

    // Prüfe ob Konto bereits existiert
    const konten = getAlleBankkonten();
    if (konten.find(k => k.konto === konto)) {
      throw new Error('Konto ' + konto + ' existiert bereits!');
    }

    // Füge hinzu
    sheet.appendRow([konto, bezeichnung, iban, bic, bank, 'Ja']);

    Logger.log('Bankkonto hinzugefügt: ' + konto + ' - ' + bezeichnung);
    return true;

  } catch (e) {
    logError('addBankkonto', e);
    throw e;
  }
}

/**
 * Test-Funktion
 */
function testBankkonten() {
  Logger.log('=== BANKKONTEN TEST ===');

  const konten = getAlleBankkonten();
  Logger.log('Anzahl Bankkonten: ' + konten.length);

  konten.forEach(k => {
    Logger.log('  ' + k.konto + ' - ' + k.bezeichnung + ' (' + k.bank + ')');
  });

  // Test IBAN-Suche
  const gefunden = findBankkontoByIBAN('DE89370400440532013000');
  Logger.log('IBAN-Suuchte: ' + (gefunden || 'Nicht gefunden'));

  Logger.log('=== TEST ENDE ===');
}
