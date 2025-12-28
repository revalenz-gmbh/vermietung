# 📁 Dokumentenablage Vermietung

Organisierte Ablage aller vermietungsrelevanten Dokumente nach Jahren und Kategorien.

---

## 📂 Verzeichnisstruktur

### 00_Allgemein - Permanente Dokumente

Dokumente ohne Jahresbezug, die dauerhaft relevant sind:

- **Immobilien/**
  - Kaufverträge
  - Grundbuchauszüge
  - Baupläne, Grundrisse
  - Energieausweise
  - Übergabeprotokolle (Kauf)

- **Versicherungen/**
  - Gebäudeversicherung (Policen)
  - Haftpflichtversicherung
  - Rechtsschutzversicherung
  - Versicherungskorrespondenz

- **Vertragsvorlagen/**
  - Mietvertrag-Vorlagen (Standard, Digital Nomad, Büro)
  - Kautionsvereinbarung
  - Hausordnung
  - Übergabeprotokoll (Mietbeginn/-ende)

- **Vollmachten_Genehmigungen/**
  - Vollmachten für Handwerker
  - Baugenehmigungen
  - Sondergenehmigungen

- **Finanzierung/**
  - Kreditverträge
  - Tilgungspläne
  - Finanzierungsunterlagen

---

### 20XX - Jahresdokumente

Für jedes Jahr (2024, 2025, 2026, ...) gibt es folgende Struktur:

#### 01_Mietvertraege
Aktive Mietverträge dieses Jahres
- **Dateiname:** `MV-YYYY-NNN_Mieter-Name.pdf`
- Beispiel: `MV-2025-001_Max-Mustermann.pdf`
- Zusätzlich: Übergabeprotokolle, Anlagen

#### 02_Belege
Alle Einnahmen- und Ausgabenbelege

- **Einnahmen/**
  - Mietüberweisungen (wenn Beleg/Bestätigung vorhanden)
  - Airbnb-Abrechnungen (monatlich exportiert)
  - Kautionsbelege
  - **Dateiname:** `YYYY-MM-DD_Kategorie_Mieter_Betrag.pdf`
  - Beispiel: `2025-01-15_Miete_Mustermann_750.00.pdf`

- **Ausgaben/**
  - Rechnungen für Reparaturen
  - Grundsteuerbescheide
  - Versicherungsrechnungen
  - Nebenkostenabrechnungen (Stadtwerke, etc.)
  - Handwerkerrechnungen
  - **Dateiname:** `YYYY-MM-DD_Kategorie_Lieferant_Betrag.pdf`
  - Beispiel: `2025-03-10_Reparatur_Meier-GmbH_450.00.pdf`

**Unterordner nach Immobilie (optional):**
```
02_Belege/
├── Ausgaben/
│   ├── IMM-001_Eigenes_Haus/
│   └── IMM-002_Haus_Muenster/
```

#### 03_Kontoauszuege
Monatliche Kontoauszüge der Mietkonten
- **Dateiname:** `YYYY-MM_Kontoauszug_Bankname.pdf`
- Beispiel: `2025-01_Kontoauszug_Sparkasse.pdf`

#### 04_Nebenkostenabrechnungen
Nebenkostenabrechnungen an Mieter
- **Dateiname:** `YYYY_NK-Abrechnung_Mieter-Name.pdf`
- Beispiel: `2025_NK-Abrechnung_Mustermann.pdf`

#### 05_Korrespondenz
E-Mails, Briefe, Kommunikation mit Mietern
- **Unterordner nach Mieter:**
  ```
  05_Korrespondenz/
  ├── Mieter_Max-Mustermann/
  ├── Mieter_John-Doe/
  └── Revalenz-GmbH/
  ```
- **Dateiname:** `YYYY-MM-DD_Betreff.pdf`

#### 06_Steuern
Steuererklärungen und Steuerbescheide
- Anlage V (Vermietung & Verpachtung)
- EÜR-Export aus Buchhaltungssystem
- Steuerbescheide Finanzamt
- **Dateiname:** `YYYY_Steuererklaerung_Anlage-V.pdf`

#### 07_Reparaturen_Instandhaltung
Größere Reparaturprojekte mit Dokumentation
- Kostenvoranschläge
- Rechnungen (Kopie aus 02_Belege)
- Fotos vorher/nachher
- Garantieunterlagen

#### 08_Sonstiges
Sonstige Dokumente des Jahres
- Protokolle
- Notizen
- Sonstiges

---

### Archiv - Abgeschlossene Vorgänge

Für beendete Mietverträge und alte Korrespondenz:

- **Mietvertraege_beendet/**
  - Ordner pro Mieter mit vollständiger Historie
  - Beispiel: `2022-2024_Max-Mustermann/`
    - Mietvertrag
    - Kaution Eingang/Rückzahlung
    - Übergabeprotokolle
    - Nebenkostenabrechnungen
    - Korrespondenz

- **Korrespondenz_alt/**
  - Alte Korrespondenz (>3 Jahre)

- **Belege_alt/**
  - Belege älter als 10 Jahre (nach Aufbewahrungspflicht)

---

## 📝 Namenskonventionen

### Mietverträge
```
Format: MV-YYYY-NNN_Mieter-Name.pdf
Beispiel: MV-2025-001_Max-Mustermann.pdf
```

### Belege
```
Format: YYYY-MM-DD_Kategorie_Lieferant/Mieter_Betrag.pdf
Beispiel: 2025-01-15_Miete_Mustermann_750.00.pdf
Beispiel: 2025-03-10_Reparatur_Meier-GmbH_450.00.pdf
```

### Kontoauszüge
```
Format: YYYY-MM_Kontoauszug_Bank.pdf
Beispiel: 2025-01_Kontoauszug_Sparkasse.pdf
```

### Korrespondenz
```
Format: YYYY-MM-DD_Betreff.pdf
Beispiel: 2025-02-14_Mietminderung-Anfrage.pdf
```

---

## 🔄 Workflow: Dokumente ablegen

### 1. Neuen Mietvertrag ablegen
1. PDF speichern: `Dokumente/2025/01_Mietvertraege/MV-2025-001_Max-Mustermann.pdf`
2. Im Buchhaltungssystem eintragen (Vermietungssystem → Mietverträge)
3. Vertrag-ID notieren für Zahlungszuordnung

### 2. Beleg (Rechnung) ablegen
1. PDF speichern in: `Dokumente/2025/02_Belege/Ausgaben/2025-03-10_Reparatur_Meier-GmbH_450.00.pdf`
2. Im Buchhaltungssystem:
   - Entweder: CSV-Import → Kontobewegungen → Beleg-Link eintragen
   - Oder: Manuelle Buchung → Beleg-Link eintragen
3. Beleg-Link: Relativer Pfad oder Google Drive Link

### 3. Kontoauszug ablegen
1. PDF von Bank herunterladen
2. Speichern: `Dokumente/2025/03_Kontoauszuege/2025-01_Kontoauszug_Sparkasse.pdf`
3. CSV exportieren für Import ins Buchhaltungssystem

### 4. Korrespondenz ablegen
1. E-Mail als PDF speichern (oder Brief scannen)
2. Ablegen in: `Dokumente/2025/05_Korrespondenz/Mieter_Max-Mustermann/2025-02-14_Thema.pdf`

### 5. Mietvertrag beenden
1. Gesamten Ordner erstellen: `Archiv/Mietvertraege_beendet/2022-2024_Max-Mustermann/`
2. Alle relevanten Dokumente kopieren:
   - Mietvertrag
   - Kaution (Ein- und Rückzahlung)
   - Übergabeprotokolle
   - Nebenkostenabrechnungen
   - Korrespondenz
3. Im Buchhaltungssystem: Vertrag auf "Beendet" setzen

---

## 🔍 Wichtige Hinweise

### Aufbewahrungspflichten
- **Mietverträge:** Bis 3 Jahre nach Vertragsende
- **Belege (Einnahmen/Ausgaben):** 10 Jahre (Steuerrecht)
- **Kontoauszüge:** 10 Jahre
- **Steuererklärungen:** 10 Jahre
- **Nebenkostenabrechnungen:** 3 Jahre nach Zustellung

### Backup-Strategie
- **Google Drive:** Automatisches Backup (bereits in "Meine Ablage")
- **Zusätzlich:** Externe Festplatte (jährlich)
- **Cloud-Backup:** Optional (Dropbox, OneDrive)

### Datenschutz
- Persönliche Daten der Mieter (Name, IBAN, etc.) vertraulich behandeln
- Keine Weitergabe an Dritte ohne Einwilligung
- Nach Vertragsende: Archivierung mit Zugriffsbeschränkung

---

## 📊 Integration mit Buchhaltungssystem

Das Buchhaltungssystem (Vermietungssystem v1.0) hat Felder für **Beleg-Link**:

### Beleg-Link eintragen
```
Beispiel (relativer Pfad):
Dokumente/2025/02_Belege/Ausgaben/2025-03-10_Reparatur_Meier-GmbH_450.00.pdf

Beispiel (Google Drive):
https://drive.google.com/file/d/1234567890abcdef/view
```

### Beleg-Nummerierung
Das Buchhaltungssystem generiert automatisch Belegnummern:
- Format: `YYYY-NNN` (z.B. 2025-001)
- Diese Nummer kann optional im Dateinamen ergänzt werden:
  - `2025-03-10_2025-042_Reparatur_Meier-GmbH_450.00.pdf`

---

## 🎯 Checkliste Jahreswechsel

Am Jahresende:
- [ ] Alle Belege des Jahres vollständig abgelegt?
- [ ] Kontoauszüge vollständig (Januar - Dezember)?
- [ ] EÜR aus Buchhaltungssystem exportiert → `06_Steuern/`
- [ ] Steuererklärung vorbereitet (Anlage V)
- [ ] Nebenkostenabrechnungen erstellt und versendet
- [ ] Beendete Mietverträge ins Archiv verschoben
- [ ] Backup erstellt (externe Festplatte)

---

**Erstellt für Vermietung Private**
Version 1.0 | Dezember 2025
