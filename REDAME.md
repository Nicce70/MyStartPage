# MyStartPage – Webbaserad start- och dashboardsida

Detta är en webbaserad start-/dashboardsida gjord i **TypeScript** med stor hjälp av Google AI Studio.  
Den är helt **gratis**, **öppen källkod**.

Det är en kombination av **startpage och dashboard** där du kan samla länkar och olika widgets.  

##Integration med Homey Pro 2023

För att använda den mot Homey Pro 2023, använder du antingen webhooks eller kör appen lokalt.  
Du kan se status och styra enheter direkt från sidan (beroende på hur du kör appen).

> **Obs:** Detta är *inte* en officiell Homey-app, utan något jag byggt för privat bruk egentligen.

---

## ⭐ Hur du kan använda sidan

Det finns tre sätt att köra den, beroende på vad du vill göra och vilken funktionalitet du behöver.

---

## 1. Kör direkt från GitHub Pages (enklast)

Gå bara till adressen:

👉 **https://nicce70.github.io/MyStartPage/**

Det här är det absolut enklaste sättet att använda sidan.

**Begränsningar när du kör via GitHub Pages:**

- Du kan **bara styra Homey via webhooks**
- Du kan **inte läsa tillbaka status** från Homey
  (Homey kräver att webbsidan körs lokalt i samma nätverk för detta)

Allt annat i appen fungerar som vanligt.

---

## 2. Köra lokalt via PC med Vite (i utvecklingsläge)

Det här är för dig som vill:

- Kanske ändra i koden själv  
- Testa funktioner live  
- Få snabb utvecklingsserver

När du kör via Vite betyder det:

- Du kör den **okompilerade TypeScript-koden**
- Vite översätter och serverar allt automatiskt till webbläsaren
- Du behöver ha **Node.js** installerat

## Vad är Node.js?

Node.js är en plattform som låter dig köra JavaScript-kod utanför webbläsaren, alltså på din dator. Den behövs för att kunna använda verktyg som Vite, som bygger och serverar din app under utveckling.

**Så här kommer du igång:**

1. **Installera Node.js**

- Gå till https://nodejs.org/

- Ladda ner och installera den rekommenderade versionen för ditt operativsystem (Windows, macOS, Linux).

- När installationen är klar, öppna ett terminal- eller kommandofönster och skriv node -v för att verifiera att Node.js är installerat. Du ska se versionsnumret, t.ex. v20.x.x.

2. **Ladda ner projektet från GitHub**

- Gå till projektets GitHub-sida.

- Klicka på "Code" och välj "Download ZIP".

- Packa upp filerna på en lämplig plats på din dator.

3. **Öppna en terminal / kommandoprompt**

- Navigera till mappen där du pacakde upp filerna (t.ex. "cd C:\Users\DittNamn\MyStartPage")

4. **Installera beroenden**

- Skriv "npm install" och tryck Enter
om allt gick ok
- Skriv "npm install socket.io-client" och tryck Enter
(Detta hämtar och installerar alla nödvändiga paket som projektet behöver (inklusive Vite och React))

5. **Starta utvecklingsservern**

- Skriv "npm run dev" och tryck Enter

- Vite startar en lokal webserver och visar en länk, oftast http://localhost:3000/

- Öppna den länken i din webbläsare för att se appen live (alltså skriv "http://localhost:3000/" i din webläsare)

Nu öppnas förhoppningsvis MyStartpage i din webbläsare.

(Nu kan du ändra i koden och sidan laddas om automatiskt när du sparar)

**Bra att veta**

För att avsluta servern, tryck Ctrl+C i terminalen

Om du får fel, kontrollera att Node.js är korrekt installerat och att du kör kommandon i rätt mapp

Om du vill bygga färdiga filer för produktion (t.ex. för att lägga på en NAS) använder du kommandot "npm run build"

---

## 3. Köra på en NAS (med en webserver som Apache eller liknande)

Om du vill köra sidan på en NAS (t.ex. Asustor, Synology, QNAP) måste du använda de kompilerade HTML/JavaScript-filerna.

De färdiga kompilerade filerna ligger här i GitHub-repot:
👉 /docs (det är samma innehåll som normalt hamnar i “dist/” efter en build)

Det här är viktiga skillnaden:

- NAS:ens server kan inte köra okompilerad TypeScript eller utvecklingskod, den kan bara servera färdiga statiska filer (HTML, JS, CSS), därför måste man använda den kompilerade versionen som ligger i /docs. Det är dessa filer Apache/Nginx använder för att köra sidan:
index.html
/assets

⭐ Måste jag vara i samma nätverk som Homey?

Ja – om du vill både styra och läsa status.

Undantag:
Om du använder VPN funkar allt fullt ut var du än är, för det blir som att du kör lokalt

⭐ Funktioner

Favoritlänkar med grupperingar

Widgets: väder, radio, tid, kalender m.m.

Backup/export av all konfiguration (sparas lokalt i webbläsaren)

Homey-integration: styrning, status, enhetslistor

---

## Instruktioner för att köra MyStartPage på en NAS (Apache, Nginx, Asustor, Synology, QNAP)

0. Du måste ha en webserver aktiverad på din NAS, har du inte redan det, hoppa ner till separata instruktioner för detta längre ner!

1. Öppna projektets GitHub-sida och gå till mappen som heter “docs”. Det är där de färdiga kompilerade filerna ligger. Detta är samma filer som normalt hamnar i “dist” när man gör en build, men de finns redan färdiga i “docs”.

2. Ladda ner filerna från mappen “docs” till din dator. Det du behöver är:

index.html
hela mappen “assets” (med alla JavaScript-, CSS- och bildfiler)

3. Logga in på din NAS och öppna den webserver du använder (t.ex. Apache eller Nginx). 
På de flesta NAS finns en mapp som heter “web”, “www” eller liknande där man placerar webbfiler.

Kopiera filen index.html och hela mappen assets till webserverns katalog på din NAS. Det är mycket viktigt att både index.html och mappen assets ligger på samma nivå i samma mapp, alltså tillsammans sida vid sida.
(Byt inte namn på index.html — den måste heta exakt så för att webbsidan ska fungera som förväntat.)

Strukturen i webbkatalogen ska alltså se ut så här:

/web
├── index.html
└── assets/
   └── (alla JS/CSS/bilder)

4. När filerna ligger på plats, öppna webbläsaren och gå till adressen för din NAS webbserver, till exempel:
http://din-nas-ip-adress/

eller om du lade filerna i en undermapp:
http://din-nas-ip-adress/mystartpage/

5. Sidan ska nu starta direkt från NAS:en. Alla funktioner som inte kräver Homey kommer att fungera direkt.

6. Om du vill använda Homey-integration (styra enheter och hämta status) måste du befinna dig i samma nätverk som din Homey Pro. Alternativt kan du använda VPN. Då fungerar allt på samma sätt som om du var hemma.

7. Alla inställningar och favoritlänkar du skapar sparas automatiskt i webbläsaren via LocalStorage. Det innebär att inställningarna är unika för varje webbläsare och enhet du använder.

8. Webhooks fungerar även om du inte är i samma nätverk som Homey, men att läsa status och enhetsvärden kräver att webbsidan körs lokalt på samma nätverk eller via VPN.

---

## INSTALLERA EN WEBSERVER PÅ DIN NAS

**Så här startar du en webserver på din NAS (generella instruktioner)**

De flesta NAS-enheter kan köra en enkel webbserver som låter dig visa statiska webbsidor (HTML, CSS, JavaScript). Det är allt som behövs för MyStartPage. Så här gör du oavsett NAS-modell:

1. **Logga in i din NAS administrativa webbpanel via webbläsaren** (t.ex. http://din-nas-ip-adress:5000 eller http://din-nas-ip-adress:8000 beroende på modell).

2. **Öppna NAS:ens app-/paketcenter.**
Sök efter någon av följande:

“Web Server”
“Apache”
“Nginx”
“Web Station”
“Hosting”
“WWW Server”

3. **Installera webservern med standardinställningar.**
På vissa NAS-modeller aktiveras även PHP eller MySQL, men det behövs inte för denna app — du kan ignorera alla sådana extra funktioner.
När webservern är installerad finns det alltid en webbmapp där du ska lägga dina filer. Den brukar heta något i stil med:

/web
/www
/var/www
/home/www
/WebServer
/volume1/web (Synology)

Webbmappen är den katalog som webservern visar när du går till din NAS IP-adress i webbläsaren.

4. **Starta om webservern via NAS kontrollpanel** (ofta heter det “Restart Service”).

5. **Klart!**
Din NAS kör nu appen som en egen liten webserver, helt utan backend, helt lokalt i ditt nätverk.

Tips:
Om du vill komma åt sidan även utanför hemmet kan du:

använda VPN

inte öppna portar på internet

inte använda port forwarding
(det är säkrare så)
