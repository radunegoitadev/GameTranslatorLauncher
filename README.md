## 🎮 Game Translator Launcher

Un ecosistem complet de aplicații pentru generarea, distribuția și instalarea automatizată a traducerilor de jocuri. Proiectul este compus dintr-o aplicație desktop hibridă orientată către utilizatorul final și un pipeline separat pentru traducerea automată a fișierelor de joc folosind Inteligența Artificială.

### ✅ Funcționalități Principale

* **Instalare Automată:** Descarcă, dezarhivează și aplică automat fișierele de localizare în directorul corect al jocului, în funcție de executabilul acestuia.

* **Arhitectură Hibridă cu Sidecar C#:** Utilizează Tauri pentru un frontend extrem de rapid (React/TS) și un backend local robust scris în ASP.NET Core (executabil standalone) care rulează un server HTTP intern.

* **Sistem Nativ de Auto-Update:** Integrat direct în Tauri, sistemul verifică, descarcă și instalează automat noile versiuni ale aplicației, folosind semnături criptografice pentru securitate maximă.

* **AI Translation Pipeline (Proiect Conex):** Include scripturi de automatizare integrate cu **Gemini API** capabile să parseze și să traducă dinamic fișiere specifice jocurilor (`.txt`, `.xml`), adaptându-se la structura diferitelor motoare grafice (Game Engines).

### 🧩 Tehnologii Utilizate

#### Frontend (User Interface)

* **Tauri:** Framework-ul de bază pentru aplicația desktop.

* **React & TypeScript:** Pentru construirea unei interfețe modulare, reactive și type-safe.

* **Vite:** Pentru un build process extrem de rapid.

#### Backend (Local Sidecar)

* **C# & ASP.NET Core Web API:** Gestionează logica grea: scanarea sistemului de fișiere, manipularea arhivelor, validarea directoarelor de instalare și parsarea fișierelor de configurare.

* **Comunicare Asincronă:** Frontend-ul interoghează backend-ul via HTTP (`localhost:5000`), incluzând mecanisme de *retry logic* pentru sincronizarea perfectă a proceselor la pornirea aplicației.

### 🚀 Instalare și Rulare Locală (Developers ONLY)

#### Pre-rechizite

* [Node.js](https://nodejs.org/) (versiunea 16+)

* [Rust](https://www.rust-lang.org/tools/install)

* [.NET SDK](https://dotnet.microsoft.com/download) (pentru sidecar-ul C#)

### Pași pentru dezvoltare

1. **Clonează repository-ul:**

   ```
   git clone https://github.com/username/GameTranslatorLauncher.git
   cd GameTranslatorLauncher

   ```

2. **Instalează dependențele pentru interfață:**

   ```
   npm install

   ```

3. **Pornirea aplicației în mod dezvoltare:**
   Asigură-te că portul `5000` este liber pentru executabilul C#. Rularea comenzii de mai jos va inițializa atât interfața React, cât și procesele Tauri.

   ```
   npx tauri dev
    
   ```

### 🏗️ Arhitectura Sistemului

La pornirea aplicației, Tauri lansează executabilul C# în fundal. Frontend-ul React implementează o logică de așteptare, interogând portul `5000` până când ASP.NET Core raportează că este gata să primească cereri. Odată conexiunea stabilită, interfața preia lista de jocuri suportate din configurația inclusă in sidecar, iar logica de instalare și manipulare a fișierelor este delegată în totalitate către backend-ul C#.