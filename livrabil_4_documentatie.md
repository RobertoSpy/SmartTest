# Documentație Livrabil 4 - Proiect SmartTest

Acest document conține istoricul interacțiunilor cu asistentul AI, observații privind experiența de dezvoltare (atât pozitive cât și negative) și sugestii de îmbunătățire.

## 1. Arhiva Log-uri interacțiuni agent AI

Mai jos sunt prezentate schimburile de mesaje care au ghidat dezvoltarea aplicației:

### I. Consultare Inițială și Arhitectură
**USER**: Bună! Aș vrea să dezvolt o aplicație web pentru testarea algoritmilor de Inteligență Artificială (Căutare, Nash, MinMax, CSP). Cum aș putea să rezolv această aplicație și ce limbaje de programare ar fi benefice?
**AI**: Salut! Pentru acest tip de proiect, recomand o arhitectură modernă "Full-Stack":
*   **Backend**: Python cu FastAPI. Este ideal pentru AI datorită bibliotecilor matematice și vitezei de execuție a API-ului.
*   **Frontend**: React cu TypeScript. Oferă o interfață dinamică și siguranță în manipularea datelor prin tipizarea statică.
*   **Baza de date**: SQLite/SQLModel pentru stocarea istoricului întrebărilor.

### II. Nash Equilibrium - Tranziția la Nivele de Dificultate
**USER**: Modifică-mi la Nash pur să nu mai fie cu probabilități, ci cu nivele de dificultate (Easy, Medium, Hard). Să nu fie limitat la matrice pătratice.
**AI**: Sigur! Voi actualiza generatorul pentru a suporta:
*   **Easy**: Matrice mici (ex: 2x3), cu Nash garantat.
*   **Medium**: Matrice medii (ex: 3x4), cu Nash garantat.
*   **Hard**: Matrice mari (ex: 4x5), unde existența echilibrului este aleatorie.
Voi implementa aceste modificări în `generator_nash.py` și `api.ts`.

### III. Algoritmul MinMax și Alpha-Beta Pruning
**USER**: La MinMax, avem nevoie de Alpha-Beta Pruning. Vreau să văd exact unde se taie nodurile în explicație.
**AI**: Am creat `AlphaBetaSolver`. Acesta urmărește valorile alpha și beta și generează un log textual: "Pruning at MIN node X: score <= alpha". Astfel, studentul poate verifica procesul pas cu pas.

### IV. Strategii de Căutare (Search) și Evaluare
**USER**: Cum verificăm dacă studentul a scris corect strategia de căutare? Unii nu folosesc diacritice în română.
**AI**: Am implementat un evaluator robust care normalizează input-ul (elimină diacriticele și transformă în minuscule). Scorul este împărțit între strategia identificată și euristică, oferind feedback imediat și punctaj parțial.

### V. Persistența datelor în CSP
**USER**: Datele CSP se pierd la refresh. Vreau să le salvăm în istoric să le pot revedea.
**AI**: Am adăugat logica de salvare în `csp.py`. Acum fiecare rezolvare este stocată ca o "întrebare" în DB. În frontend, folosim datele din istoric pentru a pre-popula graful de variabile și constrângeri.

### VI. Organizare Vizuală și Frontend (UI/UX)
**USER**: În ce format ar fi fain să fie rearanjate lucrurile pe pagină pentru un aspect premium?
**AI**: Recomand un layout de tip "Dashboard" cu elemente Glassmorphism:
*   Fundaluri semi-transparente cu blur.
*   Coloane paralele pentru input și rezultate.
*   Efecte de tip Neon pe butoanele principale pentru un aspect modern, tech-oriented.

## 2. Observații privind experiența avută

Utilizarea asistentului AI a fost un proces mixt, având atât puncte forte cât și momente care au necesitat intervenție manuală critică:

*   **Viteză vs. Acuratețe**: AI-ul a implementat rapid algoritmii de bază, dar a făcut greșeli frecvente de denumire (inconsistențe între cheile API-ului, de exemplu `matrix` vs `payoff_matrix`), ceea ce a dus la erori de afișare care au trebuit corectate manual.
*   **Regresii Funcționale**: Uneori, în încercarea de a adăuga o funcționalitate nouă (cum a fost la Nash), asistentul a oferit implementări care stricau logica existentă (ex: ștergerea accidentală a parametrilor unor funcții), necesitând reveniri repetate la versiuni anterioare.
*   **Necesitatea Supravegherii**: Experiența a demonstrat că agentul AI nu poate fi lăsat să lucreze complet autonom; este nevoie de un programator care să valideze fiecare pas pentru a evita propagarea bug-urilor în arhitectura proiectului.

## 3. Sugestii privind îmbunătățiri posibile

*   **Vizualizări Animate**: Implementarea unor animații care să arate "vizitarea" nodurilor în timp real pentru Search și MinMax.
*   **Analiză Comparativă**: Un modul care să compare eficiența a doi algoritmi de căutare diferiți pe aceeași problemă.
*   **Export Rapoarte**: Generarea automată a unui PDF cu progresul studentului și soluțiile corecte pentru fiecare tip de problemă.
