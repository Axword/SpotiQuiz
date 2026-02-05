# SpotiQuiz - Music Guessing Game

Full-stack aplikacja do gry w zgadywanie piosenek z Spotify.

## Struktura Projektu

```
SpotiQuiz/
├── src/                      # React Frontend
│   ├── pages/
│   ├── components/
│   ├── lib/spotify.ts       # Spotify API client
│   └── store/
├── backend/                 # Python FastAPI Backend
│   ├── main.py
│   ├── requirements.txt
│   └── .env
├── package.json
└── vite.config.ts
```

## Instalacja

### Frontend (Node.js)

```bash
# Zainstaluj zależności
npm install

# Uruchom dev serwer (port 8080)
npm run dev
```

### Backend (Python 3.8+)

```bash
cd backend

# Zainstaluj Python dependencies
pip install -r requirements.txt

# Uruchom serwer (port 5000)
python main.py
```

## Konfiguracja

### Frontend (.env w projekcie)
Frontend automatycznie szuka backendu na `http://127.0.0.1:5000`

### Backend (backend/.env)
```
SPOTIFY_CLIENT_ID=7826777c157c43c080e538950ce5346e
SPOTIFY_CLIENT_SECRET=2dec6df82686465dbe34479f331c0413
```

## Jak to działa

### Bezlogowani użytkownicy (Guests)
- Mają dostęp do **4 domyślnych playlistów** z mock datą
- Mogą grać bez logowania do Spotify
- Mogą wyszukiwać playlisty (przez backend)

### Zalogowani użytkownicy (OAuth)
- Logowanie przez Spotify (Authorization Code + PKCE)
- Dostęp do **swoich playlistów**
- Dostęp do **publicznych playlistów**
- Pobieranie **rzeczywistych piosenek** z Spotify API

## Backend Endpoints

### Publiczne playlisty (bez logowania)
```
GET /api/public-playlists
GET /api/public-playlists/{playlist_id}/tracks
GET /api/search/playlists?q=query
```

## Technologia

**Frontend:**
- React + TypeScript
- Vite
- TailwindCSS
- Zustand (state management)

**Backend:**
- FastAPI (Python)
- Spotify Web API
- Client Credentials OAuth Flow

## Tryby Gry

1. **Solo** - Graj sam
2. **Host** - Stwórz pokój i zaproś przyjaciół
3. **Join** - Dołącz do pokoju przyjaciela

## Trzy Wersje Gry

- **ABCD** - Wybierz poprawną piosenkę z 4 opcji
- **Type** - Wpisz nazwę piosenki
- **List** - Wybierz z listy piosenek
