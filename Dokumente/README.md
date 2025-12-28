# 📁 Dokumentenablage Vermietung

Einfache, flache Struktur - Nutzung der Google Drive Suche durch sprechende Dateinamen.

---

## 📂 Ordner

### Vertraege/
Alle Mietverträge (aktiv + beendet)
```
MV-2025-001_Max-Mustermann_Zimmer-1.pdf
MV-2025-002_Revalenz-GmbH_Buero.pdf
MV-2024-005_John-Doe_Zimmer-2_BEENDET.pdf
```

### Belege/
Alle Rechnungen und Belege (Einnahmen + Ausgaben)
```
2025-01-15_Miete_Max-Mustermann_750.00.pdf
2025-03-10_Rechnung_Stadtwerke_Strom_145.50.pdf
2025-02-01_Rechnung_Handwerker_Meier_850.00.pdf
2024-12-20_Airbnb_Auszahlung_1250.00.pdf
```

### Kontoauszuege/
Bank-Statements und CSV-Exports
```
2025-01_Kontoauszug_Sparkasse.pdf
2025-01_Export_Sparkasse.csv
```

### Steuern/
Steuererklärungen und EÜR-Exports
```
2024_EÜR-Export.pdf
2024_Steuererklaerung_Anlage-V.pdf
2024_Steuerbescheid.pdf
```

### Immobilien/
Kaufverträge, Versicherungen, Stammdaten
```
Eigenes-Haus_Kaufvertrag.pdf
Haus-Muenster_Kaufvertrag.pdf
Gebäudeversicherung_Police.pdf
Mietvertrag_VORLAGE.pdf
```

---

## 📝 Namenskonventionen

### Mietverträge
```
Format: MV-YYYY-NNN_Name_Raum[_BEENDET].pdf
Beispiel: MV-2025-001_Max-Mustermann_Zimmer-1.pdf
```

### Belege
```
Format: YYYY-MM-DD_Art_Name_Betrag.pdf
Beispiel: 2025-01-15_Miete_Mustermann_750.00.pdf
Beispiel: 2025-03-10_Rechnung_Stadtwerke_145.50.pdf
```

### Kontoauszüge
```
Format: YYYY-MM_Kontoauszug_Bank.pdf
Beispiel: 2025-01_Kontoauszug_Sparkasse.pdf
```

### Steuern
```
Format: YYYY_Dokumenttyp.pdf
Beispiel: 2024_EÜR-Export.pdf
Beispiel: 2024_Steuererklaerung_Anlage-V.pdf
```

---

## 🔍 Google Drive Suche nutzen

**Sprechende Dateinamen** machen tiefe Ordnerstrukturen überflüssig:

```
Suche: "Stadtwerke 2025"        → Findet alle Stadtwerke-Rechnungen 2025
Suche: "Mustermann"             → Findet Vertrag + alle Belege
Suche: "Rechnung März"          → Findet alle März-Rechnungen
Suche: "Miete"                  → Findet alle Mieteinnahmen
```

**Datum im Dateinamen** (YYYY-MM-DD) sorgt für:
- Automatische chronologische Sortierung
- Einfaches Filtern nach Zeitraum
- Eindeutige Zuordnung

---

## 🔗 Integration mit Buchhaltungssystem

Im Buchhaltungssystem (Vermietungssystem v1.0) können Sie Beleg-Links eintragen:

```
Relativer Pfad: Dokumente/Belege/2025-03-10_Rechnung_Stadtwerke_145.50.pdf
Google Drive: https://drive.google.com/file/d/...
```

---

## 📊 Aufbewahrungspflichten

- **Mietverträge:** 3 Jahre nach Vertragsende
- **Belege:** 10 Jahre
- **Kontoauszüge:** 10 Jahre
- **Steuererklärungen:** 10 Jahre

**Tipp:** Beendete Verträge einfach mit `_BEENDET` im Dateinamen markieren.

---

## ✅ Workflow

### Neuer Mietvertrag
1. PDF speichern: `Dokumente/Vertraege/MV-2025-001_Name.pdf`
2. Im Buchhaltungssystem eintragen

### Beleg ablegen
1. PDF speichern: `Dokumente/Belege/2025-MM-DD_Art_Name_Betrag.pdf`
2. Beim Buchen: Beleg-Link eintragen

### Kontoauszug
1. PDF + CSV speichern: `Dokumente/Kontoauszuege/2025-MM_...`
2. CSV importieren ins Buchhaltungssystem

---

**Einfach, suchbar, effizient** ✨

Version 2.0 (vereinfacht) | Dezember 2025
