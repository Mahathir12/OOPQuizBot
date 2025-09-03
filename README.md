# OOPQuizBot

A C++ (Drogon) + vanilla JS web app to practice OOP and C++ concepts with
- **Notebook**
- **Ask AI** (LM Studio / OpenAI compatible local server)
- **Quiz** (questions per chapter)
- **Leaderboard**
- **Announcements** and **Login**
- Light/Dark theme and the requested UI feel (animated golden underline, three-dot menu).

## Build (Windows/Linux)
```bash
# Install Drogon (recommended via vcpkg)
# Windows PowerShell (developer prompt):
git clone https://github.com/microsoft/vcpkg
.\vcpkg\bootstrap-vcpkg.bat
.\vcpkg\vcpkg install drogon

# Linux/macOS:
git clone https://github.com/microsoft/vcpkg
./vcpkg/bootstrap-vcpkg.sh
./vcpkg/vcpkg install drogon
```

Then:
```bash
mkdir build && cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=../vcpkg/scripts/buildsystems/vcpkg.cmake
cmake --build . -j
./oop_quiz_bot
```

The app serves the **public/** front-end on `http://localhost:8080/`

## LM Studio (Ask-AI)
Install LM Studio and run a model in server mode (OpenAI compatible).
Default base URL used by the backend: `http://127.0.0.1:1234/v1`.

Try:
```bash
curl -X POST http://127.0.0.1:1234/v1/chat/completions -H "Content-Type: application/json" ^
  -d "{ \"model\":\"lmstudio-community/llama-3.1-8b-instruct\", \"messages\":[{\"role\":\"user\", \"content\":\"What is a virtual function in C++?\"}] }"
```

## Data
- `data/users.json` contains a **demo user** and the leaderboard.
- `data/quizzes/chapter*.json` hold questions. Chapters 1–14 are provided with a minimal seed so the
  app runs; extend them by adding questions of the same schema.

## Front-End
Open `public/index.html` after running the server. 
The **three-dot menu** includes **Account Settings** and **Leaderboard**.

## Notes Export
`/api/notes/export?user=<username>` bundles all notes for a user into `data/<username>_notes_export.txt`.

## License
For personal/academic use.

---

## Fixes applied (2025‑09‑03)
- **Header three‑dot menu click**: Made `#moreBtn` reliably clickable by anchoring the pseudo‑element hit‑area (`#moreBtn { position: relative }`) and minor JS tweaks.
- **Login button**: Added a small guard so tapping the Login pill always navigates to `login.html`.
- **Static assets on localhost**: `src/main.cpp` now resolves an **absolute** `document_root`, so images/CSS/JS load regardless of your working directory (e.g., running from `build/`).

## Deploy

### Option A — GitHub Pages (static front‑end only)
1. Push the repo to GitHub (branch `main`).
2. GitHub Action **Deploy to GitHub Pages (public/)** will publish everything under `OOPQuizBot/public`.
3. In the repo’s **Settings → Pages**, set **Source: GitHub Actions**.
4. Your site will be available at `https://<user>.github.io/<repo>/`.

> If you want to serve from a sub‑path, all links in the app are **relative** (`login.html`, `assets/...`), so no changes are required.

### Option B — Render (Static Site)
- Click **New → Static Site**, connect this repo.
- Set:
  - **Root Directory**: `OOPQuizBot/public`
  - **Build Command**: *(empty)*
  - **Publish Directory**: `.`
- (Optional) `render.yaml` has headers to cache `/assets/*`.

### Option C — Run the C++ server
```bash
cmake -S OOPQuizBot -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
./build/oop_quiz_bot   # (Windows: .\build\Release\oop_quiz_bot.exe)
```
The server binds to `0.0.0.0:8080` (or the port in `config/config.json`), and serves `/public` correctly even when run from `build/`.

### Using LM Studio for Ask‑AI (optional)
Start LM Studio’s **local server** (e.g., `http://127.0.0.1:1234/v1`) with an instruct model. Then replace the stub in `public/ask-ai.html` with a `fetch` call to the OpenAI‑compatible endpoint:

```html
<script>
async function callLMStudio(prompt){
  const res = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      model: 'lmstudio-community/llama-3.1-8b-instruct',
      messages: [{role:'user', content: prompt}],
      temperature: 0.2
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '(no output)';
}
document.getElementById('askBtn').addEventListener('click', async ()=>{
  const q = document.getElementById('aiQ').value.trim();
  document.getElementById('aiA').textContent = q ? 'Thinking…' : 'Please type something';
  if (!q) return;
  document.getElementById('aiA').textContent = await callLMStudio(q);
});
</script>
```

