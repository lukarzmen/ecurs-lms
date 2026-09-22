# Ecurs LMS

Ecurs to full-stackowa platforma edukacyjna (LMS) zbudowana w Next.js 15.
Pozwala tworzyc i sprzedawac kursy online, prowadzic szkoly (multi-tenant),
zarzadzac uczniami i materialami, korzystac z AI (OpenAI/ElevenLabs) oraz obslugiwac platnosci Stripe.

## Co robi aplikacja

- Dla nauczyciela: tworzenie kursow, lekcji, modulow, sciezek edukacyjnych, promocji i tresci interaktywnych.
- Dla ucznia: przegladanie oferty, zapis, zakup dostepu, odtwarzanie lekcji i realizacja interaktywnych zadan.
- Dla szkoly: obsluga modelu multi-tenant, przypisywanie nauczycieli, kontrola kursow i wspolna monetyzacja.
- Dla platformy: marketplace kursow i sciezek, analityka, powiadomienia, webhooki i procesy cykliczne.
- Dla edytora tresci: rozbudowany Lexical Editor z formatowaniem, multimediami, quizami i AI.

## Podstawy techniczne

- Next.js 15 z App Router i route groups dla czesci auth, course, dashboard i legal.
- Clerk jako warstwa autoryzacji i sesji; middleware chroni trasy oraz endpointy API.
- PostgreSQL + Prisma; baza pracuje w `relationMode = "prisma"`, a wiele modeli jest scentralizowanych wokol `schoolId`.
- Dane glownych obiektow to m.in. `Course`, `Module`, `EducationalPath`, `School`, `UserCourse` i modele platnosci.
- Frontend korzysta z React 18, Tailwind CSS, shadcn/ui i Radix UI; stan lokalny i kontekst aplikacji sa oparte o React hooks oraz Zustand.
- Edytor tresci jest oparty o Lexical i ma wlasne nody oraz pluginy dla obrazow, tabel, quizow, zadan, AI i eksportu.
- Integracje zewnetrzne obejmuja Stripe Connect, OpenAI, ElevenLabs, Azure Blob, Redis, poczte i endpointy webhook/cron.
- i18n jest wlasne, dwujezyczne (`pl` i `en`), z polskim jako domyslnym jezykiem interfejsu.
- Wszystkie skrypty uruchamiaja sie z `TZ=Europe/Warsaw`, co jest istotne dla dat, webhookow i procesow planowanych.

## Struktura projektu

- `app/(auth)` - logowanie i rejestracja przez Clerk.
- `app/(course)` - publiczne strony kursow, zapis i odtwarzanie lekcji.
- `app/(dashboard)` - panel nauczyciela, ustawienia i widoki administracyjne.
- `app/(legal)` - regulamin i polityka prywatnosci.
- `app/api` - wszystkie endpointy backendowe w modelu App Router.
- `components/editor` - rozbudowany Lexical Editor z wlasnymi pluginami i nodami.
- `components/ui` - wspolne komponenty UI.
- `hooks` - hooki i stan aplikacji.
- `lib` - klient bazy, narzedzia, i18n, pomocnicze integracje.
- `services` - integracje zewnetrzne, takie jak OpenAI, ElevenLabs, Azure Blob i Redis.
- `prisma` - schema i migracje bazy danych.

## Najwazniejsze endpointy API

### Kursy i lekcje

- `/api/courses` oraz `/api/courses/search` - lista, wyszukiwanie i zarzadzanie kursami.
- `/api/courses/[courseId]` - pojedynczy kurs.
- `/api/courses/[courseId]/chapters` i `/api/courses/[courseId]/chapters/[chapterId]` - rozdzialy i ich edycja.
- `/api/courses/[courseId]/chapter/*` oraz `/state`, `/mode`, `/price`, `/checkout`, `/payment-status` - stan kursu, cena i platnosci.
- `/api/content/[moduleId]` oraz `/api/module/[moduleId]` - tresc i stan modulu.
- `/api/module/[moduleId]/complete` - oznaczanie ukonczenia lekcji.

### Sciezki edukacyjne

- `/api/educational-paths` - CRUD sciezek edukacyjnych.
- `/api/educational-paths/[id]` - szczegoly sciezki.
- `/api/educational-paths/[id]/courses` - przypisanie kursow do sciezki.
- `/api/educational-paths/[id]/checkout`, `/price`, `/payment-status`, `/promocode`, `/state`, `/mode` - sprzedaz i zarzadzanie.

### Szkoly i uzytkownicy

- `/api/schools` i `/api/schools/current` - dane szkol oraz aktualny kontekst szkoly.
- `/api/schools/create`, `/invite-teacher`, `/members`, `/students`, `/analytics`, `/stats` - zarzadzanie szkoła i zespolami.
- `/api/schools/join-request`, `/pending-requests`, `requests/[requestId]/accept|reject` - proces dolaczania nauczycieli.
- `/api/user/*` - profil, szkoły, status szkoly, dane biznesowe i identyfikator providerId.
- `/api/student` i `/api/student/*` - wyszukiwanie, kursy, sciezki i status ucznia.
- `/api/permissions` - sprawdzanie dostepow i uprawnien.

### Platnosci i integracje

- `/api/stripe/*` - Stripe Connect, tworzenie linkow onboardingu i zmiany typu konta.
- `/api/webhook` - glowny webhook Stripe.
- `/api/notifications/*` - harmonogramy, wysylka maili i cron.
- `/api/audio/*` i `/api/transcribe` - generowanie i obsluga audio.
- `/api/image` - upload i pobieranie plikow graficznych.
- `/api/legal/*` - akceptacja i wersje dokumentow prawnych.
- `/api/analytics` oraz `/api/student-analytics` - analityka platformy i nauki.

### Narzedzia administracyjne

- `/api/admin/fix-paths-categories` - narzedzie naprawcze dla danych katalogowych.
- `/api/tasks` - zadania systemowe i pomocnicze.
- `/api/wishlist` - lista zyczen i ulubione materiały.

## Model danych w skrócie

- `User` - konto z `providerId` dla Clerk, rolem i danymi profilu.
- `School` - jednostka multi-tenant z nauczycielami, kursami i ściezkami.
- `Course` - kurs z autorem, szkola, kategoria, cena, modulami i statusem.
- `Module` - lekcja/moduł z pozycją, statusem i opcjonalna data publikacji.
- `ModuleContent` - jedna tresc JSON Lexical na modul.
- `EducationalPath` - sciezka edukacyjna z uporzadkowanymi kursami i cena.
- `UserCourse` i `UserEducationalPath` - zapisy i dostepy użytkowników.
- `CoursePrice`, `EducationalPathPrice`, `PromoCode` i modele zakupowe - monetizacja i rabaty.
- `Attachment` i `Image`/audio upload flow - pliki i media przechowywane poza tekstem.

## Role i uprawnienia

- **Uczen** - przegladanie kursow, zakup dostepu, realizacja modulu i oznaczanie postepu.
- **Nauczyciel** - tworzenie kursow, modulow, sciezek, promocji, szkol i komunikatow.
- **Wlasciciel szkoly** - zarzadzanie szkola, zespolem, onboardingiem Stripe i rozliczeniami.
- **Administrator platformy** - narzedzia naprawcze, analityka i endpointy operacyjne.
- **Clerk + middleware** - dostep do wiekszosci tras i API jest chroniony przez sesje.

## Integracje zewnetrzne

- **Clerk** - autoryzacja, sesje, logowanie i rejestracja.
- **Stripe** - platnosci kursow i sciezek, Stripe Connect dla szkól i webhooki.
- **OpenAI** - generowanie tresci, przeksztalcenia i pomoc AI w edytorze.
- **ElevenLabs** - text-to-speech i audio dla tresci edukacyjnych.
- **Azure Blob Storage** - upload i serwowanie plikow oraz obrazow.
- **Redis** - cache i uslugi pomocnicze.
- **Poczta SMTP** - powiadomienia i komunikacja systemowa.

## Jak dziala edytor Lexical

- Edytor bazuje na `components/editor/LexicalEditor.tsx`, `Editor.tsx` i `ToolbarPlugin`.
- Tresc lekcji jest zapisywana jako JSON Lexical w `ModuleContent.data`.
- Toolbar pozwala wstawiać multimedia, tabele, quizy, zadania, bloki AI i eksport HTML/PDF.
- Pluginy edytora wspieraja autolinki, listy, checklisty, code highlighting, layouty i elementy interaktywne.
- Zmiany sa przesylane do rodzica przez `onEditorChange`, a zapis realizuje `onSave`.
- Część funkcji jest opcjonalna i zalezy od ustawien edytora, na przyklad spis tresci, limit dlugosci lub menu kontekstowe.
- Edytor ma tez mechanizm oznaczania ukończenia lekcji na podstawie node'ow z `__isCompleted`.

## Glowne obszary funkcjonalne

### Panel nauczyciela

- tworzenie i edycja kursow oraz modulow,
- budowanie sciezek edukacyjnych z kolejnoscia kursow,
- zarzadzanie cena, promocjami i publikacja tresci,
- praca na interaktywnym edytorze z multimediami i elementami AI,
- podglad i eksport przygotowanych materialow.

### Panel ucznia

- przegladanie publicznego katalogu kursow i sciezek,
- rejestracja oraz zakup dostepu przez Stripe,
- konsumowanie lekcji z elementami interaktywnymi,
- sledzenie postepu i statusu ukonczenia tresci,
- odbior powiadomien oraz materialow wspierajacych nauke.

### Szkoly i monetyzacja

- model multi-tenant z przypisaniem kursow i sciezek do szkol,
- obsluga nauczycieli w ramach szkoly i uprawnien wlascicielskich,
- Stripe Connect dla kont szkolowych i rozliczen,
- kody promocyjne oraz typy platnosci dla kursow i sciezek,
- webhooki i logika dotyczaca subskrypcji, zwrotow i statusow platnosci.

### Automatyzacja i operacje

- endpointy API dla kursow, szkol, uczniow, uploadu, platnosci i analityki,
- zadania cykliczne i powiadomienia,
- upload plikow i obrazow przez Azure Blob,
- cache i infrastruktura pomocnicza przez Redis,
- integracje AI do generowania i przeksztalcania tresci.

## Szybki start (lokalnie)

1. Sklonuj repozytorium:

```bash
git clone https://github.com/lukarzmen/ecurs-lms
cd ecurs-lms
```

2. Zainstaluj zaleznosci:

```bash
npm install
```

3. Przygotuj env:

```bash
cp .env.dev .env.local
cp .env.development .env.development.local
```

4. Uzupelnij `.env.local` i uruchom:

```bash
npm run dev
```

Aplikacja bedzie dostepna pod `http://localhost:3000`.

## Zmienne srodowiskowe (env)

Minimalny zestaw wymagany do poprawnego dzialania:

```env
# App
NEXT_PUBLIC_APP_URL=https://twoja-domena.pl
NEXT_PUBLIC_API_URL=https://twoja-domena.pl
NEXT_PUBLIC_TEST_ENV=false

# Database
DATABASE_URL=postgresql://user:password@127.0.0.1:5432/ecurs

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK__AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/register

# AI
OPENAI_API_KEY=
ELEVENLABS_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_WEBHOOK_SECRET=
STRIPE_PUBLIC_KEY=

# Mail / Notifications
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
CRON_SECRET=

# Redis (uzywane przez RedisService)
AZURE_REDIS_CONNECTIONSTRING=
```

Uwagi:

- `NEXT_PUBLIC_APP_URL` i `NEXT_PUBLIC_API_URL` na produkcji powinny wskazywac publiczna domene aplikacji.
- `CRON_SECRET` jest wymagany do bezpiecznego recznego wywolywania endpointu crona.
- Dla Clerk musisz ustawic poprawne domeny i redirect URI po stronie dashboardu Clerk.

## Wdrozenie na wlasny serwer (Linux)

Projekt jest przygotowany pod self-hosting (bez Vercela), np. VPS/VM z publicznym IP:

- Ubuntu/Debian
- Node.js 20+
- PostgreSQL 15+
- Nginx (reverse proxy)
- SSL (np. certbot)

### 1. Build aplikacji

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

### 2. Start procesu aplikacji

Najprosciej przez PM2:

```bash
npm i -g pm2
pm2 start npm --name ecurs-lms -- start
pm2 save
pm2 startup
```

Aplikacja uruchamia sie komenda `npm start` (port 3000).

### 3. Reverse proxy (Nginx)

Przykladowy blok serwera:

```nginx
server {
	listen 80;
	server_name ecurs.pl www.ecurs.pl;

	location / {
		proxy_pass http://127.0.0.1:3000;
		proxy_http_version 1.1;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
	}
}
```

Nastepnie dodaj SSL (np. certbot) i przekierowanie HTTP -> HTTPS.

### 4. Cron na wlasnym serwerze

W repo jest endpoint `GET/POST /api/notifications/cron`.
Na self-hostingu ustaw systemowy cron, np. codziennie o 07:00:

```cron
0 7 * * * curl -sS -H "Authorization: Bearer ${CRON_SECRET}" https://twoja-domena.pl/api/notifications/cron > /dev/null
```

## Gdzie wdrazac

Polecane opcje dla tej aplikacji:

- VPS z Dockerem lub bez (Hetzner, OVH, DigitalOcean, Mikroserwer).
- VM w chmurze (AWS EC2, GCP Compute Engine, Azure VM).
- On-premise Linux z publicznym reverse proxy.

Najwazniejsze wymagania to stabilny PostgreSQL, poprawnie ustawione env, SSL i webhooki Stripe/Clerk.

## Webhooki i integracje

- Stripe webhook endpoint: `/api/webhook`.
- Upewnij sie, ze ustawione sa oba sekrety: `STRIPE_WEBHOOK_SECRET` i `STRIPE_CONNECT_WEBHOOK_SECRET`.
- Przy zmianie domeny zaktualizuj URL-e w Stripe i Clerk.

## Przydatne komendy

```bash
npm run dev
npm run lint
npm run build
npm start
```

## Lexical Editor

Edytor lekcji znajduje sie w `components/editor/`. Ponizsza lista opisuje funkcje
faktycznie podlaczone do glownego komponentu edytora i toolbara.

### Dostepne funkcje

**Edycja i formatowanie**

- zapis tresci, historia zmian w sesji (undo/redo) i czyszczenie dokumentu,
- akapity, naglowki H1-H3, cytaty oraz bloki kodu z wyborem jezyka i motywu,
- listy numerowane, punktowane i checklisty z ograniczeniem zagniezdzenia,
- pogrubienie, kursywa, podkreslenie, przekreslenie, indeks dolny i gorny,
- kod inline, podswietlenie, kolor tekstu i tla, kroj oraz rozmiar czcionki 8-72 px,
- wyrownanie tekstu, wciecia, linki automatyczne i edytowane recznie,
- skroty klawiaturowe, menu formatowania zaznaczenia i przeciaganie blokow na desktopie,
- emoji, hashtagi i automatyczne oznaczanie slow kluczowych.

**Struktura i multimedia**

- obrazy (takze przez wklejenie lub drag and drop), audio i transkrypcja,
- osadzanie YouTube oraz innych zrodel obslugiwanych przez `AutoEmbedPlugin`,
- tabele z laczeniem komorek, kolorami tla, zmiana rozmiaru i menu operacji,
- uklady wielokolumnowe, sekcje zwijane, notatki, wzory matematyczne,
- linie poziome, podzialy stron i spis tresci wlaczany w ustawieniach,
- podswietlanie skladni kodu oraz akcje kopiowania i zmiany jezyka bloku.

**Elementy edukacyjne**

- quizy, pytania prawda/falsz i zadania z wyborem odpowiedzi,
- porzadkowanie elementow, uzupelnianie luk i listy zadan,
- pytania otwarte, zadania opisowe, definicje/wyjasnienia oraz slownik pojec,
- wykrywanie ukonczenia interaktywnych wezlow i przekazywanie postepu lekcji.

**AI i narzedzia dokumentu**

- generator calej lekcji i generator fragmentow tresci,
- tlumaczenie, generowanie odpowiedzi do pytan i rozwiazywanie zadan opisowych,
- text-to-speech przez ElevenLabs,
- eksport dokumentu do samodzielnego HTML i do PDF przez widok wydruku,
- kody QR jako zamiennik materialow YouTube w eksporcie.

### Funkcje czesciowe lub nieaktywne

- Excalidraw ma zarejestrowany plugin i node, ale pozycja w menu wstawiania jest
  zakomentowana.
- Autouzupelnianie ma przelacznik w ustawieniach, ale `AutocompletePlugin` nie jest
  renderowany.
- Ustawienia menu kontekstowego i zachowania nowych linii Markdown nie maja obecnie
  aktywnego konsumenta w glownym edytorze.
- Import/eksport pliku JSON, konwersja Markdown, udostepnianie dokumentu i
  speech-to-text istnieja w kodzie `ActionsPlugin`, lecz sam plugin nie jest
  podlaczony.
- Node wzmianki (`MentionNode`) jest zarejestrowany, ale plugin pobierajacy i
  wstawiajacy uzytkownikow nie jest aktywny.
- Maksymalna dlugosc jest opcjonalna, ale po wlaczeniu ma obecnie stala wartosc 30
  znakow, co ogranicza jej praktyczne zastosowanie w lekcjach.
- Kod zawiera ustawienie wspolpracy (`isCollab`), ale glowny edytor nie uruchamia
  dostawcy Yjs ani interfejsu obecnosci wspolautorow.

### Proponowany rozwoj

| Priorytet | Funkcja                                            | Uzasadnienie                                                                           |
| --------- | -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| P0        | Autosave ze statusem zapisu i odzyskiwaniem szkicu | Chroni dlugie lekcje przed utrata pracy i jasno pokazuje stan synchronizacji.          |
| P0        | Historia wersji zapisana na serwerze               | Obecne undo/redo dziala tylko w sesji; potrzebne sa wersje, porownanie i przywracanie. |
| P0        | Walidacja dokumentu przed zapisem                  | Powinna wykrywac niepoprawny JSON Lexical, niedokonczone wezly i brakujace zasoby.     |
| P1        | Slash menu i wyszukiwarka blokow                   | Przy duzej liczbie elementow menu `Wstaw` staje sie wolne w obsludze.                  |
| P1        | Biblioteka szablonow lekcji i blokow dydaktycznych | Pozwoli szybko budowac cele, przyklady, wskazowki, ostrzezenia i podsumowania.         |
| P1        | Komentarze, sugestie i proces akceptacji           | Umozliwi recenzje tresci przez innych nauczycieli bez zmiany opublikowanej wersji.     |
| P1        | Kontrola dostepnosci i jakosci                     | Sprawdzanie tekstu alternatywnego, hierarchii naglowkow, linkow i czytelnosci.         |
| P1        | Podglad ucznia i podglad responsywny               | Pozwoli sprawdzic interakcje oraz uklad desktop/mobile przed publikacja.               |
| P2        | Warunkowe galezie lekcji                           | Przejscie do roznych blokow na podstawie odpowiedzi lub wyniku ucznia.                 |
| P2        | Analityka blokow interaktywnych                    | Zbiorcze wyniki pytan, trudnosc, liczba prob i miejsca porzucenia lekcji.              |
| P2        | Wspolpraca w czasie rzeczywistym                   | Kursory, obecnosc i rozwiazywanie konfliktow przez istniejacy stos Yjs.                |
| P2        | Pelny import/eksport                               | JSON i Markdown wraz z kontrola zgodnosci niestandardowych wezlow.                     |

Najpierw warto zrealizowac pozycje P0, a nastepnie slash menu, szablony i podglad
ucznia. Funkcje oznaczone wyzej jako czesciowe powinny zostac albo podlaczone i
przetestowane, albo usuniete z ustawien, aby interfejs nie oferowal martwych opcji.

## License

Projekt jest objety licencja LGPL. Szczegoly: [LICENSE](./LICENSE).

## Clear purchase data

```sql
DELETE FROM public."UserCoursePurchase";

DELETE FROM public."UserCourse"
WHERE "roleId" = 0;
```
