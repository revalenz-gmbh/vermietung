/**
 * Kontobewegungen.gs - Staging für Bank-Importe (SSOT)
 * Vermietungs-Buchhaltungssystem v1.0
 *
 * Struktur entspricht Bank-CSV-Export + Kategorisierungsfelder
 * Copy & Paste von CSV-Daten direkt möglich!
 */

/**
 * Spalten-Konstanten für Kontobewegungen (CSV-Struktur)
 * Spalten 1-12: CSV-Daten (Bank-Export)
 * Spalten 13-18: Kategorisierungsfelder
 */
const KB_SPALTEN = {
  // CSV-Struktur (wie Bank-Export)
  AUFTRAGSKONTO: 0,
  BUCHUNGSTAG: 1,
  VALUTADATUM: 2,
  BUCHUNGSTEXT: 3,
  VERWENDUNGSZWECK: 4,
  BEGUENSTIGTER: 5,
  KONTONUMMER_IBAN: 6,
  BIC: 7,
  BETRAG: 8,
  WAEHRUNG: 9,
  INFO: 10,
  KATEGORIE_ORIGINAL: 11,
  // Kategorisierungsfelder
  STATUS: 12,
  KATEGORIE: 13,
  VERTRAG_ID: 14,
  IMMOBILIE_ID: 15,
  KOMMENTAR: 16,
  IMPORTIERT_AM: 17
};

/**
 * Initialisiert Kontobewegungen-Sheet
 * Struktur entspricht Bank-CSV-Export (12 Spalten) + Kategorisierungsfelder
 */
function initializeKontobewegungen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Kontobewegungen');

  if (!sheet) {
    sheet = ss.insertSheet('Kontobewegungen');
  }

  // Prüfe ob bereits Daten vorhanden
  if (sheet.getLastRow() > 1) {
    Logger.log('Kontobewegungen-Sheet hat bereits Daten');
    return;
  }

  sheet.clear();

  // Header: CSV-Struktur (12 Spalten) + Kategorisierungsfelder (6 Spalten)
  const headers = [
    // CSV-Struktur (wie Bank-Export) - Spalten A-L
    'Auftragskonto',
    'Buchungstag',
    'Valutadatum',
    'Buchungstext',
    'Verwendungszweck',
    'Beguenstigter/Zahlungspflichtiger',
    'Kontonummer/IBAN',
    'BIC (SWIFT-Code)',
    'Betrag',
    'Waehrung',
    'Info',
    'Kategorie (Bank)',
    // Kategorisierungsfelder - Spalten M-R
    'Status',
    'Kategorie',
    'Vertrag-ID',
    'Immobilie-ID',
    'Kommentar',
    'Importiert am'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formatierung Header: CSV-Spalten (blau) vs. Kategorisierungsfelder (grün)
  sheet.getRange(1, 1, 1, 12)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.getRange(1, 13, 1, 6)
    .setBackground('#34a853')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // Spaltenbreiten
  sheet.setColumnWidth(1, 180);   // Auftragskonto
  sheet.setColumnWidth(2, 100);   // Buchungstag
  sheet.setColumnWidth(3, 100);   // Valutadatum
  sheet.setColumnWidth(4, 130);   // Buchungstext
  sheet.setColumnWidth(5, 280);   // Verwendungszweck
  sheet.setColumnWidth(6, 200);   // Beguenstigter
  sheet.setColumnWidth(7, 180);   // Kontonummer/IBAN
  sheet.setColumnWidth(8, 100);   // BIC
  sheet.setColumnWidth(9, 100);   // Betrag
  sheet.setColumnWidth(10, 80);   // Waehrung
  sheet.setColumnWidth(11, 130);  // Info
  sheet.setColumnWidth(12, 130);  // Kategorie (Bank)
  sheet.setColumnWidth(13, 100);  // Status
  sheet.setColumnWidth(14, 150);  // Kategorie
  sheet.setColumnWidth(15, 120);  // Vertrag-ID
  sheet.setColumnWidth(16, 120);  // Immobilie-ID
  sheet.setColumnWidth(17, 250);  // Kommentar
  sheet.setColumnWidth(18, 130);  // Importiert am

  // Zahlenformat für Betrag
  sheet.getRange('I:I').setNumberFormat('#,##0.00 "€"');

  // Datumsformat
  sheet.getRange('B:B').setNumberFormat('dd.mm.yyyy');
  sheet.getRange('C:C').setNumberFormat('dd.mm.yyyy');
  sheet.getRange('R:R').setNumberFormat('dd.mm.yyyy hh:mm');

  // Datenvalidierung für Status
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Neu', 'Zugeordnet', 'Gebucht', 'Ignoriert'], true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('M2:M10000').setDataValidation(statusRule);

  // Bedingte Formatierung für Status (Spalte M)
  const statusColors = [
    { status: 'Neu', color: '#fff3cd' },        // Gelb
    { status: 'Zugeordnet', color: '#d4edda' }, // Grün
    { status: 'Gebucht', color: '#cce5ff' },    // Blau
    { status: 'Ignoriert', color: '#f8d7da' }   // Rot
  ];

  statusColors.forEach(item => {
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(item.status)
      .setBackground(item.color)
      .setRanges([sheet.getRange('M2:M10000')])
      .build();
    const rules = sheet.getConditionalFormatRules();
    rules.push(rule);
    sheet.setConditionalFormatRules(rules);
  });

  // Freeze erste Zeile
  sheet.setFrozenRows(1);

  Logger.log('Kontobewegungen-Sheet initialisiert (CSV-Struktur)');
}

/**
 * Fügt Kontobewegung hinzu (aus automatischem CSV-Import)
 * Schreibt in die neue 18-Spalten-Struktur
 * @param {Object} bewegungData - Bewegungsdaten
 * @returns {boolean} Erfolg
 */
function addKontobewegung(bewegungData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Kontobewegungen');

    if (!sheet) {
      throw new Error('Kontobewegungen-Sheet nicht gefunden!');
    }

    const datum = bewegungData.datum instanceof Date ? bewegungData.datum : parseDatumDeutsch(bewegungData.datum);
    const betrag = parseBetragDeutsch(bewegungData.betrag);

    // Auto-Kategorie-Zuordnung
    const kategorieMatch = findKategorieByText(bewegungData.verwendungszweck, betrag);
    const kategorie = bewegungData.kategorie || kategorieMatch.kategorie || '';

    // Auto-Payment-Matching (nur bei positiven Beträgen = Einnahmen)
    let vertragId = bewegungData.vertragId || '';
    let kommentar = bewegungData.kommentar || '';

    if (betrag > 0) {
      const paymentMatch = matchPaymentToTenant(bewegungData.verwendungszweck, betrag, datum);
      if (paymentMatch.vertragId) {
        vertragId = paymentMatch.vertragId;
        kommentar = paymentMatch.note;
      } else if (paymentMatch.note) {
        kommentar = paymentMatch.note;
      }
    }

    // 18 Spalten: CSV-Struktur + Kategorisierungsfelder
    sheet.appendRow([
      // CSV-Struktur (Spalten 1-12)
      bewegungData.auftragskonto || '',           // A: Auftragskonto
      datum,                                       // B: Buchungstag
      bewegungData.valutadatum || datum,          // C: Valutadatum
      bewegungData.buchungstext || '',            // D: Buchungstext
      bewegungData.verwendungszweck || '',        // E: Verwendungszweck
      bewegungData.beguenstigter || '',           // F: Beguenstigter
      bewegungData.kontonummer || '',             // G: Kontonummer/IBAN
      bewegungData.bic || '',                     // H: BIC
      betrag,                                      // I: Betrag
      'EUR',                                       // J: Waehrung
      '',                                          // K: Info
      bewegungData.kategorieBank || '',           // L: Kategorie (Bank)
      // Kategorisierungsfelder (Spalten 13-18)
      'Neu',                                       // M: Status
      kategorie,                                   // N: Kategorie
      vertragId,                                   // O: Vertrag-ID
      kategorieMatch.immobilieId || bewegungData.immobilieId || '', // P: Immobilie-ID
      kommentar,                                   // Q: Kommentar
      new Date()                                   // R: Importiert am
    ]);

    return true;

  } catch (e) {
    logError('addKontobewegung', e);
    throw e;
  }
}

/**
 * Batch-Import: Fügt mehrere Kontobewegungen auf einmal hinzu
 * Optimiert für große CSV-Importe (z.B. 1500+ Zeilen)
 * Schreibt in die neue 18-Spalten-Struktur
 * @param {Array} bewegungenArray - Array von Bewegungsobjekten
 */
function addKontobewegungenBatch(bewegungenArray) {
  try {
    if (!bewegungenArray || bewegungenArray.length === 0) {
      return;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Kontobewegungen');

    if (!sheet) {
      throw new Error('Kontobewegungen-Sheet nicht gefunden!');
    }

    const rows = [];
    const jetzt = new Date();

    // Verarbeite alle Bewegungen
    for (let i = 0; i < bewegungenArray.length; i++) {
      const bewegungData = bewegungenArray[i];

      const datum = bewegungData.datum instanceof Date ? bewegungData.datum : parseDatumDeutsch(bewegungData.datum);
      const betrag = parseBetragDeutsch(bewegungData.betrag);

      // Auto-Kategorie-Zuordnung
      const kategorieMatch = findKategorieByText(bewegungData.verwendungszweck, betrag);
      const kategorie = bewegungData.kategorie || kategorieMatch.kategorie || '';

      // Auto-Payment-Matching (nur bei positiven Beträgen = Einnahmen)
      let vertragId = bewegungData.vertragId || '';
      let kommentar = bewegungData.kommentar || '';

      if (betrag > 0) {
        const paymentMatch = matchPaymentToTenant(bewegungData.verwendungszweck, betrag, datum);
        if (paymentMatch.vertragId) {
          vertragId = paymentMatch.vertragId;
          kommentar = paymentMatch.note;
        } else if (paymentMatch.note) {
          kommentar = paymentMatch.note;
        }
      }

      // 18 Spalten: CSV-Struktur + Kategorisierungsfelder
      rows.push([
        // CSV-Struktur (Spalten 1-12)
        bewegungData.auftragskonto || '',           // A: Auftragskonto
        datum,                                       // B: Buchungstag
        bewegungData.valutadatum || datum,          // C: Valutadatum
        bewegungData.buchungstext || '',            // D: Buchungstext
        bewegungData.verwendungszweck || '',        // E: Verwendungszweck
        bewegungData.beguenstigter || '',           // F: Beguenstigter
        bewegungData.kontonummer || '',             // G: Kontonummer/IBAN
        bewegungData.bic || '',                     // H: BIC
        betrag,                                      // I: Betrag
        'EUR',                                       // J: Waehrung
        '',                                          // K: Info
        bewegungData.kategorieBank || '',           // L: Kategorie (Bank)
        // Kategorisierungsfelder (Spalten 13-18)
        'Neu',                                       // M: Status
        kategorie,                                   // N: Kategorie
        vertragId,                                   // O: Vertrag-ID
        kategorieMatch.immobilieId || bewegungData.immobilieId || '', // P: Immobilie-ID
        kommentar,                                   // Q: Kommentar
        jetzt                                        // R: Importiert am
      ]);
    }

    // Schreibe alle Zeilen auf einmal (viel schneller!)
    if (rows.length > 0) {
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
      Logger.log('Batch-Import: ' + rows.length + ' Zeilen auf einmal geschrieben');
    }

    return true;

  } catch (e) {
    logError('addKontobewegungenBatch', e);
    throw e;
  }
}

/**
 * Bucht alle zugeordneten Kontobewegungen
 * Schreibt Einnahmen (Betrag > 0) oder Ausgaben (Betrag < 0)
 * Verwendet die neue 18-Spalten-CSV-Struktur
 */
function bucheKontobewegungen() {
  try {
    const ui = SpreadsheetApp.getUi();

    const response = ui.alert(
      'Kontobewegungen buchen',
      'Alle Bewegungen mit Status "Zugeordnet" werden gebucht.\n\nFortfahren?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      return;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Kontobewegungen');

    if (!sheet || sheet.getLastRow() <= 1) {
      showAlert('Keine Kontobewegungen vorhanden!', 'Fehler');
      return;
    }

    const data = sheet.getDataRange().getValues();
    let gebuchteZeilen = 0;
    let einnahmen = 0;
    let ausgaben = 0;

    // Durchlaufe alle Zeilen (rückwärts, damit Zeilen-Indizes stabil bleiben)
    for (let i = data.length - 1; i >= 1; i--) {
      // Neue Spalten-Struktur (18 Spalten)
      const status = data[i][KB_SPALTEN.STATUS];  // Spalte M (Index 12)

      if (status !== 'Zugeordnet') continue;

      // CSV-Daten (Spalten 1-12)
      const buchungstag = data[i][KB_SPALTEN.BUCHUNGSTAG];  // B
      const valutadatum = data[i][KB_SPALTEN.VALUTADATUM];  // C
      const buchungstext = data[i][KB_SPALTEN.BUCHUNGSTEXT]; // D
      const verwendungszweck = data[i][KB_SPALTEN.VERWENDUNGSZWECK]; // E
      const beguenstigter = data[i][KB_SPALTEN.BEGUENSTIGTER]; // F
      const betrag = parseBetragDeutsch(data[i][KB_SPALTEN.BETRAG]); // I
      
      // Kategorisierungsfelder (Spalten 13-18)
      const kategorie = data[i][KB_SPALTEN.KATEGORIE];  // N
      const vertragId = data[i][KB_SPALTEN.VERTRAG_ID]; // O
      const immobilieId = data[i][KB_SPALTEN.IMMOBILIE_ID]; // P
      const kommentar = data[i][KB_SPALTEN.KOMMENTAR];  // Q

      // Datum: Buchungstag oder Valutadatum
      const datum = parseDatumDeutsch(buchungstag) || parseDatumDeutsch(valutadatum);
      
      if (!datum) {
        Logger.log('Zeile ' + (i + 1) + ': Kein gültiges Datum');
        continue;
      }

      // Kombiniere Verwendungszweck für bessere Lesbarkeit
      let vollstaendigerVerwendungszweck = verwendungszweck || '';
      if (beguenstigter) {
        vollstaendigerVerwendungszweck = beguenstigter + ' | ' + vollstaendigerVerwendungszweck;
      }
      if (buchungstext && buchungstext !== verwendungszweck) {
        vollstaendigerVerwendungszweck = buchungstext + ' | ' + vollstaendigerVerwendungszweck;
      }

      // Buche als Einnahme oder Ausgabe
      if (betrag > 0) {
        // Einnahme
        addEinnahme({
          datum: datum,
          kategorie: kategorie || 'Sonstige Einnahmen',
          betrag: betrag,
          verwendungszweck: vollstaendigerVerwendungszweck,
          vertragId: vertragId,
          immobilieId: immobilieId,
          zahlungsart: 'Bank',
          kommentar: kommentar
        });
        einnahmen++;
      } else if (betrag < 0) {
        // Ausgabe
        addAusgabe({
          datum: datum,
          kategorie: kategorie || 'Sonstige Ausgaben',
          betrag: Math.abs(betrag),
          verwendungszweck: vollstaendigerVerwendungszweck,
          immobilieId: immobilieId,
          zahlungsart: 'Bank',
          kommentar: kommentar
        });
        ausgaben++;
      } else {
        // Betrag = 0 → überspringen
        continue;
      }

      // Setze Status auf "Gebucht" (Spalte M = Index 13)
      sheet.getRange(i + 1, KB_SPALTEN.STATUS + 1).setValue('Gebucht');
      gebuchteZeilen++;
    }

    if (gebuchteZeilen === 0) {
      showAlert('Keine Bewegungen mit Status "Zugeordnet" gefunden!', 'Info');
      return;
    }

    Logger.log('Kontobewegungen gebucht: ' + gebuchteZeilen + ' (' + einnahmen + ' Einnahmen, ' + ausgaben + ' Ausgaben)');
    showToast(gebuchteZeilen + ' Kontobewegungen gebucht (' + einnahmen + ' Einnahmen, ' + ausgaben + ' Ausgaben)', 'Erfolg', 5);

  } catch (e) {
    logError('bucheKontobewegungen', e);
    showAlert('Fehler beim Buchen:\n' + e.toString(), 'Fehler');
  }
}

/**
 * Markiert alle "Neu" Bewegungen als "Zugeordnet"
 * Verwendet die neue 18-Spalten-CSV-Struktur
 */
function markAlleAlsZugeordnet() {
  try {
    const ui = SpreadsheetApp.getUi();

    const response = ui.alert(
      'Alle als zugeordnet markieren',
      'Alle Bewegungen mit Status "Neu" werden auf "Zugeordnet" gesetzt.\n\nFortfahren?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      return;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Kontobewegungen');

    if (!sheet || sheet.getLastRow() <= 1) {
      showAlert('Keine Kontobewegungen vorhanden!', 'Fehler');
      return;
    }

    const data = sheet.getDataRange().getValues();
    let geaendert = 0;

    for (let i = 1; i < data.length; i++) {
      // Status in Spalte M (Index 12)
      if (data[i][KB_SPALTEN.STATUS] === 'Neu') {
        sheet.getRange(i + 1, KB_SPALTEN.STATUS + 1).setValue('Zugeordnet');
        geaendert++;
      }
    }

    if (geaendert === 0) {
      showAlert('Keine Bewegungen mit Status "Neu" gefunden!', 'Info');
      return;
    }

    Logger.log('Als zugeordnet markiert: ' + geaendert);
    showToast(geaendert + ' Bewegungen als zugeordnet markiert', 'Erfolg', 3);

  } catch (e) {
    logError('markAlleAlsZugeordnet', e);
    showAlert('Fehler:\n' + e.toString(), 'Fehler');
  }
}

/**
 * Aktualisiert Kategorien-Vorschläge für alle "Neu" Bewegungen
 * Verwendet die neue 18-Spalten-CSV-Struktur
 */
function aktualisiereKategorienVorschlaege() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Kontobewegungen');

    if (!sheet || sheet.getLastRow() <= 1) {
      showAlert('Keine Kontobewegungen vorhanden!', 'Fehler');
      return;
    }

    showToast('Aktualisiere Kategorien-Vorschläge...', 'Bitte warten', 3);

    const data = sheet.getDataRange().getValues();
    let aktualisiert = 0;

    for (let i = 1; i < data.length; i++) {
      // Status in Spalte M (Index 12)
      const status = data[i][KB_SPALTEN.STATUS];
      if (status !== 'Neu') continue;

      // Nur wenn Kategorie noch leer ist
      const vorhandeneKategorie = data[i][KB_SPALTEN.KATEGORIE];
      if (vorhandeneKategorie && vorhandeneKategorie.toString().trim()) {
        continue; // Bereits zugeordnet
      }

      // Verwendungszweck (Spalte E, Index 4) + Beguenstigter (Spalte F, Index 5)
      const verwendungszweck = data[i][KB_SPALTEN.VERWENDUNGSZWECK] || '';
      const beguenstigter = data[i][KB_SPALTEN.BEGUENSTIGTER] || '';
      const suchtext = beguenstigter + ' ' + verwendungszweck;
      
      const betrag = parseBetragDeutsch(data[i][KB_SPALTEN.BETRAG]);

      // Neue Kategorie finden
      const kategorieMatch = findKategorieByText(suchtext, betrag);

      if (kategorieMatch.kategorie) {
        // Kategorie in Spalte N (Index 13)
        sheet.getRange(i + 1, KB_SPALTEN.KATEGORIE + 1).setValue(kategorieMatch.kategorie);
        if (kategorieMatch.immobilieId) {
          // Immobilie-ID in Spalte P (Index 15)
          sheet.getRange(i + 1, KB_SPALTEN.IMMOBILIE_ID + 1).setValue(kategorieMatch.immobilieId);
        }
        aktualisiert++;
      }

      // Payment-Matching (nur bei Einnahmen)
      if (betrag > 0) {
        const datum = parseDatumDeutsch(data[i][KB_SPALTEN.BUCHUNGSTAG]) || 
                      parseDatumDeutsch(data[i][KB_SPALTEN.VALUTADATUM]);
        const paymentMatch = matchPaymentToTenant(suchtext, betrag, datum);
        if (paymentMatch.vertragId) {
          // Vertrag-ID in Spalte O (Index 14)
          sheet.getRange(i + 1, KB_SPALTEN.VERTRAG_ID + 1).setValue(paymentMatch.vertragId);
          // Kommentar in Spalte Q (Index 16)
          sheet.getRange(i + 1, KB_SPALTEN.KOMMENTAR + 1).setValue(paymentMatch.note);
        }
      }
    }

    if (aktualisiert === 0) {
      showAlert('Keine neuen Vorschläge gefunden.', 'Info');
      return;
    }

    Logger.log('Kategorien-Vorschläge aktualisiert: ' + aktualisiert);
    showToast(aktualisiert + ' Kategorien-Vorschläge aktualisiert', 'Erfolg', 3);

  } catch (e) {
    logError('aktualisiereKategorienVorschlaege', e);
    showAlert('Fehler:\n' + e.toString(), 'Fehler');
  }
}

/**
 * Prüft Duplikate (gleicher Tag + gleicher Betrag + ähnlicher Text)
 * Verwendet die neue 18-Spalten-CSV-Struktur
 * @param {Date} datum - Datum
 * @param {number} betrag - Betrag
 * @param {string} text - Verwendungszweck
 * @returns {boolean} true wenn Duplikat gefunden
 */
function istDuplikat(datum, betrag, text) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Kontobewegungen');

    if (!sheet || sheet.getLastRow() <= 1) {
      return false;
    }

    const data = sheet.getDataRange().getValues();
    const datumStr = formatDatum(datum);
    const textLower = (text || '').toLowerCase().substring(0, 50);

    for (let i = 1; i < data.length; i++) {
      // Buchungstag (Spalte B, Index 1) oder Valutadatum (Spalte C, Index 2)
      const vorhandenDatum = data[i][KB_SPALTEN.BUCHUNGSTAG] || data[i][KB_SPALTEN.VALUTADATUM];
      const vorhandenDatumStr = formatDatum(vorhandenDatum);
      
      // Betrag (Spalte I, Index 8)
      const vorhandenBetrag = parseBetragDeutsch(data[i][KB_SPALTEN.BETRAG]);
      
      // Verwendungszweck (Spalte E, Index 4)
      const vorhandenText = (data[i][KB_SPALTEN.VERWENDUNGSZWECK] || '').toString().toLowerCase().substring(0, 50);

      if (datumStr === vorhandenDatumStr &&
          Math.abs(vorhandenBetrag - betrag) < 0.01 &&
          vorhandenText === textLower) {
        return true;
      }
    }

    return false;

  } catch (e) {
    logError('istDuplikat', e);
    return false;
  }
}

/**
 * Test-Funktion
 */
function testKontobewegungen() {
  Logger.log('=== KONTOBEWEGUNGEN TEST ===');

  // Test: Duplikat-Erkennung
  const testDatum = new Date(2025, 0, 15);  // 15.01.2025
  const testBetrag = 750;
  const testText = 'Überweisung Max Mustermann Miete';

  const duplikat = istDuplikat(testDatum, testBetrag, testText);
  Logger.log('Duplikat-Test: ' + (duplikat ? 'Duplikat gefunden' : 'Kein Duplikat'));

  // Test: Bewegung hinzufügen
  try {
    addKontobewegung({
      bankkonto: '1200',
      datum: testDatum,
      betrag: testBetrag,
      verwendungszweck: testText
    });
    Logger.log('Kontobewegung hinzugefügt: ' + formatBetrag(testBetrag));
  } catch (e) {
    Logger.log('Fehler: ' + e.toString());
  }

  Logger.log('=== TEST ENDE ===');
}
