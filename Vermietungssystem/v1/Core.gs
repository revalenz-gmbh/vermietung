/**
 * Core.gs - Hauptlogik, Menü, CSV-Import, System-Setup
 * Vermietungs-Buchhaltungssystem v1.0
 *
 * Angepasst von: Buchhaltungssystem v3.0
 * Änderungen: Vereinfachtes Menü, EÜR statt Bilanz/GuV, keine DATEV/UStVA
 */

/**
 * Wird beim Öffnen des Sheets ausgeführt
 */
function onOpen() {
  createMenu();
}

/**
 * Erstellt das Hauptmenü
 */
function createMenu() {
  const ui = SpreadsheetApp.getUi();

  const menu = ui.createMenu('📊 Vermietung');

  // Haupt-Funktionen
  menu.addItem('📥 CSV-Import (Bank/Airbnb)', 'importCSV');
  menu.addSeparator();

  // Kontobewegungen
  const kbMenu = ui.createMenu('📋 Kontobewegungen');
  kbMenu.addItem('✅ Kontobewegungen buchen', 'bucheKontobewegungen');
  kbMenu.addItem('📌 Alle als zugeordnet markieren', 'markAlleAlsZugeordnet');
  kbMenu.addItem('🔄 Kategorien-Vorschläge aktualisieren', 'aktualisiereKategorienVorschlaege');
  menu.addSubMenu(kbMenu);

  menu.addSeparator();

  // Mietverträge
  const mvMenu = ui.createMenu('🏠 Mietverträge');
  mvMenu.addItem('➕ Neuer Mietvertrag', 'showNeuerMietvertragDialog');
  mvMenu.addItem('⚠️ Ablaufende Verträge', 'showAblaufendeVertraege');
  mvMenu.addItem('🔄 Abgelaufene aktualisieren', 'updateAbgelaufeneMietvertraege');
  menu.addSubMenu(mvMenu);

  // Zahlungen
  const zahlMenu = ui.createMenu('💳 Zahlungen');
  zahlMenu.addItem('🔍 Fehlende Zahlungen prüfen', 'showOffeneZahlungen');
  zahlMenu.addItem('📊 Zahlungsstatus-Report', 'showZahlungsstatusReportDialog');
  menu.addSubMenu(zahlMenu);

  menu.addSeparator();

  // Reports
  const reportsMenu = ui.createMenu('📊 Reports');
  reportsMenu.addItem('📋 EÜR aktualisieren', 'showEUeRDialog');
  reportsMenu.addItem('🏠 Property-Übersicht', 'showPropertyOverviewDialog');
  reportsMenu.addItem('🔄 Dashboard aktualisieren', 'updateDashboard');
  menu.addSubMenu(reportsMenu);

  menu.addSeparator();

  // System
  const systemMenu = ui.createMenu('⚙️ System');
  systemMenu.addItem('🚀 System Setup (Erstinstallation)', 'setupSystem');
  systemMenu.addItem('📊 System-Info', 'showSystemInfo');
  menu.addSubMenu(systemMenu);

  menu.addToUi();
}

/**
 * SYSTEM SETUP - 1-Click Installation
 * Erstellt alle Sheets für Vermietungssystem
 */
function setupSystem() {
  try {
    const ui = SpreadsheetApp.getUi();

    const response = ui.alert(
      'System Setup',
      'Dies erstellt alle Sheets für die Vermietungsverwaltung.\n\n' +
      'ACHTUNG: Bestehende Daten bleiben erhalten.\n\n' +
      'Fortfahren?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      return;
    }

    showToast('System-Setup läuft...', 'Bitte warten', 5);

    // Initialisiere alle Module
    Logger.log('=== VERMIETUNG SYSTEM SETUP START ===');

    // 1. Dashboard
    Logger.log('1/11 Dashboard...');
    initializeRentalDashboard();

    // 2. Immobilien
    Logger.log('2/11 Immobilien...');
    initializeImmobilien();

    // 3. Räume
    Logger.log('3/11 Räume...');
    initializeRaeume();

    // 4. Mietverträge
    Logger.log('4/11 Mietverträge...');
    initializeMietvertraege();

    // 5. Bankkonten
    Logger.log('5/11 Bankkonten...');
    initializeBankkonten();

    // 6. Kategorienmapping
    Logger.log('6/11 Kategorienmapping...');
    initializeKategorienmapping();

    // 7. Kontobewegungen
    Logger.log('7/11 Kontobewegungen...');
    initializeKontobewegungen();

    // 8. Einnahmen
    Logger.log('8/11 Einnahmen...');
    initializeEinnahmen();

    // 9. Ausgaben
    Logger.log('9/11 Ausgaben...');
    initializeAusgaben();

    // 10. Zahlungen (optional)
    Logger.log('10/11 Zahlungen...');
    initializeZahlungen();

    // 11. EÜR
    Logger.log('11/11 EÜR...');
    initializeEUeR();

    // System-Version setzen
    const props = PropertiesService.getDocumentProperties();
    props.setProperty('SYSTEM_VERSION', getVersion());
    props.setProperty('SETUP_DATE', new Date().toISOString());

    // Dashboard aktualisieren
    updateDashboard();

    Logger.log('=== SYSTEM SETUP COMPLETE ===');

    showAlert(
      '✅ Vermietungssystem erfolgreich eingerichtet!\n\n' +
      'Version: ' + getVersion() + '\n\n' +
      'Nächste Schritte:\n' +
      '1. Bankkonten konfigurieren (Sheet "Bankkonten")\n' +
      '2. Immobilien & Räume eintragen (Sheets "Immobilien", "Räume")\n' +
      '3. Mietverträge anlegen (Sheet "Mietverträge")\n' +
      '4. Kategorienmapping anpassen (Sheet "Kategorienmapping")\n' +
      '5. CSV importieren (📊 Vermietung → 📥 CSV-Import)',
      'Setup abgeschlossen'
    );

  } catch (e) {
    logError('setupSystem', e);
    showAlert('❌ Fehler beim Setup:\n' + e.toString(), 'Fehler');
  }
}

/**
 * CSV-IMPORT - Vereinfacht für Vermietung
 * Kopiert Logik von GmbH-System, angepasst für single-entry
 */
function importCSV() {
  try {
    const ui = SpreadsheetApp.getUi();

    showAlert(
      'CSV-Import Anleitung:\n\n' +
      '1. Öffnen Sie Ihr Online-Banking\n' +
      '2. Exportieren Sie Kontobewegungen als CSV\n' +
      '3. Kopieren Sie den CSV-Inhalt\n' +
      '4. Fügen Sie ihn in die nächste Eingabemaske ein\n\n' +
      'Unterstützte Formate:\n' +
      '• Standard-CSV (Datum, Betrag, Verwendungszweck)\n' +
      '• Sparkasse, Volksbank, etc.\n' +
      '• Airbnb-Exporte',
      'CSV-Import'
    );

    // Zeige Eingabe-Dialog
    const response = ui.prompt(
      'CSV-Import',
      'Bitte CSV-Inhalt einfügen (mehrere Zeilen):',
      ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() !== ui.Button.OK) {
      return;
    }

    const csvText = response.getResponseText();

    if (!csvText || csvText.trim().length === 0) {
      showAlert('Keine Daten eingegeben!', 'Fehler');
      return;
    }

    showToast('Importiere CSV...', 'Bitte warten', 5);

    // Verarbeite CSV
    const result = processCSVImport(csvText);

    if (result.erfolg) {
      showAlert(
        '✅ CSV-Import erfolgreich!\n\n' +
        'Importiert: ' + result.importiert + ' Bewegungen\n' +
        'Duplikate: ' + result.duplikate + ' übersprungen\n\n' +
        'Nächste Schritte:\n' +
        '1. Sheet "Kontobewegungen" öffnen\n' +
        '2. Kategorien & Vertrags-IDs prüfen\n' +
        '3. Status auf "Zugeordnet" setzen\n' +
        '4. Menü → Kontobewegungen → ✅ Buchen',
        'Import erfolgreich'
      );

      // Öffne Kontobewegungen-Sheet
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('Kontobewegungen');
      if (sheet) {
        ss.setActiveSheet(sheet);
      }
    } else {
      showAlert('❌ Import fehlgeschlagen:\n' + result.fehler, 'Fehler');
    }

  } catch (e) {
    logError('importCSV', e);
    showAlert('❌ Fehler beim Import:\n' + e.toString(), 'Fehler');
  }
}

/**
 * Verarbeitet CSV-Import
 * @param {string} csvText - CSV-Inhalt
 * @param {string} bankkontoOverride - Bankkonto überschreiben (optional)
 * @returns {Object} {erfolg, importiert, duplikate, fehler}
 */
function processCSVImport(csvText, bankkontoOverride = null) {
  try {
    // Erkenne Delimiter
    const delimiter = detectDelimiter(csvText);
    Logger.log('Delimiter erkannt: ' + (delimiter === ',' ? 'Comma' : delimiter === ';' ? 'Semicolon' : 'Tab'));

    // Parse CSV
    const lines = csvText.trim().split('\n');
    const rows = lines.map(line => parseCSVLine(line, delimiter));

    if (rows.length === 0) {
      return { erfolg: false, fehler: 'CSV-Datei ist leer!' };
    }

    // Erkenne Header
    const headerRow = rows[0];
    const columnMapping = detectColumnMapping(headerRow);

    Logger.log('Spalten-Mapping: ' + JSON.stringify(columnMapping));

    // Erkenne Bankkonto (aus IBAN oder prompt)
    let bankkonto = bankkontoOverride;
    if (!bankkonto) {
      // Versuche IBAN zu finden
      for (let i = 1; i < Math.min(rows.length, 10); i++) {
        const row = rows[i];
        const text = row.join(' ');
        const ibanMatch = text.match(/[A-Z]{2}\d{2}[A-Z0-9]{1,30}/);
        if (ibanMatch) {
          const gefunden = findBankkontoByIBAN(ibanMatch[0]);
          if (gefunden) {
            bankkonto = gefunden;
            Logger.log('Bankkonto erkannt: ' + bankkonto + ' (IBAN: ' + ibanMatch[0].substring(0, 10) + '...)');
            break;
          }
        }
      }

      // Wenn nicht gefunden → Prompt
      if (!bankkonto) {
        const ui = SpreadsheetApp.getUi();
        const response = ui.prompt(
          'Bankkonto',
          'Bankkonto-Nr eingeben (z.B. 1200):',
          ui.ButtonSet.OK_CANCEL
        );

        if (response.getSelectedButton() !== ui.Button.OK) {
          return { erfolg: false, fehler: 'Import abgebrochen' };
        }

        bankkonto = response.getResponseText();
      }
    }

    // Importiere Zeilen
    let importiert = 0;
    let duplikate = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      if (row.length < 3) continue;  // Zu kurze Zeile

      // Extrahiere Daten
      const datum = extractValue(row, columnMapping.datum);
      const betrag = extractValue(row, columnMapping.betrag);
      const verwendungszweck = extractValue(row, columnMapping.verwendungszweck);

      if (!datum || !betrag) continue;  // Pflichtfelder fehlen

      const parsedDatum = parseDatumDeutsch(datum);
      const parsedBetrag = parseBetragDeutsch(betrag);

      if (!parsedDatum) {
        Logger.log('Zeile ' + (i + 1) + ': Ungültiges Datum: ' + datum);
        continue;
      }

      // Duplikat-Check
      if (istDuplikat(parsedDatum, parsedBetrag, verwendungszweck)) {
        duplikate++;
        Logger.log('Zeile ' + (i + 1) + ': Duplikat übersprungen');
        continue;
      }

      // Füge zu Kontobewegungen hinzu
      addKontobewegung({
        bankkonto: bankkonto,
        datum: parsedDatum,
        betrag: parsedBetrag,
        verwendungszweck: verwendungszweck
      });

      importiert++;
    }

    Logger.log('CSV-Import: ' + importiert + ' importiert, ' + duplikate + ' Duplikate');

    return {
      erfolg: true,
      importiert: importiert,
      duplikate: duplikate
    };

  } catch (e) {
    logError('processCSVImport', e);
    return { erfolg: false, fehler: e.toString() };
  }
}

/**
 * Erkenne CSV-Delimiter
 */
function detectDelimiter(csvText) {
  const firstLine = csvText.split('\n')[0];
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (semicolons > commas && semicolons > tabs) return ';';
  if (tabs > commas && tabs > semicolons) return '\t';
  return ',';
}

/**
 * Parse CSV-Zeile
 */
function parseCSVLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Erkenne Spalten-Mapping
 */
function detectColumnMapping(headerRow) {
  const mapping = { datum: -1, betrag: -1, verwendungszweck: -1 };

  headerRow.forEach((header, index) => {
    const h = header.toLowerCase();

    if (h.includes('datum') || h.includes('valuta') || h.includes('buchung')) {
      mapping.datum = index;
    }
    if (h.includes('betrag') || h.includes('umsatz') || h.includes('amount')) {
      mapping.betrag = index;
    }
    if (h.includes('verwendung') || h.includes('text') || h.includes('beschreibung') || h.includes('description')) {
      mapping.verwendungszweck = index;
    }
  });

  // Fallback: Erste 3 Spalten
  if (mapping.datum === -1) mapping.datum = 0;
  if (mapping.betrag === -1) mapping.betrag = 1;
  if (mapping.verwendungszweck === -1) mapping.verwendungszweck = 2;

  return mapping;
}

/**
 * Extrahiere Wert aus Row
 */
function extractValue(row, index) {
  if (index < 0 || index >= row.length) return '';
  return row[index];
}

/**
 * Zeigt EÜR-Dialog
 */
function showEUeRDialog() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    'EÜR aktualisieren',
    'Welches Jahr? (z.B. 2025)',
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

  updateEUeRSheet(jahr);
}

/**
 * Zeigt Property-Overview-Dialog
 */
function showPropertyOverviewDialog() {
  const ui = SpreadsheetApp.getUi();

  const immobilien = getAlleImmobilien();

  if (immobilien.length === 0) {
    showAlert('Keine Immobilien vorhanden!\n\nBitte erst Immobilien im Sheet "Immobilien" anlegen.', 'Info');
    return;
  }

  let message = 'Immobilie auswählen:\n\n';
  immobilien.forEach((immo, index) => {
    message += (index + 1) + '. ' + immo.name + ' (' + immo.immobilieId + ')\n';
  });

  const response = ui.prompt(
    'Property-Übersicht erstellen',
    message + '\nNummer eingeben:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const nr = parseInt(response.getResponseText());

  if (isNaN(nr) || nr < 1 || nr > immobilien.length) {
    showAlert('Ungültige Nummer!', 'Fehler');
    return;
  }

  const immobilieId = immobilien[nr - 1].immobilieId;
  const jahr = new Date().getFullYear();

  createPropertyOverview(immobilieId, jahr);
}

/**
 * Zeigt Zahlungsstatus-Report-Dialog
 */
function showZahlungsstatusReportDialog() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    'Zahlungsstatus-Report',
    'Welches Jahr? (z.B. 2025)',
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

  createZahlungsstatusReport(jahr);
}

/**
 * Zeigt System-Info
 */
function showSystemInfo() {
  const props = PropertiesService.getDocumentProperties();
  const version = props.getProperty('SYSTEM_VERSION') || 'Unbekannt';
  const setupDate = props.getProperty('SETUP_DATE') || 'Unbekannt';

  let message = '📊 VERMIETUNGSSYSTEM\n\n';
  message += 'Version: ' + version + '\n';
  message += 'Setup-Datum: ' + (setupDate !== 'Unbekannt' ? formatDatum(new Date(setupDate)) : 'Unbekannt') + '\n\n';

  // Statistiken
  const immobilien = getAlleImmobilien();
  const raeume = getAlleRaeume();
  const vertraege = getAktiveMietvertraege();
  const einnahmen = getEinnahmen({ jahr: new Date().getFullYear() });
  const ausgaben = getAusgaben({ jahr: new Date().getFullYear() });

  message += '🏠 Immobilien: ' + immobilien.length + '\n';
  message += '📋 Räume: ' + raeume.length + '\n';
  message += '📄 Aktive Mietverträge: ' + vertraege.length + '\n';
  message += '💰 Einnahmen (' + new Date().getFullYear() + '): ' + einnahmen.length + ' Transaktionen\n';
  message += '💸 Ausgaben (' + new Date().getFullYear() + '): ' + ausgaben.length + ' Transaktionen\n';

  showAlert(message, 'System-Info');
}

/**
 * Backup-Funktion (Wrapper)
 */
function createBackup() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const response = ui.alert(
    'Backup erstellen',
    'Möchten Sie eine Kopie dieses Spreadsheets erstellen?\n\n' +
    'Die Kopie wird im gleichen Ordner gespeichert.',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  try {
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm');
    const backupName = ss.getName() + ' - Backup ' + timestamp;

    const backup = ss.copy(backupName);

    showAlert(
      '✅ Backup erstellt!\n\n' +
      'Name: ' + backupName + '\n\n' +
      'Das Backup finden Sie in Ihrem Google Drive.',
      'Backup erfolgreich'
    );

  } catch (e) {
    logError('createBackup', e);
    showAlert('❌ Fehler beim Backup:\n' + e.toString(), 'Fehler');
  }
}
