# Ecurs LMS — Model biznesowy i strategia rozwoju

> Dokument roboczy. Rewidować co kwartał na bazie realnych metryk (MRR, GMV, churn, activation rate), nie z góry ustalonych założeń.

## 1. Business Model Canvas

| Blok | Opis |
|---|---|
| **Value Proposition** | Stwórz i sprzedaj kurs w 15 minut dzięki AI — bez montowania 5 osobnych narzędzi (edytor treści, generator AI, lektor TTS, płatności, certyfikaty). |
| **Customer Segments** | ICP #1 (faza 1): niezależny nauczyciel/trener/korepetytor w PL. ICP #2 (faza 2): mała szkoła językowa/zawodowa (2–10 nauczycieli). ICP #3 (faza 3): firma szkoleniowa / dział L&D (enterprise). |
| **Channels** | Publiczny katalog kursów (`app/browse`), SEO/content marketing, grupy branżowe (nauczyciele, korepetytorzy, trenerzy), program poleceń, Meta/TikTok Ads, partnerstwa z izbami/stowarzyszeniami. |
| **Customer Relationships** | Self-service + community na start (bez human sales). Sales-led motion dopiero dla Enterprise. |
| **Revenue Streams** | Subskrypcja platformowa (Starter/Pro/Business/Enterprise) + take-rate od GMV (malejący wraz z planem) + dopłaty do kredytów AI (usage-based). |
| **Key Resources** | Edytor Lexical (kolaboracyjny), integracje AI (OpenAI) i TTS (ElevenLabs), Stripe Connect, custom i18n (PL/EN), Prisma/PostgreSQL. |
| **Key Activities** | Rozwój AI-wizardu do tworzenia kursów, utrzymanie infrastruktury, marketing treści, obsługa community. |
| **Key Partners** | OpenAI, ElevenLabs (koszty zmienne), Stripe (płatności/Connect), Azure Blob (storage), Redis (cache). |
| **Cost Structure** | Infrastruktura (hosting, DB, Redis, Azure Blob) + koszty API AI/TTS (zmienne, skalują się z użyciem) + ewentualny support 1-osobowy na start. |

## 2. Segmentacja klientów

| Segment | Potrzeba | Powiązanie w kodzie |
|---|---|---|
| Niezależny nauczyciel/twórca (individual) | Szybkie tworzenie kursu, prosty onboarding, sprzedaż | `School.schoolType="individual"` (auto-tworzona szkoła) |
| Mała szkoła (business, 2–10 nauczycieli) | Zarządzanie zespołem, wspólna marka, podział przychodów | `SchoolTeacher`, `TeacherJoinRequest` |
| Firma szkoleniowa / L&D (enterprise) | Ścieżki rozwoju, certyfikaty, raportowanie postępu zespołu | `EducationalPath`, `analytics`, `notifications` |
| Platforma/marketplace (Ecurs) | Prowizja od transakcji między szkołami a kursantami | Stripe Connect (per szkoła) |

## 3. Nisza i wybór klina (wedge)

Rekomendacja: **nie atakować wszystkich segmentów naraz**. Skupić się najpierw na ICP #1 i ICP #2 (mikro-szkoły i niezależni trenerzy w PL/CEE):

- Najkrótszy cykl sprzedaży (self-service, brak działu zakupów).
- Najmniejszy próg wejścia — darmowy plan wystarcza jako "próbka".
- Przewaga AI + TTS + i18n PL najbardziej rozwiązuje ich problem (brak czasu/budżetu na produkcję treści).
- Najszybciej generuje GMV, czyli podstawę pod take-rate.

Enterprise/B2B zostawić na później — wymaga SSO, SLA, długiego sales cycle. Wrócić do tego segmentu po osiągnięciu >200 płacących szkół i zebraniu referencji.

## 4. Model przychodów (revenue streams)

### A. Subskrypcja platformowa

| Plan | Cena (orientacyjnie) | Zakres |
|---|---|---|
| Starter | 0 zł (freemium) | 1 kurs, limit generacji AI/mies., znak wodny "Powered by Ecurs" |
| Pro (individual) | ~99–149 zł/mies. | Bez limitu kursów, więcej kredytów AI, TTS, brak znaku wodnego |
| Business (szkoła) | ~299–499 zł/mies. + per-seat | Multi-teacher, ścieżki edukacyjne, analytics, biała etykieta |
| Enterprise | wycena indywidualna | SSO, dedykowany onboarding, SLA, własna domena |

### B. Take-rate od sprzedaży (Stripe Connect)

Prowizja malejąca wraz z planem — motywuje do upgrade'u:

- Starter: 15%
- Pro: 8%
- Business: 5%

### C. Zużycie AI jako licznik (usage-based add-on)

- Pula kredytów w planie (np. Pro = 500 000 tokenów/mies. + 60 min TTS).
- Dopłaty "AI credits top-up" ponad limit — wysoka marża ponad koszt API (cel: min. 3–5x koszt).

### D. Marketplace / katalog publiczny

- Publiczny katalog (`app/browse`) generuje organiczny ruch między szkołami (efekt sieciowy).
- W przyszłości: płatny placement/promowanie kursów w katalogu.

## 5. Kanały sprzedaży i marketingu

**Organiczne / tanie:**
- SEO + blog (np. „jak stworzyć kurs online”, „platforma LMS dla szkoły językowej”).
- Landing page per segment (`/dla-nauczycieli`, `/dla-szkol-jezykowych`, `/dla-firm-szkoleniowych`).
- Grupy branżowe (FB/LinkedIn): nauczyciele języków, korepetytorzy, trenerzy, HR/L&D.
- Program poleceń z prowizją (rozszerzenie `PromoCode` o kody referencyjne).

**Płatne:**
- Meta/TikTok Ads — demo „1 prompt → gotowy moduł kursu z lektorem AI”.
- Google Ads (search, wysoka intencja): „platforma do sprzedaży kursów online”, „system LMS dla szkoły”.

**Partnerstwa:**
- Izby rzemieślnicze, stowarzyszenia branżowe, akademie coachingu — sprzedaż licencji Business hurtowo.
- Influencerzy edukacyjni — barter (darmowy plan Business) + prowizja za zapisy.

## 6. Fazowanie rozwoju produktu

**Faza 0 (0–3 mies.) — ostrość jednego wedge'a**
- Dopracować wizard „temat → AI generuje moduły → treść → TTS” do <15 min na gotowy kurs (materiał demo do reklamy).
- Uprościć onboarding indywidualnego nauczyciela (<5 kroków, bez karty kredytowej).
- Spiąć `platform-subscription` + Stripe Connect w jeden spójny checkout.

**Faza 1 (3–9 mies.) — wzrost w wybranym segmencie**
- Program poleceń z prowizją.
- Case studies od pierwszych 10–20 płacących szkół.
- Dashboard analityki ukończeń/wyników jako argument dla segmentu Business.

**Faza 2 (9–18 mies.) — ekspansja pozioma**
- White-label + SSO dla enterprise (dopiero po sygnale popytu).
- Marketplace/katalog jako osobny strumień przychodu (placement fees).
- Ekspansja geograficzna (inne języki CEE — i18n już to wspiera).

**Zasada odcięcia:** jeśli po Fazie 0 activation rate jest niski, nie przechodzić do Fazy 1 — najpierw naprawić produkt/onboarding, nie zwiększać budżetu marketingowego.

## 7. Metryki-bramki (decyzyjne)

| Metryka | Definicja | Próg alarmowy |
|---|---|---|
| Activation rate | % zarejestrowanych, którzy publikują pierwszy kurs w 7 dni | < 20% → problem w produkcie/onboardingu |
| GMV per aktywna szkoła/mies. | Wolumen sprzedaży kursów, z którego pobierana jest prowizja | Niskie GMV → brakuje wsparcia sprzedażowego dla klientów (szablony, marketing edukacyjny) |
| CAC payback period | Liczba miesięcy do odzyskania kosztu pozyskania klienta z MRR + take-rate | > 12 mies. → przesunąć budżet z Ads na kanały organiczne/referral |

## 8. Ryzyka rynkowe

- Silna konkurencja globalna (Kajabi, Teachable, Thinkific, LearnWorlds) z ugruntowaną marką i integracjami.
- Presja cenowa ze strony dużych platform (Coursera, Udemy) na twórców indywidualnych.
- Rosnące koszty API AI (OpenAI, ElevenLabs) wymagające pilnowania marży na planach i kredytach.
