FOODQR – CHESTIONAR

Fișiere:
- index.html: pagina chestionarului
- style.css: aspect desktop + mobil
- app.js: autentificare anonimă și salvarea răspunsurilor
- firebase-config.js: configurația proiectului chest-3cad1
- firestore.rules: reguli Firestore

CONFIGURARE FIREBASE:
1. Firebase Console → Authentication → Sign-in method.
2. Activează Anonymous (Autentificare anonimă).
3. Firestore Database → Rules.
4. Înlocuiește regulile cu cele din firestore.rules și apasă Publish.
5. În GitHub, încarcă toate cele 5 fișiere în același folder.
6. Activează GitHub Pages dacă nu este deja activ.

IMPORTANT DESPRE PIN ȘI STATISTICI:
PIN-ul 7002 este folosit doar pentru a deschide interfața de administrator în această versiune demonstrativă. Un PIN pus în JavaScript-ul public poate fi descoperit. De aceea regulile Firestore blochează citirea răspunsurilor din browser. Pentru statistici reale protejate, trebuie adăugat un backend (de exemplu Cloudflare Worker) care verifică PIN-ul pe server și citește datele din Firebase în siguranță. Nu publica reguli care permit tuturor să citească răspunsurile.

NOTĂ:
Configurația Firebase inclusă este cea transmisă în conversație pentru proiectul chest-3cad1. Dacă ai schimbat cheia API, actualizează firebase-config.js.
