/**
 * Mietvertraege.gs - Verwaltung von Mietverträgen
 * Vermietungs-Buchhaltungssystem v1.0
 *
 * NEU: Zentrale Datei für Rental Contracts Management
 */

/**
 * Initialisiert Mietverträge-Sheet
 */
function initializeMietvertraege() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Mietverträge');

  if (!sheet) {
    sheet = ss.insertSheet('Mietverträge');
  }

  // Prüfe ob bereits Daten vorhanden
  if (sheet.getLastRow() > 1) {
    Logger.log('Mietverträge-Sheet hat bereits Daten');
    return;
  }

  sheet.clear();

  // Header
  const headers = [
    'Vertrag-ID',
    'Raum-ID',
    'Mieter-Name',
    'Mieter-Email',
    'Beginn-Datum',
    'Ende-Datum',
    'Grundmiete (€)',
    'Nebenkosten (€)',
    'Kaution (€)',
    'Zahlungsart',
    'Zahlungsrhythmus',
    'IBAN/Airbnb-ID',
    'Status',
    'Community-Fee (€)',
    'Notizen'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formatierung Header
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // Beispiel-Verträge
  const beispielDaten = [
    ['MV-2025-001', 'RAUM-001', 'Max Mustermann', 'max@email.com', '01.01.2025', '31.03.2025', 600, 150, 1200, 'Bank', 'Monatlich', 'DE123...', 'Aktiv', 0, 'Digital Nomad'],
    ['MV-2025-002', 'RAUM-003', 'Revalenz GmbH', 'info@revalenz.de', '01.01.2025', '', 800, 200, 0, 'Bank', 'Monatlich', 'DE456...', 'Aktiv', 100, 'Office + Community'],
  ];

  sheet.getRange(2, 1, beispielDaten.length, 15).setValues(beispielDaten);

  // Spaltenbreiten
  sheet.setColumnWidth(1, 120);   // Vertrag-ID
  sheet.setColumnWidth(2, 100);   // Raum-ID
  sheet.setColumnWidth(3, 150);   // Mieter-Name
  sheet.setColumnWidth(4, 200);   // Mieter-Email
  sheet.setColumnWidth(5, 100);   // Beginn-Datum
  sheet.setColumnWidth(6, 100);   // Ende-Datum
  sheet.setColumnWidth(7, 110);   // Grundmiete
  sheet.setColumnWidth(8, 120);   // Nebenkosten
  sheet.setColumnWidth(9, 100);   // Kaution
  sheet.setColumnWidth(10, 100);  // Zahlungsart
  sheet.setColumnWidth(11, 130);  // Zahlungsrhythmus
  sheet.setColumnWidth(12, 150);  // IBAN/Airbnb-ID
  sheet.setColumnWidth(13, 90);   // Status
  sheet.setColumnWidth(14, 120);  // Community-Fee
  sheet.setColumnWidth(15, 300);  // Notizen

  // Zahlenformat
  sheet.getRange('G:G').setNumberFormat('#,##0.00 "€"');  // Grundmiete
  sheet.getRange('H:H').setNumberFormat('#,##0.00 "€"');  // Nebenkosten
  sheet.getRange('I:I').setNumberFormat('#,##0.00 "€"');  // Kaution
  sheet.getRange('N:N').setNumberFormat('#,##0.00 "€"');  // Community-Fee

  // Datumsformat
  sheet.getRange('E:E').setNumberFormat('dd.mm.yyyy');
  sheet.getRange('F:F').setNumberFormat('dd.mm.yyyy');

  // Datenvalidierung für Status
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Aktiv', 'Gekündigt', 'Abgelaufen'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('M2:M1000').setDataValidation(statusRule);

  // Datenvalidierung für Zahlungsart
  const zahlungsartRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Bank', 'Airbnb', 'PayPal', 'Bar'], true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('J2:J1000').setDataValidation(zahlungsartRule);

  // Datenvalidierung für Zahlungsrhythmus
  const rhythmusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Monatlich', 'Wöchentlich', 'Einmalig'], true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('K2:K1000').setDataValidation(rhythmusRule);

  // Bedingte Formatierung für Status
  const statusColors = [
    { status: 'Aktiv', color: '#d4edda' },      // Grün
    { status: 'Gekündigt', color: '#fff3cd' },  // Gelb
    { status: 'Abgelaufen', color: '#f8d7da' }  // Rot
  ];

  statusColors.forEach(item => {
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(item.status)
      .setBackground(item.color)
      .setRanges([sheet.getRange('M2:M1000')])
      .build();
    const rules = sheet.getConditionalFormatRules();
    rules.push(rule);
    sheet.setConditionalFormatRules(rules);
  });

  // Freeze erste Zeile
  sheet.setFrozenRows(1);

  Logger.log('Mietverträge-Sheet initialisiert mit ' + beispielDaten.length + ' Beispiel-Verträgen');
}

/**
 * Generiert nächste Vertrag-ID
 * Format: MV-YYYY-NNN
 * @returns {string} Vertrag-ID
 */
function generateVertragId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Mietverträge');

  const jahr = new Date().getFullYear();

  if (!sheet || sheet.getLastRow() <= 1) {
    return 'MV-' + jahr + '-001';
  }

  const data = sheet.getDataRange().getValues();
  let maxNr = 0;

  for (let i = 1; i < data.length; i++) {
    const id = data[i][0] ? data[i][0].toString() : '';
    const match = id.match(/^MV-(\d{4})-(\d+)$/);
    if (match && parseInt(match[1]) === jahr) {
      const nr = parseInt(match[2]);
      if (nr > maxNr) maxNr = nr;
    }
  }

  const nextNr = (maxNr + 1).toString().padStart(3, '0');
  return 'MV-' + jahr + '-' + nextNr;
}

/**
 * Gibt alle Mietverträge zurück
 * @param {string} statusFilter - Filter nach Status (optional: 'Aktiv', 'Gekündigt', 'Abgelaufen')
 * @returns {Array} Array mit Mietvertrags-Objekten
 */
function getAlleMietvertraege(statusFilter = null) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Mietverträge');

    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const vertraege = [];

    for (let i = 1; i < data.length; i++) {
      const status = data[i][12] ? data[i][12].toString() : '';

      if (statusFilter && status !== statusFilter) {
        continue;
      }

      vertraege.push({
        vertragId: data[i][0],
        raumId: data[i][1],
        mieterName: data[i][2],
        mieterEmail: data[i][3],
        beginnDatum: data[i][4],
        endeDatum: data[i][5],
        grundmiete: data[i][6],
        nebenkosten: data[i][7],
        kaution: data[i][8],
        zahlungsart: data[i][9],
        zahlungsrhythmus: data[i][10],
        ibanAirbnb: data[i][11],
        status: status,
        communityFee: data[i][13] || 0,
        notizen: data[i][14]
      });
    }

    return vertraege;

  } catch (e) {
    logError('getAlleMietvertraege', e);
    return [];
  }
}

/**
 * Gibt alle aktiven Mietverträge zurück
 * @returns {Array} Array mit aktiven Mietvertrags-Objekten
 */
function getAktiveMietvertraege() {
  return getAlleMietvertraege('Aktiv');
}

/**
 * Gibt Mietvertrag nach ID zurück
 * @param {string} vertragId - Vertrag-ID
 * @returns {Object|null} Mietvertrags-Objekt oder null
 */
function getMietvertragById(vertragId) {
  const vertraege = getAlleMietvertraege();
  return vertraege.find(v => v.vertragId === vertragId) || null;
}

/**
 * Gibt Mietvertrag nach Mieter-Name zurück
 * @param {string} mieterName - Mieter-Name (case-insensitive)
 * @returns {Object|null} Mietvertrags-Objekt oder null
 */
function getMietvertragByTenant(mieterName) {
  const vertraege = getAktiveMietvertraege();
  const nameLower = mieterName.toLowerCase();

  return vertraege.find(v => {
    const vertragNameLower = v.mieterName.toLowerCase();
    return vertragNameLower.includes(nameLower) || nameLower.includes(vertragNameLower);
  }) || null;
}

/**
 * Gibt ablaufende Verträge zurück (in X Tagen)
 * @param {number} tage - Anzahl Tage voraus (default: 30)
 * @returns {Array} Array mit ablaufenden Mietverträgen
 */
function getAblaufendeMietvertraege(tage = 30) {
  try {
    const heute = new Date();
    const enddatum = new Date(heute);
    enddatum.setDate(enddatum.getDate() + tage);

    const vertraege = getAktiveMietvertraege();
    const ablaufend = [];

    vertraege.forEach(vertrag => {
      if (vertrag.endeDatum) {
        const ende = parseDatumDeutsch(vertrag.endeDatum);
        if (ende && ende >= heute && ende <= enddatum) {
          const diffTage = Math.ceil((ende - heute) / (1000 * 60 * 60 * 24));
          ablaufend.push({
            ...vertrag,
            tageVerbleibend: diffTage
          });
        }
      }
    });

    // Sortiere nach Enddatum
    ablaufend.sort((a, b) => a.tageVerbleibend - b.tageVerbleibend);

    return ablaufend;

  } catch (e) {
    logError('getAblaufendeMietvertraege', e);
    return [];
  }
}

/**
 * Summiert Community-Gebühren (für GmbH-Buchung)
 * @returns {Object} {total, monatlich, jaehrlich, details}
 */
function getCommunityFeesTotal() {
  try {
    const vertraege = getAktiveMietvertraege();
    let total = 0;
    const details = [];

    vertraege.forEach(vertrag => {
      const fee = parseFloat(vertrag.communityFee) || 0;
      if (fee > 0) {
        total += fee;
        details.push({
          vertragId: vertrag.vertragId,
          mieter: vertrag.mieterName,
          betrag: fee
        });
      }
    });

    return {
      total: total,
      monatlich: total,
      jaehrlich: total * 12,
      details: details
    };

  } catch (e) {
    logError('getCommunityFeesTotal', e);
    return { total: 0, monatlich: 0, jaehrlich: 0, details: [] };
  }
}

/**
 * Fügt neuen Mietvertrag hinzu
 * @param {Object} vertragData - Vertragsdaten
 * @returns {string} Vertrag-ID
 */
function addMietvertrag(vertragData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Mietverträge');

    if (!sheet) {
      throw new Error('Mietverträge-Sheet nicht gefunden!');
    }

    // Prüfe ob Raum existiert
    const raum = getRaumInfo(vertragData.raumId);
    if (!raum) {
      throw new Error('Raum ' + vertragData.raumId + ' nicht gefunden!');
    }

    const vertragId = generateVertragId();
    const beginnDatum = parseDatumDeutsch(vertragData.beginnDatum);
    const endeDatum = vertragData.endeDatum ? parseDatumDeutsch(vertragData.endeDatum) : '';

    sheet.appendRow([
      vertragId,
      vertragData.raumId,
      vertragData.mieterName,
      vertragData.mieterEmail || '',
      beginnDatum,
      endeDatum,
      vertragData.grundmiete || raum.grundmiete,
      vertragData.nebenkosten || raum.nebenkosten,
      vertragData.kaution || 0,
      vertragData.zahlungsart || 'Bank',
      vertragData.zahlungsrhythmus || 'Monatlich',
      vertragData.ibanAirbnb || '',
      'Aktiv',
      vertragData.communityFee || 0,
      vertragData.notizen || ''
    ]);

    Logger.log('Mietvertrag hinzugefügt: ' + vertragId + ' - ' + vertragData.mieterName);
    return vertragId;

  } catch (e) {
    logError('addMietvertrag', e);
    throw e;
  }
}

/**
 * Aktualisiert Mietvertrag-Status
 * @param {string} vertragId - Vertrag-ID
 * @param {string} status - Neuer Status ('Aktiv', 'Gekündigt', 'Abgelaufen')
 * @returns {boolean} Erfolg
 */
function updateMietvertragStatus(vertragId, status) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Mietverträge');

    if (!sheet) {
      throw new Error('Mietverträge-Sheet nicht gefunden!');
    }

    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === vertragId) {
        sheet.getRange(i + 1, 13).setValue(status);
        Logger.log('Mietvertrag-Status aktualisiert: ' + vertragId + ' → ' + status);
        return true;
      }
    }

    throw new Error('Mietvertrag ' + vertragId + ' nicht gefunden!');

  } catch (e) {
    logError('updateMietvertragStatus', e);
    return false;
  }
}

/**
 * Automatische Status-Aktualisierung basierend auf Ende-Datum
 * Sollte regelmäßig (täglich) ausgeführt werden
 */
function updateAbgelaufeneMietvertraege() {
  try {
    const heute = new Date();
    const vertraege = getAktiveMietvertraege();
    let anzahlUpdates = 0;

    vertraege.forEach(vertrag => {
      if (vertrag.endeDatum) {
        const ende = parseDatumDeutsch(vertrag.endeDatum);
        if (ende && ende < heute) {
          updateMietvertragStatus(vertrag.vertragId, 'Abgelaufen');
          anzahlUpdates++;
        }
      }
    });

    if (anzahlUpdates > 0) {
      Logger.log('Abgelaufene Verträge aktualisiert: ' + anzahlUpdates);
      showToast(anzahlUpdates + ' Verträge als abgelaufen markiert', 'Status-Update', 5);
    }

  } catch (e) {
    logError('updateAbgelaufeneMietvertraege', e);
  }
}

/**
 * Zeigt Übersicht der ablaufenden Verträge
 */
function showAblaufendeVertraege() {
  const ui = SpreadsheetApp.getUi();
  const ablaufend = getAblaufendeMietvertraege(30);

  if (ablaufend.length === 0) {
    ui.alert('Keine ablaufenden Verträge', 'In den nächsten 30 Tagen laufen keine Verträge ab.', ui.ButtonSet.OK);
    return;
  }

  let message = '📅 Ablaufende Verträge (nächste 30 Tage):\n\n';

  ablaufend.forEach(vertrag => {
    const ende = formatDatum(parseDatumDeutsch(vertrag.endeDatum));
    message += '• ' + vertrag.mieterName + ' (' + vertrag.vertragId + ')\n';
    message += '  Endet am ' + ende + ' (in ' + vertrag.tageVerbleibend + ' Tagen)\n';
    message += '  Raum: ' + vertrag.raumId + '\n\n';
  });

  ui.alert('Ablaufende Verträge', message, ui.ButtonSet.OK);
}

/**
 * Zeigt Dialog zum Hinzufügen eines neuen Mietvertrags
 */
function showNeuerMietvertragDialog() {
  const ui = SpreadsheetApp.getUi();

  // Einfacher Dialog - in Production würde man HTML-Dialog verwenden
  ui.alert(
    'Neuer Mietvertrag',
    'Bitte tragen Sie den neuen Vertrag direkt im Sheet "Mietverträge" ein.\n\n' +
    'Die Vertrag-ID wird automatisch generiert.',
    ui.ButtonSet.OK
  );

  // Öffne Mietverträge-Sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Mietverträge');
  if (sheet) {
    ss.setActiveSheet(sheet);
  }
}

/**
 * Test-Funktion
 */
function testMietvertraege() {
  Logger.log('=== MIETVERTRÄGE TEST ===');

  const vertraege = getAlleMietvertraege();
  Logger.log('Anzahl Mietverträge: ' + vertraege.length);

  const aktiv = getAktiveMietvertraege();
  Logger.log('Anzahl aktive Verträge: ' + aktiv.length);

  aktiv.forEach(v => {
    Logger.log('  ' + v.vertragId + ' - ' + v.mieterName + ' (' + v.raumId + ')');
    Logger.log('    Miete: ' + v.grundmiete + ' € + ' + v.nebenkosten + ' € NK');
    Logger.log('    Community-Fee: ' + v.communityFee + ' €');
  });

  const ablaufend = getAblaufendeMietvertraege(90);
  Logger.log('Ablaufende Verträge (90 Tage): ' + ablaufend.length);

  const communityFees = getCommunityFeesTotal();
  Logger.log('Community-Gebühren:');
  Logger.log('  Monatlich: ' + communityFees.monatlich + ' €');
  Logger.log('  Jährlich: ' + communityFees.jaehrlich + ' €');

  Logger.log('=== TEST ENDE ===');
}
