/**
 * RentalDashboard.gs - Dashboard für Vermietungs-Übersicht
 * Vermietungs-Buchhaltungssystem v1.0
 *
 * NEU: Dashboard mit KPIs für Vermietung
 */

/**
 * Initialisiert Dashboard (Start-Tab)
 */
function initializeRentalDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Dashboard');

  if (!sheet) {
    sheet = ss.insertSheet('Dashboard', 0); // Erste Position
  }

  // Dashboard wird bei jedem Update neu geschrieben
  // Keine initiale Formatierung nötig

  Logger.log('Dashboard initialisiert');
}

/**
 * Aktualisiert Dashboard komplett
 */
function updateDashboard() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Dashboard');

    if (!sheet) {
      sheet = ss.insertSheet('Dashboard', 0);
    }

    sheet.clear();

    // Titel
    sheet.getRange('A1').setValue('📊 VERMIETUNG DASHBOARD')
      .setFontSize(16)
      .setFontWeight('bold');

    let row = 3;

    // === LIQUIDITÄT ===
    sheet.getRange(row, 1).setValue('💰 LIQUIDITÄT')
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground('#e3f2fd');
    row++;

    const liquiditaet = getLiquiditaet();
    liquiditaet.konten.forEach(konto => {
      sheet.getRange(row, 1).setValue('  ' + konto.bezeichnung + ':');
      sheet.getRange(row, 2).setValue(konto.saldo).setNumberFormat('#,##0.00 "€"');
      row++;
    });

    sheet.getRange(row, 1).setValue('GESAMT:')
      .setFontWeight('bold');
    sheet.getRange(row, 2).setValue(liquiditaet.gesamt)
      .setNumberFormat('#,##0.00 "€"')
      .setFontWeight('bold')
      .setBackground('#e3f2fd');
    row += 2;

    // === IMMOBILIEN ===
    sheet.getRange(row, 1).setValue('🏠 IMMOBILIEN')
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground('#fff3e0');
    row++;

    const immobilienOverview = getImmobilienOverview();
    immobilienOverview.immobilienDetails.forEach(immo => {
      const aktiveVertraege = getAktiveMietvertraege().filter(v => {
        const raum = getRaumInfo(v.raumId);
        return raum && raum.immobilieId === immo.immobilieId;
      });

      sheet.getRange(row, 1).setValue('  ' + immo.name + ':');
      sheet.getRange(row, 2).setValue(immo.anzahlRaeume + ' Räume (' + aktiveVertraege.length + ' vermietet)');
      row++;
    });
    row++;

    // === JAHRESÜBERSICHT ===
    sheet.getRange(row, 1).setValue('📊 DIESES JAHR (' + new Date().getFullYear() + ')')
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground('#e8f5e9');
    row++;

    const jahr = new Date().getFullYear();
    const jahresUebersicht = getJahresuebersicht(jahr);

    sheet.getRange(row, 1).setValue('  Einnahmen:');
    sheet.getRange(row, 2).setValue(jahresUebersicht.einnahmen)
      .setNumberFormat('#,##0.00 "€"')
      .setFontColor('#2e7d32');
    row++;

    sheet.getRange(row, 1).setValue('  Ausgaben:');
    sheet.getRange(row, 2).setValue(jahresUebersicht.ausgaben)
      .setNumberFormat('#,##0.00 "€"')
      .setFontColor('#c62828');
    row++;

    sheet.getRange(row, 1).setValue('  Überschuss:')
      .setFontWeight('bold');
    sheet.getRange(row, 2).setValue(jahresUebersicht.ueberschuss)
      .setNumberFormat('#,##0.00 "€"')
      .setFontWeight('bold')
      .setFontColor(jahresUebersicht.ueberschuss >= 0 ? '#2e7d32' : '#c62828');
    row += 2;

    // === OFFENE ZAHLUNGEN ===
    sheet.getRange(row, 1).setValue('💳 OFFENE ZAHLUNGEN')
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground('#ffebee');
    row++;

    const offeneZahlungen = getOffeneZahlungen();

    if (offeneZahlungen.length === 0) {
      sheet.getRange(row, 1).setValue('  ✓ Alle Zahlungen sind eingegangen!')
        .setFontColor('#2e7d32');
      row++;
    } else {
      offeneZahlungen.forEach(z => {
        const text = '  ' + z.mieterName + ' (' + z.vertragId + '): ' +
                     z.monat + '/' + z.jahr + ' - ' +
                     formatBetrag(z.differenz, false) + ' € ' + z.status;

        sheet.getRange(row, 1).setValue(text);

        if (z.status === 'Überfällig') {
          sheet.getRange(row, 1).setFontColor('#c62828').setFontWeight('bold');
        } else {
          sheet.getRange(row, 1).setFontColor('#ff6f00');
        }
        row++;
      });

      const gesamt = offeneZahlungen.reduce((sum, z) => sum + z.differenz, 0);
      sheet.getRange(row, 1).setValue('  GESAMT AUSSTEHEND:')
        .setFontWeight('bold');
      sheet.getRange(row, 2).setValue(gesamt)
        .setNumberFormat('#,##0.00 "€"')
        .setFontWeight('bold')
        .setFontColor('#c62828');
      row++;
    }
    row++;

    // === ABLAUFENDE VERTRÄGE ===
    sheet.getRange(row, 1).setValue('📅 ABLAUFENDE VERTRÄGE (30 Tage)')
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground('#fff3cd');
    row++;

    const ablaufend = getAblaufendeMietvertraege(30);

    if (ablaufend.length === 0) {
      sheet.getRange(row, 1).setValue('  Keine ablaufenden Verträge');
      row++;
    } else {
      ablaufend.forEach(v => {
        const ende = formatDatum(parseDatumDeutsch(v.endeDatum));
        const text = '  ' + v.mieterName + ' (' + v.vertragId + '): ' +
                     'Endet ' + ende + ' (in ' + v.tageVerbleibend + ' Tagen)';
        sheet.getRange(row, 1).setValue(text);
        row++;
      });
    }
    row++;

    // === REVALENZ COMMUNITY FEES ===
    const communityFees = getCommunityFeesTotal();

    if (communityFees.total > 0) {
      sheet.getRange(row, 1).setValue('🔗 REVALENZ COMMUNITY FEES')
        .setFontWeight('bold')
        .setFontSize(12)
        .setBackground('#e1f5fe');
      row++;

      sheet.getRange(row, 1).setValue('  Monatlich:');
      sheet.getRange(row, 2).setValue(communityFees.monatlich).setNumberFormat('#,##0.00 "€"');
      row++;

      sheet.getRange(row, 1).setValue('  Jährlich:');
      sheet.getRange(row, 2).setValue(communityFees.jaehrlich).setNumberFormat('#,##0.00 "€"');
      row++;

      communityFees.details.forEach(detail => {
        sheet.getRange(row, 1).setValue('    ' + detail.mieter + ' (' + detail.vertragId + '):');
        sheet.getRange(row, 2).setValue(detail.betrag).setNumberFormat('#,##0.00 "€"');
        row++;
      });

      row++;
      sheet.getRange(row, 1, 3, 1).merge()
        .setValue('⚠️ WICHTIG: Monatlich in GmbH-System buchen als:\nEinnahme: ' + formatBetrag(communityFees.monatlich) + '\nKategorie: 8500 Sonstige Erträge')
        .setFontSize(9)
        .setFontColor('#01579b')
        .setBackground('#e1f5fe')
        .setWrap(true);
      row += 3;
    }

    // Footer
    row++;
    sheet.getRange(row, 1).setValue('Letzte Aktualisierung: ' + formatDatum(new Date()) + ' ' +
      new Date().toLocaleTimeString('de-DE'))
      .setFontColor('#666666')
      .setFontSize(9);

    // Spaltenbreiten
    sheet.setColumnWidth(1, 400);
    sheet.setColumnWidth(2, 150);

    // Freeze erste Zeile
    sheet.setFrozenRows(1);

    Logger.log('Dashboard aktualisiert');
    showToast('Dashboard aktualisiert', 'Erfolg', 2);

  } catch (e) {
    logError('updateDashboard', e);
    showAlert('Fehler beim Aktualisieren des Dashboards:\n' + e.toString(), 'Fehler');
  }
}

/**
 * Gibt Liquiditätsdaten zurück
 * @returns {Object} {konten: Array, gesamt: number}
 */
function getLiquiditaet() {
  try {
    const bankkonten = getAlleBankkonten();
    const konten = [];
    let gesamt = 0;

    // Für jedes Bankkonto: Summiere Einnahmen - Ausgaben
    bankkonten.forEach(bankkonto => {
      const einnahmen = getEinnahmen({}).filter(e => e.zahlungsart === 'Bank' || !e.zahlungsart);
      const ausgaben = getAusgaben({}).filter(a => a.zahlungsart === 'Bank' || !a.zahlungsart);

      const einnahmenSumme = einnahmen.reduce((sum, e) => sum + (e.betrag || 0), 0);
      const ausgabenSumme = ausgaben.reduce((sum, a) => sum + (a.betrag || 0), 0);
      const saldo = einnahmenSumme - ausgabenSumme;

      konten.push({
        konto: bankkonto.konto,
        bezeichnung: bankkonto.bezeichnung,
        saldo: saldo
      });

      gesamt += saldo;
    });

    return {
      konten: konten,
      gesamt: gesamt
    };

  } catch (e) {
    logError('getLiquiditaet', e);
    return { konten: [], gesamt: 0 };
  }
}

/**
 * Gibt Jahresübersicht zurück
 * @param {number} jahr - Jahr
 * @returns {Object} {einnahmen, ausgaben, ueberschuss}
 */
function getJahresuebersicht(jahr) {
  try {
    const einnahmen = sumEinnahmenTotal(jahr);
    const ausgaben = sumAusgabenTotal(jahr);
    const ueberschuss = einnahmen - ausgaben;

    return {
      jahr: jahr,
      einnahmen: einnahmen,
      ausgaben: ausgaben,
      ueberschuss: ueberschuss
    };

  } catch (e) {
    logError('getJahresuebersicht', e);
    return { jahr: jahr, einnahmen: 0, ausgaben: 0, ueberschuss: 0 };
  }
}

/**
 * Erstellt Property-Übersicht für eine Immobilie
 * @param {string} immobilieId - Immobilie-ID
 * @param {number} jahr - Jahr
 */
function createPropertyOverview(immobilieId, jahr) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = 'Property_' + immobilieId + '_' + jahr;
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

    const immobilie = getImmobilieInfo(immobilieId);
    if (!immobilie) {
      throw new Error('Immobilie ' + immobilieId + ' nicht gefunden!');
    }

    // Header
    sheet.getRange('A1').setValue('=== IMMOBILIE: ' + immobilie.name + ' (' + immobilieId + ') - ' + jahr + ' ===')
      .setFontSize(14)
      .setFontWeight('bold');

    let row = 3;

    // Räume
    sheet.getRange(row, 1).setValue('RÄUME')
      .setFontWeight('bold')
      .setBackground('#e3f2fd');
    row++;

    const raeume = getRaeumeByImmobilie(immobilieId);
    raeume.forEach(raum => {
      const vertraege = getAlleMietvertraege().filter(v => v.raumId === raum.raumId && v.status === 'Aktiv');
      const mieter = vertraege.length > 0 ? 'Vermietet (' + vertraege[0].mieterName + ')' : 'Leer';

      sheet.getRange(row, 1).setValue(raum.raumId + ' | ' + raum.bezeichnung + ' | ' +
        raum.groesse + ' m² | ' + formatBetrag(raum.grundmiete, false) + ' € + ' +
        formatBetrag(raum.nebenkosten, false) + ' € NK | ' + mieter);
      row++;
    });
    row++;

    // Einnahmen
    sheet.getRange(row, 1).setValue('EINNAHMEN (' + jahr + ')')
      .setFontWeight('bold')
      .setBackground('#e8f5e9');
    row++;

    const einnahmen = getEinnahmen({ jahr: jahr, immobilieId: immobilieId });
    const einnahmenByKat = {};
    einnahmen.forEach(e => {
      const kat = e.kategorie || 'Sonstige';
      einnahmenByKat[kat] = (einnahmenByKat[kat] || 0) + (e.betrag || 0);
    });

    Object.keys(einnahmenByKat).forEach(kat => {
      sheet.getRange(row, 1).setValue('  ' + kat + ':');
      sheet.getRange(row, 2).setValue(einnahmenByKat[kat]).setNumberFormat('#,##0.00 "€"');
      row++;
    });

    const summeEinnahmen = Object.values(einnahmenByKat).reduce((a, b) => a + b, 0);
    sheet.getRange(row, 1).setValue('SUMME:').setFontWeight('bold');
    sheet.getRange(row, 2).setValue(summeEinnahmen).setNumberFormat('#,##0.00 "€"').setFontWeight('bold');
    row += 2;

    // Ausgaben
    sheet.getRange(row, 1).setValue('AUSGABEN (' + jahr + ')')
      .setFontWeight('bold')
      .setBackground('#ffebee');
    row++;

    const ausgaben = getAusgaben({ jahr: jahr, immobilieId: immobilieId });
    const ausgabenByKat = {};
    ausgaben.forEach(a => {
      const kat = a.kategorie || 'Sonstige';
      ausgabenByKat[kat] = (ausgabenByKat[kat] || 0) + (a.betrag || 0);
    });

    Object.keys(ausgabenByKat).forEach(kat => {
      sheet.getRange(row, 1).setValue('  ' + kat + ':');
      sheet.getRange(row, 2).setValue(ausgabenByKat[kat]).setNumberFormat('#,##0.00 "€"');
      row++;
    });

    const summeAusgaben = Object.values(ausgabenByKat).reduce((a, b) => a + b, 0);
    sheet.getRange(row, 1).setValue('SUMME:').setFontWeight('bold');
    sheet.getRange(row, 2).setValue(summeAusgaben).setNumberFormat('#,##0.00 "€"').setFontWeight('bold');
    row += 2;

    // Überschuss
    sheet.getRange(row, 1).setValue('ÜBERSCHUSS:').setFontWeight('bold').setFontSize(12);
    sheet.getRange(row, 2).setValue(summeEinnahmen - summeAusgaben)
      .setNumberFormat('#,##0.00 "€"')
      .setFontWeight('bold')
      .setFontSize(12);

    // Spaltenbreiten
    sheet.setColumnWidth(1, 400);
    sheet.setColumnWidth(2, 150);

    Logger.log('Property-Übersicht erstellt: ' + sheetName);
    showToast('Property-Übersicht erstellt', sheetName, 5);

    ss.setActiveSheet(sheet);

  } catch (e) {
    logError('createPropertyOverview', e);
    throw e;
  }
}

/**
 * Test-Funktion
 */
function testDashboard() {
  Logger.log('=== DASHBOARD TEST ===');

  const liquiditaet = getLiquiditaet();
  Logger.log('Liquidität: ' + formatBetrag(liquiditaet.gesamt));

  const jahr = new Date().getFullYear();
  const jahresUebersicht = getJahresuebersicht(jahr);
  Logger.log('Jahresübersicht ' + jahr + ':');
  Logger.log('  Einnahmen: ' + formatBetrag(jahresUebersicht.einnahmen));
  Logger.log('  Ausgaben: ' + formatBetrag(jahresUebersicht.ausgaben));
  Logger.log('  Überschuss: ' + formatBetrag(jahresUebersicht.ueberschuss));

  Logger.log('=== TEST ENDE ===');
}
