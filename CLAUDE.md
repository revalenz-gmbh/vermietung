# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a **German accounting system** (Buchhaltungssystem) built on **Google Apps Script** for small GmbHs (<300k revenue). The system implements double-entry bookkeeping using the SKR 03 chart of accounts (reduced to ~100 most important accounts).

**Platform:** Google Sheets + Apps Script
**Current Version:** 3.0.2
**Language:** German (UI, comments, variable names, sheet names)

## Project Structure

```
Buchhaltungssystem/v3/
├── Core.gs                 # Main menu, CSV import orchestration
├── Buchungen.gs            # Booking logic, validation
├── Kontobewegungen.gs      # Bank transaction staging (NEW in v3)
├── Kontenrahmen.gs         # SKR 03 chart of accounts + account mapping
├── Dashboard.gs            # Balance sheet, P&L, account balances
├── Bankkonten.gs           # Bank account management
├── DATEV.gs                # DATEV export for tax accountants
├── UStVA.gs                # VAT pre-registration
├── Utils.gs                # Date/number parsing helpers
├── SystemVersion.gs        # Versioning, backups
├── Belegverwaltung.gs      # Document management
└── BuchungDialog.html      # Manual booking UI dialog
```

## Core Architecture

### SSOT (Single Source of Truth) Principle

All configurations are read from sheets, never hardcoded:

- **Kontenrahmen** sheet → All available accounts (SKR 03)
- **Kontenmapping** sheet → Keyword → Account mappings
- **Bankkonten** sheet → Configured bank accounts

### Data Flow: CSV Import → Staging → Bookings

**Version 3.0 introduced a staging workflow:**

```
CSV Import → Kontobewegungen (staging) → Review/Assignment → Buchungen (final bookings)
```

**Key sheets:**
- **Kontobewegungen**: Staging area for imported bank transactions
  - Status: Neu → Zugeordnet → Gebucht/Ignoriert
  - Auto-suggests accounts based on Kontenmapping + learning from previous assignments
- **Buchungen**: Final double-entry bookings (Soll/Haben)
- **Saldenliste**: Account balances (basis for all reports)

### Double-Entry Bookkeeping Logic

Every booking creates TWO entries:
- One SOLL (debit) entry
- One HABEN (credit) entry

Located in `Buchungen.gs` → `createBuchung()` and `bucheKontobewegungen()`

### Intelligent Account Assignment

The system learns from previous assignments:
1. Checks Kontenmapping sheet for keyword matches
2. Learns from previously assigned transactions (Kontobewegungen with status "Gebucht")
3. Validates all accounts against Kontenrahmen sheet

## Common Development Tasks

### Testing Changes

**There is no automated test suite.** Test manually in a Google Sheet:

1. Create a test spreadsheet
2. Extensions → Apps Script
3. Copy all `.gs` and `.html` files
4. Run `setupSystem()` from menu: 📊 Buchhaltung → ⚙️ System → 🚀 System Setup
5. Test with sample CSV imports or manual bookings

### Adding New Accounts to SKR 03

Edit `Kontenrahmen.gs` → `getSKR03Konten()`:

```javascript
{
  konto: '1234',
  bezeichnung: 'Account Name',
  sollHaben: 'Soll', // or 'Haben'
  steuerkey: '',
  kategorie: 'Umlaufvermögen' // or other category
}
```

### Adding New Automatic Mappings

Edit `Kontenrahmen.gs` → `getKontenmappingData()`:

```javascript
{
  keyword: 'telekom',
  konto: '6805',
  bezeichnung: 'Telefon und Internet',
  typ: 'Ausgabe',
  kommentar: 'Telekom Deutschland'
}
```

Keywords are matched case-insensitively against transaction text.

## Key Technical Details

### Date Handling

**Format:** DD.MM.YYYY (German)

Parse with `parseDatumDeutsch()` in `Utils.gs`:
- Supports: DD.MM.YYYY, DD.MM.YY, YYYY-MM-DD, ISO
- Handles 2-digit years (< 50 → 20xx, ≥ 50 → 19xx)

### Currency Handling

**Format:** 1.234,56 € (German)

Parse with `parseBetragDeutsch()` in `Utils.gs`:
- Supports: -123,45 | 123.456,78 | 1,234.56 | -1.234,56 €
- Detects decimal separator automatically (comma vs period)

### CSV Import Logic

Located in `Core.gs` → `importCSV()`:
1. Detects bank account by IBAN or prompts user
2. Parses German date/number formats
3. Detects duplicates (date + amount + text)
4. Writes to Kontobewegungen staging sheet
5. Auto-suggests accounts using Kontenmapping

### DATEV Export

Located in `DATEV.gs` → `exportDATEV()`:
- Exports in DATEV ASCII Format 7.0
- Filtered by year
- Column mapping: Datum, Konto, Gegenkonto, Betrag, Beleg-Nr, Text

## Important Naming Conventions

- **Soll**: Debit (left side)
- **Haben**: Credit (right side)
- **Bankkonto**: Bank account (1200, 1201, etc.)
- **Gegenkonto**: Counter account (opposite side of transaction)
- **Beleg-Nr**: Document/receipt number
- **MwSt**: VAT (Mehrwertsteuer) - rates: 0%, 7%, 19%

## Sheet Structure

All sheets are created by `setupSystem()` in `Core.gs`:

| Sheet | Purpose | Key Columns |
|-------|---------|-------------|
| Kontenrahmen | SKR 03 accounts | Konto, Bezeichnung, Soll/Haben, Steuerkey, Kategorie |
| Kontenmapping | Auto-assignment rules | Schlüsselwort, Konto-Nr, Typ, Kommentar |
| Kontobewegungen | Staging for imports | Bankkonto, Valutadatum, Betrag, Text, Status, Soll-Konto, Haben-Konto, MwSt % |
| Buchungen | Final bookings | Datum, Beleg-Nr, Konto, Gegenkonto, Betrag, Soll/Haben, MwSt %, Text |
| Saldenliste | Account balances | Konto, Bezeichnung, Soll, Haben, Saldo |
| Bilanz | Balance sheet | Auto-generated from Saldenliste |
| GuV | P&L statement | Auto-generated from Saldenliste |

## Menu Functions (accessible via UI)

Located in `Core.gs` → `createMenu()`:

```
📊 Buchhaltung
├── 🆕 Neue Buchung → showBuchungDialog()
├── 📥 CSV-Import → importCSV()
├── 📋 Kontobewegungen
│   ├── ✅ Kontobewegungen buchen → bucheKontobewegungen()
│   ├── 🔄 Kontenvorschläge aktualisieren → aktualisiereKontenvorschlaege()
│   ├── 📌 Alle als zugeordnet markieren → markAlleAlsZugeordnet()
│   └── 📊 Jahresübersicht erstellen → createKontobewegungsJahresSheet()
├── 🔄 Saldenliste aktualisieren → updateSaldenliste()
├── 📊 Bilanz & GuV aktualisieren → updateBilanzGuV()
└── 📤 Export
    ├── 📊 DATEV-Export → exportDATEV()
    └── 📋 USt-Voranmeldung → exportUStVA()
```

## Versioning & Backups

- Version stored in `PropertiesService.getDocumentProperties()`
- Current version constant: `CURRENT_VERSION` in `SystemVersion.gs`
- Backups create full spreadsheet copies with timestamp
- Backup list stored in Properties (max 10 entries)
