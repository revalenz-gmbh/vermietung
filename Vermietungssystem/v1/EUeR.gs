/**
 * EUeR.gs - Einnahmen-Überschuss-Rechnung
 * Vermietungs-Buchhaltungssystem v1.0
 *
 * NEU: EÜR-Reporting für Steuererklärung (Anlage V)
 */

/**
 * Initialisiert EÜR-Sheet
 */
function initializeEUeR() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('EÜR');

  if (!sheet) {
    sheet = ss.insertSheet('EÜR');
  }

  // Sheet wird bei jedem Update neu geschrieben
  // Keine initiale Formatierung nötig

  Logger.log('EÜR-Sheet initialisiert');
}

/**
 * Berechnet EÜR für ein Jahr
 * @param {number} jahr - Jahr
 * @returns {Object} EÜR-Daten {einnahmen, ausgaben, summeEinnahmen, summeAusgaben, ueberschuss}
 */
function calculateEUeR(jahr) {
  try {
    // Summiere Einnahmen nach Kategorie
    const einnahmen = sumEinnahmenByKategorie(jahr);

    // Summiere Ausgaben nach Kategorie
    const ausgaben = sumAusgabenByKategorie(jahr);

    // Berechne Summen
    const summeEinnahmen = Object.values(einnahmen).reduce((a, b) => a + b, 0);
    const summeAusgaben = Object.values(ausgaben).reduce((a, b) => a + b, 0);
    const ueberschuss = summeEinnahmen - summeAusgaben;

    return {
      jahr: jahr,
      einnahmen: einnahmen,
      ausgaben: ausgaben,
      summeEinnahmen: summeEinnahmen,
      summeAusgaben: summeAusgaben,
      ueberschuss: ueberschuss
    };

  } catch (e) {
    logError('calculateEUeR', e);
    throw e;
  }
}

/**
 * Aktualisiert EÜR-Sheet für ein Jahr
 * @param {number} jahr - Jahr (optional, default: aktuelles Jahr)
 */
function updateEUeRSheet(jahr = null) {
  try {
    if (!jahr) jahr = new Date().getFullYear();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('EÜR');

    if (!sheet) {
      sheet = ss.insertSheet('EÜR');
    }

    sheet.clear();

    // Berechne EÜR
    const euer = calculateEUeR(jahr);

    // Header
    sheet.getRange('A1').setValue('📊 EINNAHMEN-ÜBERSCHUSS-RECHNUNG ' + jahr)
      .setFontSize(14)
      .setFontWeight('bold');

    let row = 3;

    // === EINNAHMEN ===
    sheet.getRange(row, 1).setValue('A. EINNAHMEN')
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground('#d4edda');
    row++;

    const einnahmenKategorien = getEinnahmenKategorien();
    einnahmenKategorien.forEach(kat => {
      const betrag = euer.einnahmen[kat] || 0;
      if (betrag > 0) {
        sheet.getRange(row, 1).setValue('  ' + kat);
        sheet.getRange(row, 2).setValue(betrag).setNumberFormat('#,##0.00 "€"');
        row++;
      }
    });

    // Summe Einnahmen
    sheet.getRange(row, 1).setValue('SUMME EINNAHMEN')
      .setFontWeight('bold')
      .setBackground('#e8f5e9');
    sheet.getRange(row, 2).setValue(euer.summeEinnahmen)
      .setNumberFormat('#,##0.00 "€"')
      .setFontWeight('bold')
      .setBackground('#e8f5e9');
    row += 2;

    // === AUSGABEN ===
    sheet.getRange(row, 1).setValue('B. AUSGABEN')
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground('#f8d7da');
    row++;

    const ausgabenKategorien = getAusgabenKategorien();

    // Gruppiere Hauskosten
    const hauskostenKategorien = ausgabenKategorien.filter(k => k.startsWith('Hauskosten'));
    const andereAusgaben = ausgabenKategorien.filter(k => !k.startsWith('Hauskosten') && k !== 'Kaution Rückzahlung');

    // Andere Ausgaben
    andereAusgaben.forEach(kat => {
      const betrag = euer.ausgaben[kat] || 0;
      if (betrag > 0) {
        sheet.getRange(row, 1).setValue('  ' + kat);
        sheet.getRange(row, 2).setValue(betrag).setNumberFormat('#,##0.00 "€"');
        row++;
      }
    });

    // Hauskosten (zusammengefasst)
    const hauskostenGesamt = hauskostenKategorien.reduce((sum, kat) => sum + (euer.ausgaben[kat] || 0), 0);
    if (hauskostenGesamt > 0) {
      sheet.getRange(row, 1).setValue('  Hauskosten (gesamt)');
      sheet.getRange(row, 2).setValue(hauskostenGesamt).setNumberFormat('#,##0.00 "€"');
      row++;

      // Details
      hauskostenKategorien.forEach(kat => {
        const betrag = euer.ausgaben[kat] || 0;
        if (betrag > 0) {
          const label = kat.replace('Hauskosten ', '');
          sheet.getRange(row, 1).setValue('    davon ' + label);
          sheet.getRange(row, 2).setValue(betrag).setNumberFormat('#,##0.00 "€"');
          row++;
        }
      });
    }

    // Summe Ausgaben
    sheet.getRange(row, 1).setValue('SUMME AUSGABEN')
      .setFontWeight('bold')
      .setBackground('#ffebee');
    sheet.getRange(row, 2).setValue(euer.summeAusgaben)
      .setNumberFormat('#,##0.00 "€"')
      .setFontWeight('bold')
      .setBackground('#ffebee');
    row += 2;

    // === ÜBERSCHUSS ===
    sheet.getRange(row, 1).setValue('C. ÜBERSCHUSS / FEHLBETRAG (A - B)')
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground(euer.ueberschuss >= 0 ? '#d4edda' : '#f8d7da');
    sheet.getRange(row, 2).setValue(euer.ueberschuss)
      .setNumberFormat('#,##0.00 "€"')
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground(euer.ueberschuss >= 0 ? '#d4edda' : '#f8d7da');
    row += 2;

    // Footer
    sheet.getRange(row, 1).setValue('Erstellt: ' + formatDatum(new Date()))
      .setFontColor('#666666')
      .setFontSize(9);

    // Spaltenbreiten
    sheet.setColumnWidth(1, 350);
    sheet.setColumnWidth(2, 150);

    // Freeze erste Zeile
    sheet.setFrozenRows(1);

    Logger.log('EÜR-Sheet aktualisiert für ' + jahr);
    showToast('EÜR aktualisiert für ' + jahr, 'Erfolg', 3);

  } catch (e) {
    logError('updateEUeRSheet', e);
    showAlert('Fehler beim Aktualisieren der EÜR:\n' + e.toString(), 'Fehler');
  }
}

/**
 * Exportiert EÜR als CSV (für Steuersoftware)
 * @param {number} jahr - Jahr
 * @returns {string} CSV-Inhalt
 */
function exportEUeRCSV(jahr) {
  try {
    const euer = calculateEUeR(jahr);

    let csv = 'Kategorie;Typ;Betrag\n';

    // Einnahmen
    Object.keys(euer.einnahmen).forEach(kat => {
      const betrag = euer.einnahmen[kat];
      if (betrag > 0) {
        csv += kat + ';Einnahme;' + betrag.toFixed(2).replace('.', ',') + '\n';
      }
    });

    // Ausgaben
    Object.keys(euer.ausgaben).forEach(kat => {
      const betrag = euer.ausgaben[kat];
      if (betrag > 0) {
        csv += kat + ';Ausgabe;' + betrag.toFixed(2).replace('.', ',') + '\n';
      }
    });

    // Summen
    csv += '\n';
    csv += 'Summe Einnahmen;Summe;' + euer.summeEinnahmen.toFixed(2).replace('.', ',') + '\n';
    csv += 'Summe Ausgaben;Summe;' + euer.summeAusgaben.toFixed(2).replace('.', ',') + '\n';
    csv += 'Überschuss/Fehlbetrag;Summe;' + euer.ueberschuss.toFixed(2).replace('.', ',') + '\n';

    return csv;

  } catch (e) {
    logError('exportEUeRCSV', e);
    throw e;
  }
}

/**
 * Zeigt EÜR-Export-Dialog
 */
function showEUeRExportDialog() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    'EÜR CSV-Export',
    'Welches Jahr exportieren? (z.B. 2025)',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const jahr = parseInt(response.getResponseText());

  if (isNaN(jahr) || jahr < 2000 || jahr > 2100) {
    showAlert('Ungültiges Jahr!', 'Fehler');
    return;
  }

  try {
    const csv = exportEUeRCSV(jahr);
    const fileName = 'EÜR_' + jahr + '.csv';

    // In Google Sheets kann man nicht direkt downloaden
    // → CSV in Zwischenablage oder als neues Sheet anzeigen
    const csvSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('EÜR_Export_' + jahr);
    csvSheet.getRange('A1').setValue(csv);

    ui.alert(
      'EÜR Export erstellt',
      'CSV-Daten wurden in Sheet "' + csvSheet.getName() + '" geschrieben.\n\n' +
      'Kopieren Sie den Inhalt und speichern Sie ihn als ' + fileName,
      ui.ButtonSet.OK
    );

    SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(csvSheet);

  } catch (e) {
    showAlert('Fehler beim Export:\n' + e.toString(), 'Fehler');
  }
}

/**
 * Erstellt Quartalsübersicht
 * @param {number} jahr - Jahr
 * @param {number} quartal - Quartal (1-4)
 * @returns {Object} Quartalsdaten
 */
function getQuartalsuebersicht(jahr, quartal) {
  try {
    const monate = {
      1: [1, 2, 3],
      2: [4, 5, 6],
      3: [7, 8, 9],
      4: [10, 11, 12]
    };

    const quartalMonate = monate[quartal];
    if (!quartalMonate) {
      throw new Error('Ungültiges Quartal: ' + quartal);
    }

    const einnahmen = getEinnahmen({ jahr: jahr }).filter(e => {
      const datum = e.datum instanceof Date ? e.datum : parseDatumDeutsch(e.datum);
      const monat = datum ? datum.getMonth() + 1 : 0;
      return quartalMonate.includes(monat);
    });

    const ausgaben = getAusgaben({ jahr: jahr }).filter(a => {
      const datum = a.datum instanceof Date ? a.datum : parseDatumDeutsch(a.datum);
      const monat = datum ? datum.getMonth() + 1 : 0;
      return quartalMonate.includes(monat);
    });

    const summeEinnahmen = einnahmen.reduce((sum, e) => sum + (e.betrag || 0), 0);
    const summeAusgaben = ausgaben.reduce((sum, a) => sum + (a.betrag || 0), 0);

    return {
      jahr: jahr,
      quartal: quartal,
      summeEinnahmen: summeEinnahmen,
      summeAusgaben: summeAusgaben,
      ueberschuss: summeEinnahmen - summeAusgaben,
      anzahlEinnahmen: einnahmen.length,
      anzahlAusgaben: ausgaben.length
    };

  } catch (e) {
    logError('getQuartalsuebersicht', e);
    return null;
  }
}

/**
 * Test-Funktion
 */
function testEUeR() {
  Logger.log('=== EÜR TEST ===');

  const jahr = new Date().getFullYear();
  const euer = calculateEUeR(jahr);

  Logger.log('Jahr: ' + euer.jahr);
  Logger.log('Summe Einnahmen: ' + formatBetrag(euer.summeEinnahmen));
  Logger.log('Summe Ausgaben: ' + formatBetrag(euer.summeAusgaben));
  Logger.log('Überschuss: ' + formatBetrag(euer.ueberschuss));

  Logger.log('\nEinnahmen nach Kategorie:');
  Object.keys(euer.einnahmen).forEach(kat => {
    if (euer.einnahmen[kat] > 0) {
      Logger.log('  ' + kat + ': ' + formatBetrag(euer.einnahmen[kat]));
    }
  });

  Logger.log('\nAusgaben nach Kategorie:');
  Object.keys(euer.ausgaben).forEach(kat => {
    if (euer.ausgaben[kat] > 0) {
      Logger.log('  ' + kat + ': ' + formatBetrag(euer.ausgaben[kat]));
    }
  });

  // Test Quartalsübersicht
  const q1 = getQuartalsuebersicht(jahr, 1);
  Logger.log('\nQuartal 1/' + jahr + ':');
  Logger.log('  Einnahmen: ' + formatBetrag(q1.summeEinnahmen));
  Logger.log('  Ausgaben: ' + formatBetrag(q1.summeAusgaben));
  Logger.log('  Überschuss: ' + formatBetrag(q1.ueberschuss));

  Logger.log('=== TEST ENDE ===');
}
