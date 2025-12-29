/**
 * Kontobewegungen.gs - Staging für Bank-Importe
 * Vermietungs-Buchhaltungssystem v1.0
 *
 * Angepasst von: Buchhaltungssystem v3.0
 * Änderungen: Single-Entry (keine Soll/Haben), Kategorie statt Kontonummer
 */

/**
 * Initialisiert Kontobewegungen-Sheet
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

  // Header
  const headers = [
    'Bankkonto',
    'Valutadatum',
    'Betrag',
    'Verwendungszweck',
    'Status',
    'Kategorie',
    'Vertrag-ID',
    'Immobilie-ID',
    'Kommentar',
    'Import-Datum'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formatierung Header
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // Spaltenbreiten
  sheet.setColumnWidth(1, 100);   // Bankkonto
  sheet.setColumnWidth(2, 100);   // Valutadatum
  sheet.setColumnWidth(3, 100);   // Betrag
  sheet.setColumnWidth(4, 350);   // Verwendungszweck
  sheet.setColumnWidth(5, 100);   // Status
  sheet.setColumnWidth(6, 180);   // Kategorie
  sheet.setColumnWidth(7, 120);   // Vertrag-ID
  sheet.setColumnWidth(8, 100);   // Immobilie-ID
  sheet.setColumnWidth(9, 250);   // Kommentar
  sheet.setColumnWidth(10, 100);  // Import-Datum

  // Zahlenformat für Betrag
  sheet.getRange('C:C').setNumberFormat('#,##0.00 "€"');

  // Datumsformat
  sheet.getRange('B:B').setNumberFormat('dd.mm.yyyy');
  sheet.getRange('J:J').setNumberFormat('dd.mm.yyyy');

  // Datenvalidierung für Status
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Neu', 'Zugeordnet', 'Gebucht', 'Ignoriert'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('E2:E1000').setDataValidation(statusRule);

  // Bedingte Formatierung für Status
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
      .setRanges([sheet.getRange('E2:E1000')])
      .build();
    const rules = sheet.getConditionalFormatRules();
    rules.push(rule);
    sheet.setConditionalFormatRules(rules);
  });

  // Freeze erste Zeile
  sheet.setFrozenRows(1);

  Logger.log('Kontobewegungen-Sheet initialisiert');
}

/**
 * Fügt Kontobewegung hinzu (aus CSV-Import)
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

    sheet.appendRow([
      bewegungData.bankkonto || '1200',
      datum,
      betrag,
      bewegungData.verwendungszweck || '',
      'Neu',
      kategorie,
      vertragId,
      kategorieMatch.immobilieId || '',
      kommentar,
      new Date()
    ]);

    return true;

  } catch (e) {
    logError('addKontobewegung', e);
    throw e;
  }
}

/**
 * Bucht alle zugeordneten Kontobewegungen
 * Schreibt Einnahmen (Betrag > 0) oder Ausgaben (Betrag < 0)
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
      const status = data[i][4];

      if (status !== 'Zugeordnet') continue;

      const bankkonto = data[i][0];
      const datum = data[i][1];
      const betrag = data[i][2];
      const verwendungszweck = data[i][3];
      const kategorie = data[i][5];
      const vertragId = data[i][6];
      const immobilieId = data[i][7];
      const kommentar = data[i][8];

      // Buche als Einnahme oder Ausgabe
      if (betrag > 0) {
        // Einnahme
        addEinnahme({
          datum: datum,
          kategorie: kategorie || 'Sonstige Einnahmen',
          betrag: betrag,
          verwendungszweck: verwendungszweck,
          vertragId: vertragId,
          immobilieId: immobilieId,
          zahlungsart: 'Bank',
          kommentar: kommentar
        });
        einnahmen++;
      } else {
        // Ausgabe
        addAusgabe({
          datum: datum,
          kategorie: kategorie || 'Sonstige Ausgaben',
          betrag: Math.abs(betrag),
          verwendungszweck: verwendungszweck,
          immobilieId: immobilieId,
          zahlungsart: 'Bank',
          kommentar: kommentar
        });
        ausgaben++;
      }

      // Setze Status auf "Gebucht"
      sheet.getRange(i + 1, 5).setValue('Gebucht');
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
      if (data[i][4] === 'Neu') {
        sheet.getRange(i + 1, 5).setValue('Zugeordnet');
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
 */
function aktualisiereKategorienVorschlaege() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Kontobewegungen');

    if (!sheet || sheet.getLastRow() <= 1) {
      showAlert('Keine Kontobewegungen vorhanden!', 'Fehler');
      return;
    }

    const data = sheet.getDataRange().getValues();
    let aktualisiert = 0;

    for (let i = 1; i < data.length; i++) {
      const status = data[i][4];
      if (status !== 'Neu') continue;

      const verwendungszweck = data[i][3];
      const betrag = data[i][2];

      // Neue Kategorie finden
      const kategorieMatch = findKategorieByText(verwendungszweck, betrag);

      if (kategorieMatch.kategorie) {
        sheet.getRange(i + 1, 6).setValue(kategorieMatch.kategorie);
        if (kategorieMatch.immobilieId) {
          sheet.getRange(i + 1, 8).setValue(kategorieMatch.immobilieId);
        }
        aktualisiert++;
      }

      // Payment-Matching (nur bei Einnahmen)
      if (betrag > 0) {
        const datum = data[i][1];
        const paymentMatch = matchPaymentToTenant(verwendungszweck, betrag, datum);
        if (paymentMatch.vertragId) {
          sheet.getRange(i + 1, 7).setValue(paymentMatch.vertragId);
          sheet.getRange(i + 1, 9).setValue(paymentMatch.note);
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
    const textLower = text.toLowerCase().substring(0, 50);

    for (let i = 1; i < data.length; i++) {
      const vorhandenDatum = data[i][1];
      const vorhandenDatumStr = formatDatum(vorhandenDatum);
      const vorhandenBetrag = data[i][2];
      const vorhandenText = (data[i][3] || '').toString().toLowerCase().substring(0, 50);

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
