# Ecurs LMS

Ecurs to full-stackowa platforma edukacyjna (LMS) zbudowana w Next.js 15.
Pozwala tworzyc i sprzedawac kursy online, prowadzic szkoly (multi-tenant),
zarzadzac uczniami i materialami, korzystac z AI (OpenAI/ElevenLabs) oraz obslugiwac platnosci Stripe.

## Co to za aplikacja

- Panel nauczyciela: tworzenie kursow, lekcji, materialow i promocji.
- Panel ucznia: zakup, dostep i postep nauki.
- Marketplace kursow i sciezek edukacyjnych.
- Uwierzytelnianie i konta przez Clerk.
- Powiadomienia e-mail i zadania cykliczne (cron).

## Stack technologiczny

- Next.js 15 (App Router)
- React 18 + Tailwind CSS
- PostgreSQL + Prisma
- Clerk (auth)
- Stripe (platnosci i webhooki)
- OpenAI + ElevenLabs

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

## License

Projekt jest objety licencja LGPL. Szczegoly: [LICENSE](./LICENSE).

## Clear purchase data

```sql
DELETE FROM public."UserCoursePurchase";

DELETE FROM public."UserCourse"
WHERE "roleId" = 0;
```

