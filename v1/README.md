# 📊 Vermietungs-Buchhaltungssystem v1.0

**Einfaches Buchhaltungssystem für private Vermietung**
**Methode:** EÜR (Einnahmen-Überschuss-Rechnung)
**Plattform:** Google Sheets + Apps Script

---

## 🆕 Features

### Private Vermietung optimiert
- ✅ **EÜR-Buchführung** (keine doppelte Buchführung)
- ✅ **Keine MwSt** (Kleinunternehmerregelung)
- ✅ **Multi-Property Support** (mehrere Immobilien/Räume)
- ✅ **Automatisches Payment-Matching** (Zahlung → Mieter)
- ✅ **Mehrere Einnahmequellen** (Direktmiete, Airbnb)
- ✅ **Community-Gebühren Tracking** (für GmbH-Übergabe)

### Vereinfachungen gegenüber GmbH-System
- ❌ Kein DATEV-Export
- ❌ Keine UStVA (USt-Voranmeldung)
- ❌ Kein SKR03 Chart of Accounts (100+ Konten)
- ✅ Nur ~20 einfache Kategorien
- ✅ Single-Entry Buchhaltung (Einnahmen/Ausgaben)

---

## 📁 Dateistruktur

```
Vermietungssystem/v1/
├── Core.gs                    # Hauptlogik, Menü, CSV-Import, System-Setup
├── Utils.gs                    # Date/Number-Parsing, Helper-Funktionen
├── Bankkonten.gs               # Bank-Verwaltung
├── Immobilien.gs               # Immobilien & Räume Management
├── Mietvertraege.gs            # Mietverträge & Mieter-Verwaltung
├── Kontobewegungen.gs          # Staging für CSV-Importe
├── Einnahmen.gs                # Finale Einnahmen (gebucht)
├── Ausgaben.gs                 # Finale Ausgaben (gebucht)
├── Kategorienmapping.gs        # Auto-Zuordnung Keywords → Kategorien
├── Zahlungen.gs                # Payment-Matching-Algorithmus
├── EUeR.gs                     # EÜR-Reporting (Jahresübersicht)
├── RentalDashboard.gs          # Dashboard mit KPIs
└── README.md                   # Diese Datei
```

---

## 📋 Sheet-Struktur

| Sheet | Beschreibung |
|-------|--------------|
| **Dashboard** | Übersicht: Liquidität, Immobilien, Jahresübersicht, offene Zahlungen |
| **Immobilien** | Ihre Immobilien (Name, Adresse, Fläche) |
| **Räume** | Vermietbare Räume (Typ, Größe, Miete) |
| **Mietverträge** | Mietverträge mit Mietern (Laufzeit, Miete, Kaution, Status) |
| **Kontobewegungen** | Staging für CSV-Importe (Neu → Zugeordnet → Gebucht) |
| **Einnahmen** | Finale Einnahmen (nach Kategorie) |
| **Ausgaben** | Finale Ausgaben (nach Kategorie) |
| **Kategorienmapping** | Auto-Zuordnung: Schlüsselwort → Kategorie |
| **Bankkonten** | Ihre Bankkonten (IBAN, BIC) |
| **EÜR** | Jahresübersicht Einnahmen - Ausgaben |
| **Zahlungen** | Optional: Detailliertes Zahlungs-Tracking pro Vertrag |

---

## 🔄 Workflow: CSV-Import → Buchen

```
1. CSV importieren
   └── Menü: 📊 Vermietung → 📥 CSV-Import
   └── Bankkonto wird automatisch erkannt (IBAN)

2. Kontobewegungen prüfen
   └── Sheet "Kontobewegungen" öffnen
   └── Kategorie wird automatisch vorgeschlagen
   └── Vertrag-ID wird automatisch gemappt (Payment-Matching)
   └── Status: "Neu"

3. Zuordnung prüfen/korrigieren
   └── Kategorie anpassen falls nötig
   └── Vertrag-ID prüfen
   └── Status auf "Zugeordnet" setzen

4. Buchungen erstellen
   └── Menü: 📋 Kontobewegungen → ✅ Buchen
   └── Wird in "Einnahmen" oder "Ausgaben" gebucht
   └── Status wird auf "Gebucht" gesetzt

5. Reports aktualisieren
   └── Menü: 📊 Reports → 📋 EÜR aktualisieren
   └── Dashboard aktualisiert sich automatisch
```

---

## 💳 Payment-Matching (Automatisch)

Das System erkennt automatisch, welcher Mieter gezahlt hat:

1. **Vertrag-ID im Text?** → MV-2025-001 → Match ✓
2. **Mieter-Name im Text?** → "Max Mustermann" → Match + Betrag-Verifikation ✓
3. **IBAN im Text?** → Match zu gespeicherter IBAN ✓
4. **Airbnb?** → Kein Match (Lump-Sum) → Manuelle Zuordnung nötig

**Beispiel:**
```
Verwendungszweck: "Überweisung Max Mustermann Miete Januar"
Betrag: 750 €
→ System findet MV-2025-001 (Max Mustermann)
→ Prüft: 750 € ≈ 600 € + 150 € (Miete + NK) ✓
→ Vertrag-ID wird automatisch zugeordnet
```

---

## 📊 Kategorien

### Einnahmen (~5 Kategorien)
- Miete Kaltmiete
- Miete Nebenkosten
- Airbnb Miete
- Kaution Eingang
- Sonstige Einnahmen

### Ausgaben (~15 Kategorien)
- Instandhaltung & Reparatur
- Grundsteuer
- Versicherung (Gebäude, Haftpflicht)
- Hauskosten (Heizung, Wasser, Strom, Müll, Reinigung, Hausmeister)
- Verwaltung & Buchhaltung
- Finanzierung Zinsen
- Abschreibung (AfA)
- Sonstige Ausgaben
- Kaution Rückzahlung

---

## ⚙️ Kategorienmapping anpassen

Das Sheet **"Kategorienmapping"** enthält automatische Zuordnungen:

| Schlüsselwort | Kategorie | Typ | Kommentar |
|---------------|-----------|-----|-----------|
| revalenz | Miete Kaltmiete | Einnahme | Revalenz Office |
| airbnb | Airbnb Miete | Einnahme | Airbnb payouts |
| stadtwerke | Hauskosten Strom | Ausgabe | Electricity |
| grundsteuer | Grundsteuer | Ausgabe | Property tax |

**Eigene Zuordnungen hinzufügen:**
1. Sheet "Kategorienmapping" öffnen
2. Neue Zeile einfügen
3. Schlüsselwort (kleingeschrieben), Kategorie, Typ eingeben
4. Beim nächsten Import wird die Zuordnung verwendet

---

## 🏠 Multi-Property Support

Sie können mehrere Immobilien verwalten:

1. **Immobilien-Sheet**: Tragen Sie Ihre Immobilien ein
   - IMM-001: Eigenes Haus
   - IMM-002: Haus Münster

2. **Räume-Sheet**: Definieren Sie vermietbare Räume
   - RAUM-001: Zimmer 1 (IMM-001)
   - RAUM-002: Zimmer 2 (IMM-001)
   - RAUM-003: Büro Revalenz (IMM-001)

3. **Mietverträge**: Weisen Sie Verträge Räumen zu
   - MV-2025-001: Max Mustermann → RAUM-001

4. **Reports**: Filtern nach Immobilie-ID

---

## 🔗 Revalenz Community-Gebühren

**Spezialfall:** Einige Mieter zahlen zusätzlich Community-Gebühren an die Revalenz GmbH.

**Lösung:**
1. Mietvertrag hat Spalte "Community-Fee (€/Monat)"
2. Dashboard zeigt Summe: "🔗 Revalenz Community Fees: 100 €/Monat"
3. **WICHTIG:** Keine Auto-Synchronisation zur GmbH-Buchhaltung
4. **Manuell buchen** in GmbH-System: Einnahme 100 € (Kategorie: Sonstige Erträge)

---

## 📊 Menü-Struktur

```
📊 Vermietung
├── 🆕 Neue Buchung (manuell)
├── 📥 CSV-Import (Bank/Airbnb)
├── ────────────────────
├── 📋 Kontobewegungen
│   ├── ✅ Kontobewegungen buchen
│   └── 📌 Alle als zugeordnet markieren
├── ────────────────────
├── 🏠 Mietverträge
│   ├── ➕ Neuer Mietvertrag
│   └── ⚠️ Ablaufende Verträge
├── 💳 Zahlungen
│   ├── 🔍 Fehlende Zahlungen prüfen
│   └── 📊 Zahlungsstatus-Report
├── ────────────────────
├── 📊 Reports
│   ├── 📋 EÜR aktualisieren
│   └── 🔄 Dashboard aktualisieren
└── ⚙️ System
    ├── 🚀 System Setup (Erstinstallation)
    └── 📊 System-Info
```

---

## 🚀 Installation

### 1. Google Spreadsheet erstellen
- Neues Google Spreadsheet: "Vermietung - Buchhaltung"

### 2. Apps Script Projekt erstellen
- Erweiterungen → Apps Script
- Alle `.gs` Dateien kopieren (aus `Vermietungssystem/v1/`)

### 3. System-Setup ausführen
- Sheet neu laden (F5)
- Menü: 📊 Vermietung → ⚙️ System → 🚀 System Setup
- Alle Sheets werden automatisch erstellt

### 4. Stammdaten konfigurieren
- **Bankkonten**: IBAN, BIC eintragen
- **Immobilien**: Ihre Immobilien hinzufügen
- **Räume**: Vermietbare Räume definieren
- **Mietverträge**: Aktuelle Verträge eintragen

### 5. Kategorienmapping anpassen
- Eigene Keywords hinzufügen (optional)

### 6. Ersten CSV-Import testen
- CSV-Datei vom Bankkonto vorbereiten
- Menü: 📥 CSV-Import
- Workflow durchlaufen

---

## 📝 Technische Details

### Plattform
- **Google Sheets** + **Google Apps Script**
- **JavaScript** (ES6+)
- **Keine externen Dependencies**

### Datenformat
- **Datum:** DD.MM.YYYY (deutsch)
- **Betrag:** 1.234,56 € (deutsch)

### Besonderheiten
- **Single-Entry:** Keine Soll/Haben (nur Einnahmen/Ausgaben)
- **EÜR-konform:** Für Steuererklärung Anlage V (Vermietung & Verpachtung)
- **Keine MwSt:** Kleinunternehmer-Regelung

---

## ❓ Häufige Fragen

### Kann ich das System mit dem GmbH-System kombinieren?
Nein, es ist bewusst **getrennt**. Die GmbH-Buchhaltung bleibt in der eigenen Datei. Nur Community-Gebühren müssen manuell in die GmbH-Buchhaltung übertragen werden.

### Wie handhabe ich Airbnb-Zahlungen?
Airbnb zahlt Lump-Sums (mehrere Buchungen zusammen). Der Import erkennt "Airbnb" und ordnet Kategorie "Airbnb Miete" zu. Vertrag-ID bleibt leer → Sie können manuell zuordnen oder als Lump-Sum buchen.

### Wie erstelle ich die Steuererklärung?
- Menü: 📊 Reports → 📋 EÜR aktualisieren
- Daten aus EÜR-Sheet für Anlage V nutzen
- Nach Kategorien aufgeschlüsselt

### Kann ich Nebenkostenabrechnung erstellen?
Aktuell nicht automatisch. Sie können aber:
- Umlagefähige Kosten (Spalte in Ausgaben-Sheet)
- Manuell auf Mieter aufteilen

---

## 🛠️ Weiterentwicklung

**Geplante Features (optional):**
- Automatische Nebenkostenabrechnung
- Airbnb API Integration
- Email-Benachrichtigungen bei fehlenden Zahlungen
- Dokumenten-Management (Belege, Verträge)

---

**Entwickelt für private Vermietung mit <10 Mieteinheiten**

Version 1.0.0 | Dezember 2025
