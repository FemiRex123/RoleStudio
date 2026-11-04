# Role Studio · Safer Payments

Proof of Concept zur Planung und Dokumentation hierarchischer Kundenrollen.

## Aktueller Funktionsumfang

- Projekte → Kunden → Rollen: anlegen, umbenennen, kopieren und löschen.
- Getrennte Kataloge für Mandator Roles und Global Roles mit synthetischen Namen.
- Hierarchische Berechtigungen, Beschreibungen beim Mouseover und bearbeitbarer Katalog.
- CSV-Export sowie Druckansicht zum Speichern als PDF.
- Serverseitige Speicherung über ein Cloudflare-D1-kompatibles Datenbankbinding `DB`.
- Administratoren, Bearbeiter und Leser; manuelle Projektfreigaben und Kontosperren.

**Noch nicht implementiert:** CSV-Import, Safer-Payments-Benutzerzuordnung, Rollenvergleich,
IST-/SOLL-Vergleich und eine Rückübertragung nach IBM Safer Payments.
Die Verwaltung der Website-Konten ist von Benutzerkonten in Safer Payments unabhängig.

## Lokal starten

Voraussetzungen: Node.js 22 oder neuer, Python 3 mit dem Standardmodul `sqlite3`.
Für den Build wird zusätzlich Bash benötigt (unter Windows z. B. WSL).
Es werden keine npm-Pakete benötigt; `npm install` ist für diese Version nicht erforderlich.

```sh
npm run dev
```

Öffne `http://127.0.0.1:4173/`.

**Die lokale Vorschau simuliert das Konto `admin@example.test` und ist kein echter Login.**
Sie bindet ausschließlich an die Loopback-Adresse. Nicht über Portfreigaben, Tunnel oder
Reverse Proxys für andere Benutzer veröffentlichen. Die lokale SQLite-Datenbank liegt in
einem temporären Verzeichnis; bei jedem Neustart beginnt eine neue Demo mit den Beispieldaten.
Der lokale Server versendet keine Anmeldemails und liest keine echten Systemexporte.

## Tests und Build

```sh
npm test
npm run build
npm run validate
```

Die Tests verwenden eine getrennte temporäre SQLite-Datenbank. Sie prüfen unter anderem
anonyme Zugriffe, Konten ohne Projektfreigabe, Leser, Bearbeiter, Administratoren,
Widerruf der Freigaben, Wiederherstellung und Schutz des Eigentümers.
`dist/` wird beim Build neu erzeugt und nicht eingecheckt.

## Aufbau

| Pfad | Aufgabe |
| --- | --- |
| `page.html` | Deutsche Oberfläche einschließlich Browserlogik |
| `worker/index.js` | Worker, API, Autorisierung und eingebettete Demodaten |
| `seed.json` | Synthetischer Berechtigungskatalog als Referenz |
| `drizzle/` | SQL-Migrationen für Zustand, Konten und Projektfreigaben |
| `scripts/dev.mjs` | Lokale Demo mit simulierter Identität und SQLite-Adapter |
| `scripts/access-test.mjs` | Serverseitige Berechtigungstests |
| `scripts/embed-page.mjs` | Übernimmt `page.html` in den Worker |
| `.openai/hosting.example.json` | Beispiel für Sites-Datenbankbinding ohne Site-ID |

Oberflächenänderungen in `page.html` vornehmen. `npm run build` aktualisiert daraus den
eingebetteten HTML-Teil in `worker/index.js`. Der Worker bleibt eine eigenständige ESM-Datei.
`seed.json` ist ein Katalog, kein Export der laufenden Datenbank.

## Hosting und Anmeldung

Die aktuelle Anwendung wurde für die Ausführung hinter dem Sites-Authentifizierungsdienst
gebaut. Dieser liefert serverseitig die verifizierten Header
`oai-authenticated-user-id` und `oai-authenticated-user-email` und betreibt
`/signin-with-chatgpt` sowie `/signout-with-chatgpt`.

Für ein eigenes Deployment sind notwendig:

1. Ein D1-kompatibles Binding `DB` und die Migrationen aus `drizzle/`.
2. Die serverseitige Laufzeitvariable `OWNER_EMAIL` mit der verifizierten E-Mail-Adresse
   des Eigentümers. Nicht konfiguriert: API antwortet mit HTTP 503. Eine `.env.example`
   ist nur Dokumentation; der Worker lädt keine `.env`-Datei selbstständig.
3. Die bestehende Sites-Anmeldung oder eine fachgerecht implementierte eigene
   Authentifizierung für die interne Zielplattform.
4. Bei Sites eine eigene `.openai/hosting.json` mit der tatsächlichen `project_id` und
   den Bindings. Diese lokale Konfiguration ist von Git ausgeschlossen.

**Identitätsheader sind nur hinter einem vertrauenswürdigen Authentifizierungsdienst zulässig.**
Ein frei erreichbarer Worker, der solche Header ungeprüft von Clients akzeptiert,
ist keine sichere Installation. Für internen Betrieb muss die Anmeldung z. B. an die
freigegebene Unternehmensanmeldung angepasst werden. Der Entwicklungsserver ist dafür
nicht geeignet. GitHub Pages kann das Backend mit Datenbank und Autorisierung nicht ersetzen.

Die ursprüngliche laufende Website wird durch dieses Repository nicht verändert.
Es besteht **keine automatische Synchronisierung oder Veröffentlichung zwischen GitHub und Sites**.
Dies ist eine bereinigte Übernahme des Funktionsstands von Sites-Version 2.
Die persönliche Eigentümeradresse wurde durch eine Laufzeitkonfiguration ersetzt.

## Zusammenarbeit

Neue Funktionen in einem separaten Branch entwickeln, lokal testen und per Pull Request
prüfen. `main` enthält den gemeinsamen Stand. Sinnvolle nächste Aufgaben sind das Festlegen
des CSV-Datenvertrags und ein Import mit Vorschau, bevor Daten gespeichert werden.

## Umgang mit Daten

Dieses Repository enthält ausschließlich Code und synthetische Demodaten. CSV-Dateien,
Benutzerbestände, produktive Konfigurationen, Datenbankdateien und Zugangsdaten gehören
nicht hinein. Die `.gitignore` hilft dabei, ersetzt aber keine Prüfung vor einem Commit.
Das Repository enthält keine IBM-Software und keine Verbindung zum IBM-System.
Für einen dienstlichen Einsatz sind die freigegebene Quellcodeablage und Betriebsplattform
mit dem Arbeitgeber abzustimmen.
