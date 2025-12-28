/**
 * Zahlungen.gs - Payment Matching & Tracking
 * Vermietungs-Buchhaltungssystem v1.0
 *
 * NEU: Automatisches Matching von Zahlungen zu Mietern
 */

/**
 * Initialisiert Zahlungen-Sheet (optional - für detailliertes Tracking)
 */
function initializeZahlungen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Zahlungen');

  if (!sheet) {
    sheet = ss.insertSheet('Zahlungen');
  }

  // Prüfe ob bereits Daten vorhanden
  if (sheet.getLastRow() > 1) {
    Logger.log('Zahlungen-Sheet hat bereits Daten');
    return;
  }

  sheet.clear();

  // Header
  const headers = [
    'Zahlung-ID',
    'Vertrag-ID',
    'Monat/Periode',
    'Fällig-Datum',
    'Betrag-Soll',
    'Betrag-Ist',
    'Gezahlt-Datum',
    'Status',
    'Differenz',
    'Kommentar'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formatierung Header
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // Spaltenbreiten
  sheet.setColumnWidth(1, 120);   // Zahlung-ID
  sheet.setColumnWidth(2, 120);   // Vertrag-ID
  sheet.setColumnWidth(3, 120);   // Monat/Periode
  sheet.setColumnWidth(4, 100);   // Fällig-Datum
  sheet.setColumnWidth(5, 110);   // Betrag-Soll
  sheet.setColumnWidth(6, 110);   // Betrag-Ist
  sheet.setColumnWidth(7, 110);   // Gezahlt-Datum
  sheet.setColumnWidth(8, 120);   // Status
  sheet.setColumnWidth(9, 100);   // Differenz
  sheet.setColumnWidth(10, 300);  // Kommentar

  // Zahlenformat
  sheet.getRange('E:E').setNumberFormat('#,##0.00 "€"');
  sheet.getRange('F:F').setNumberFormat('#,##0.00 "€"');
  sheet.getRange('I:I').setNumberFormat('#,##0.00 "€"');

  // Datumsformat
  sheet.getRange('D:D').setNumberFormat('dd.mm.yyyy');
  sheet.getRange('G:G').setNumberFormat('dd.mm.yyyy');

  // Datenvalidierung für Status
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Offen', 'Teilzahlung', 'Bezahlt', 'Überfällig'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('H2:H1000').setDataValidation(statusRule);

  // Bedingte Formatierung für Status
  const statusColors = [
    { status: 'Offen', color: '#fff3cd' },        // Gelb
    { status: 'Teilzahlung', color: '#ffeeba' },  // Orange
    { status: 'Bezahlt', color: '#d4edda' },      // Grün
    { status: 'Überfällig', color: '#f8d7da' }    // Rot
  ];

  statusColors.forEach(item => {
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(item.status)
      .setBackground(item.color)
      .setRanges([sheet.getRange('H2:H1000')])
      .build();
    const rules = sheet.getConditionalFormatRules();
    rules.push(rule);
    sheet.setConditionalFormatRules(rules);
  });

  // Freeze erste Zeile
  sheet.setFrozenRows(1);

  Logger.log('Zahlungen-Sheet initialisiert');
}

/**
 * KERN-ALGORITHMUS: Matcht Zahlung zu Mieter/Vertrag
 * @param {string} text - Verwendungszweck
 * @param {number} betrag - Betrag (positiv)
 * @param {Date} datum - Zahlungsdatum
 * @returns {Object} {vertragId, confidence, note}
 */
function matchPaymentToTenant(text, betrag, datum) {
  try {
    const textLower = text.toLowerCase();
    const betragAbs = Math.abs(betrag);

    // 1. Prüfe ob Vertrag-ID im Text vorhanden
    const vertragMatch = text.match(/MV-\d{4}-\d{3}/i);
    if (vertragMatch) {
      const vertrag = getMietvertragById(vertragMatch[0]);
      if (vertrag && vertrag.status === 'Aktiv') {
        return {
          vertragId: vertrag.vertragId,
          confidence: 'High',
          note: 'Vertrag-ID im Text gefunden'
        };
      }
    }

    // 2. Prüfe Mieter-Name
    const aktiveMietvertraege = getAktiveMietvertraege();

    for (const vertrag of aktiveMietvertraege) {
      const mieterName = vertrag.mieterName.toLowerCase();

      // Split Name in Teile (für "Max Mustermann" → ["max", "mustermann"])
      const nameParts = mieterName.split(/\s+/);

      // Prüfe ob mindestens ein Name-Teil im Text vorkommt
      const nameFound = nameParts.some(part => part.length > 2 && textLower.includes(part));

      if (nameFound) {
        // Verifiziere Betrag (±20% Toleranz)
        const expectedRent = (vertrag.grundmiete || 0) + (vertrag.nebenkosten || 0);

        if (betragAbs >= expectedRent * 0.8 && betragAbs <= expectedRent * 1.2) {
          return {
            vertragId: vertrag.vertragId,
            confidence: 'High',
            note: 'Mieter-Name + Betrag match'
          };
        } else {
          return {
            vertragId: vertrag.vertragId,
            confidence: 'Medium',
            note: 'Mieter-Name match, Betrag weicht ab (Soll: ' + formatBetrag(expectedRent, false) + ' €)'
          };
        }
      }
    }

    // 3. Prüfe IBAN (falls im Text)
    if (text.length > 20) {
      for (const vertrag of aktiveMietvertraege) {
        if (vertrag.ibanAirbnb && vertrag.ibanAirbnb.length > 10) {
          const ibanPart = vertrag.ibanAirbnb.substring(0, 10).toLowerCase();
          if (textLower.includes(ibanPart)) {
            return {
              vertragId: vertrag.vertragId,
              confidence: 'High',
              note: 'IBAN match'
            };
          }
        }
      }
    }

    // 4. Prüfe Airbnb
    if (textLower.includes('airbnb')) {
      // Airbnb Lump-Sum - kann nicht einzelnen Vertrag zuordnen
      return {
        vertragId: null,
        confidence: 'Low',
        note: 'Airbnb lump sum - manuelle Zuordnung erforderlich'
      };
    }

    // 5. Kein Match gefunden
    return {
      vertragId: null,
      confidence: 'Low',
      note: 'Kein Mieter-Match gefunden'
    };

  } catch (e) {
    logError('matchPaymentToTenant', e);
    return {
      vertragId: null,
      confidence: 'Error',
      note: 'Fehler beim Matching: ' + e.toString()
    };
  }
}

/**
 * Prüft fehlende Zahlungen (Soll vs. Ist)
 * Vergleicht erwartete Zahlungen aus Mietverträgen mit tatsächlichen Einnahmen
 * @param {number} jahr - Jahr
 * @param {number} monat - Monat (1-12, optional - wenn leer: aktueller Monat)
 * @returns {Array} Array mit offenen Zahlungen
 */
function checkMissingPayments(jahr = null, monat = null) {
  try {
    if (!jahr) jahr = new Date().getFullYear();
    if (!monat) monat = new Date().getMonth() + 1; // JavaScript: 0-based

    const vertraege = getAktiveMietvertraege();
    const einnahmen = getEinnahmen({ jahr: jahr });

    const offeneZahlungen = [];

    vertraege.forEach(vertrag => {
      // Berechne erwartete Zahlung
      const erwartet = (vertrag.grundmiete || 0) + (vertrag.nebenkosten || 0);

      // Finde tatsächliche Zahlungen für diesen Vertrag in diesem Monat
      const zahlungen = einnahmen.filter(e => {
        const eDatum = e.datum instanceof Date ? e.datum : parseDatumDeutsch(e.datum);
        const eMonat = eDatum ? eDatum.getMonth() + 1 : 0;
        return e.vertragId === vertrag.vertragId && eMonat === monat;
      });

      const gezahlt = zahlungen.reduce((sum, z) => sum + (z.betrag || 0), 0);
      const differenz = erwartet - gezahlt;

      if (differenz > 0.01) {  // > 1 Cent
        offeneZahlungen.push({
          vertragId: vertrag.vertragId,
          mieterName: vertrag.mieterName,
          monat: monat,
          jahr: jahr,
          erwartet: erwartet,
          gezahlt: gezahlt,
          differenz: differenz,
          status: gezahlt > 0 ? 'Teilzahlung' : 'Offen'
        });
      }
    });

    return offeneZahlungen;

  } catch (e) {
    logError('checkMissingPayments', e);
    return [];
  }
}

/**
 * Gibt alle offenen Zahlungen zurück (für Dashboard)
 * @returns {Array} Array mit offenen Zahlungen
 */
function getOffeneZahlungen() {
  try {
    const heute = new Date();
    const jahr = heute.getFullYear();
    const monat = heute.getMonth() + 1;

    const offene = [];

    // Prüfe aktuellen Monat
    const aktuellerMonat = checkMissingPayments(jahr, monat);
    offene.push(...aktuellerMonat);

    // Prüfe Vormonat (falls noch offen)
    const vormonat = monat === 1 ? 12 : monat - 1;
    const vormonatJahr = monat === 1 ? jahr - 1 : jahr;
    const vormonatOffene = checkMissingPayments(vormonatJahr, vormonat);
    offene.push(...vormonatOffene);

    // Markiere überfällige Zahlungen
    offene.forEach(z => {
      const faelligDatum = new Date(z.jahr, z.monat - 1, 5);  // 5. des Monats
      if (faelligDatum < heute && z.status === 'Offen') {
        z.status = 'Überfällig';
        z.tageUeberfaellig = Math.ceil((heute - faelligDatum) / (1000 * 60 * 60 * 24));
      }
    });

    return offene;

  } catch (e) {
    logError('getOffeneZahlungen', e);
    return [];
  }
}

/**
 * Zeigt Dialog mit offenen Zahlungen
 */
function showOffeneZahlungen() {
  const ui = SpreadsheetApp.getUi();
  const offene = getOffeneZahlungen();

  if (offene.length === 0) {
    ui.alert('Keine offenen Zahlungen', 'Alle Mieten sind bezahlt! ✓', ui.ButtonSet.OK);
    return;
  }

  let message = '💳 Offene Zahlungen:\n\n';

  offene.forEach(z => {
    message += '• ' + z.mieterName + ' (' + z.vertragId + ')\n';
    message += '  Monat: ' + z.monat + '/' + z.jahr + '\n';
    message += '  Erwartet: ' + formatBetrag(z.erwartet) + '\n';
    message += '  Gezahlt: ' + formatBetrag(z.gezahlt) + '\n';
    message += '  Differenz: ' + formatBetrag(z.differenz) + '\n';
    message += '  Status: ' + z.status;
    if (z.tageUeberfaellig) {
      message += ' (' + z.tageUeberfaellig + ' Tage überfällig)';
    }
    message += '\n\n';
  });

  message += 'Gesamt ausstehend: ' + formatBetrag(offene.reduce((sum, z) => sum + z.differenz, 0));

  ui.alert('Offene Zahlungen', message, ui.ButtonSet.OK);
}

/**
 * Erstellt Zahlungsstatus-Report für ein Jahr
 * @param {number} jahr - Jahr
 */
function createZahlungsstatusReport(jahr) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = 'Zahlungsstatus_' + jahr;
    let sheet = ss.getSheetByName(sheetName);

    if (sheet) {
      const response = SpreadsheetApp.getUi().alert(
        'Sheet existiert bereits',
        'Sheet "' + sheetName + '" existiert bereits. Überschreiben?',
        SpreadsheetApp.getUi().ButtonSet.YES_NO
      );

      if (response !== SpreadsheetApp.getUi().Button.YES) {
        return;
      }

      ss.deleteSheet(sheet);
    }

    sheet = ss.insertSheet(sheetName);

    // Header
    const headers = ['Vertrag-ID', 'Mieter', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez', 'Status'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Formatierung Header
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#4285f4')
      .setFontColor('#ffffff')
      .setFontWeight('bold');

    // Daten für jeden Vertrag
    const vertraege = getAlleMietvertraege();  // Alle Verträge (inkl. abgelaufene)
    const rows = [];

    vertraege.forEach(vertrag => {
      const row = [vertrag.vertragId, vertrag.mieterName];

      // Prüfe jeden Monat
      for (let monat = 1; monat <= 12; monat++) {
        const missing = checkMissingPayments(jahr, monat);
        const vertragMissing = missing.find(m => m.vertragId === vertrag.vertragId);

        if (vertragMissing) {
          if (vertragMissing.status === 'Teilzahlung') {
            row.push('~');  // Teilzahlung
          } else {
            row.push('✗');  // Fehlt
          }
        } else {
          row.push('✓');  // Bezahlt
        }
      }

      // Status-Spalte
      const offeneMonateCount = row.filter(cell => cell === '✗').length;
      const status = offeneMonateCount === 0 ? 'OK' : offeneMonateCount + ' fehlt';
      row.push(status);

      rows.push(row);
    });

    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }

    // Legende
    const legendeRow = sheet.getLastRow() + 2;
    sheet.getRange(legendeRow, 1).setValue('Legende:');
    sheet.getRange(legendeRow + 1, 1).setValue('✓ = Bezahlt');
    sheet.getRange(legendeRow + 2, 1).setValue('✗ = Fehlt');
    sheet.getRange(legendeRow + 3, 1).setValue('~ = Teilzahlung');

    // Freeze erste Zeile
    sheet.setFrozenRows(1);

    Logger.log('Zahlungsstatus-Report erstellt: ' + sheetName);
    showToast('Zahlungsstatus-Report erstellt', sheetName, 5);

    // Öffne Sheet
    ss.setActiveSheet(sheet);

  } catch (e) {
    logError('createZahlungsstatusReport', e);
    throw e;
  }
}

/**
 * Test-Funktion
 */
function testZahlungen() {
  Logger.log('=== ZAHLUNGEN TEST ===');

  // Test Payment Matching
  const testCases = [
    { text: 'Überweisung Max Mustermann Miete Jan', betrag: 750, expected: 'MV-2025-001' },
    { text: 'MV-2025-002 Revalenz Büro', betrag: 1000, expected: 'MV-2025-002' },
    { text: 'Airbnb Auszahlung', betrag: 1500, expected: null },
    { text: 'Unbekannte Zahlung', betrag: 500, expected: null }
  ];

  testCases.forEach(test => {
    const result = matchPaymentToTenant(test.text, test.betrag, new Date());
    const match = result.vertragId === test.expected ? '✓' : '✗';
    Logger.log(match + ' "' + test.text + '" → ' + (result.vertragId || 'null') + ' [' + result.confidence + '] ' + result.note);
  });

  // Test offene Zahlungen
  const offene = getOffeneZahlungen();
  Logger.log('Offene Zahlungen: ' + offene.length);
  offene.forEach(z => {
    Logger.log('  ' + z.mieterName + ': ' + formatBetrag(z.differenz) + ' (' + z.status + ')');
  });

  Logger.log('=== TEST ENDE ===');
}
