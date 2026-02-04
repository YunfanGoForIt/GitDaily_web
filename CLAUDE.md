# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitDaily is a Git-inspired project management and life tracking web application. It visualizes projects and life events as a timeline graph where:
- **Main Timeline** = Main branch (like git's main/master)
- **Branches** = Parallel projects or life tracks that fork from main or other branches
- **Tasks/Commits** = Nodes on branches representing completed or planned work
- **Merge commits** = When branches are merged back into parent branches

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server on port 3000
npm run build        # Production build
npm run preview      # Preview production build
npm run server       # Start API server (port 3001)
npm run db:migrate   # Database migration/management
./start.sh           # Start both API and frontend servers
```

**Environment Setup:**
- Create `.env.local` and set `GEMINI_API_KEY` for AI features
- Set `VITE_API_URL` to override API endpoint (defaults to `/api` for proxy)

## Architecture

### Technology Stack
- **Frontend:** React 19.2.4 with TypeScript 5.8.2
- **Build Tool:** Vite 6.2.0
- **Styling:** Tailwind CSS (loaded via CDN in index.html)
- **Icons:** Lucide React 0.563.0
- **Database:** SQLite with better-sqlite3
- **Backend:** Express.js REST API
- **Path Alias:** `@/` maps to project root
- **Mobile:** Capacitor 8 (Android & iOS)

### ESM-Only Configuration

This project uses ES Modules exclusively (`"type": "module"` in package.json). All imports must use `.js` extensions for local files, even when importing TypeScript files. The `tsx` loader handles TypeScript execution at runtime.

### Application Structure

```
GitDaily/
├── src/
│   ├── api.ts              # API Service layer (frontend data access)
│   ├── server.ts           # Express API server
│   ├── db/
│   │   ├── schema.ts       # SQLite schema definition
│   │   ├── database.ts     # DatabaseManager with migration engine
│   │   ├── repository.ts   # Data access layer (DAL)
│   │   └── cli.ts          # Database CLI tool
│   ├── utils/
│   │   └── device.ts       # Device detection (desktop/mobile/native)
│   ├── App.tsx             # Main app with state management
│   └── ...
├── pages/                  # Page components
├── components/             # Reusable components
├── data/                   # SQLite database (gitignore'd)
├── android/                # Capacitor Android project
├── ios/                    # Capacitor iOS project
├── docs/
│   └── DATABASE.md         # Database documentation
├── build-android.sh        # Android build script
├── build-ios.sh            # iOS build script
├── capacitor.config.ts     # Capacitor configuration
└── start.sh                # Startup script
```

### Data Flow

```
Browser (React) <--> Vite Proxy (/api) <--> Express API (localhost:3001) <--> SQLite
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/status | Database status |
| GET | /api/branches | List all branches |
| POST | /api/branches | Create branch |
| PUT | /api/branches/:id | Update branch |
| DELETE | /api/branches/:id | Delete branch |
| GET | /api/tasks | List all tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/user/profile | Get user profile |
| PUT | /api/user/profile | Update user profile |
| GET | /api/settings | Get device-specific settings |
| PUT | /api/settings | Update device settings |
| POST | /api/admin/backup | Create database backup |
| POST | /api/admin/upgrade | Execute migrations |

### State Management

All shared state lives in `App.tsx` and flows downward via props:
- Data is fetched from API on mount via `useEffect`
- All CRUD operations call API service layer
- Optimistic UI updates for better UX
- Loading and error states handled

### Device-Specific Settings

Settings are stored per device type (`desktop` | `mobile`):
- **Detection:** `src/utils/device.ts` uses Capacitor API + screen width
- **Storage:** `device_settings` table with separate defaults
  - Desktop: branchSpacing=1.0, heatmapCellSize=18
  - Mobile: branchSpacing=0.8, heatmapCellSize=16
- **Auto-save:** Changes saved to DB immediately via API
- **Native Apps:** Capacitor apps detected as `mobile` type

### Data Model

**TaskStatus:** `'PLANNED'` (grey) | `'COMPLETED'` (colored)

**Branch:**
- `id`, `name`, `description`, `color`
- `parentId` - null means main timeline
- `status` - `'active' | 'merged' | 'archived'`
- `startDate`, `targetDate`, `restoredDate`

**Task:**
- `id`, `branchId`, `title`, `description`, `date`
- `status: TaskStatus`
- `isMergeCommit` - special marker for merge nodes
- `commitMessage` - reflection when completing

### Database Features

- **Single file:** `data/gitdaily.db` (easy to backup/move)
- **Auto backup:** Created before each migration
- **Version tracking:** `schema_version` table
- **Migrations:** Versioned, with rollback support
- **WAL mode:** Better concurrent performance

### Branch Operations

- **Archive:** Sets status to `'archived'`, removes from active graph view
- **Delete:** Removes branch and reassigns children; deletes all branch tasks
- **Restore:** Sets status back to `'active'`, adds "Project Restarted" task
- **Merge:** Creates merge commit on parent with message, sets branch to `'merged'`

### Graph Visualization

SVG-based hierarchical layout in `GraphRenderer`:
- Branches positioned vertically by depth from main
- Time flows horizontally
- Nodes positioned by date within each branch
- Supports multiple time granularities

### Mobile Build (Capacitor)

```bash
# Build Android APK
./build-android.sh

# Build iOS (macOS only)
./build-ios.sh
```

**Prerequisites:**
- Android: Android Studio, SDK 34
- iOS: Xcode 15+, macOS

**Capacitor Config:** `capacitor.config.ts`
- `appId: 'com.gitdaily.app'`
- Auto-detected as `mobile` device type
- Uses same API endpoints as web

### Configuration Files

- **vite.config.ts** - Vite config with React plugin, proxy, path alias, port 3000
- **tsconfig.json** - TypeScript target ES2022, jsx react-jsx, paths `@/*` → `./*`
- **index.html** - ESM imports via import maps (esm.sh CDN), Tailwind via CDN
- **capacitor.config.ts** - Capacitor mobile app configuration
- **docs/DATABASE.md** - Complete database documentation

### Import Map (index.html)

Dependencies are loaded via esm.sh CDN using import maps (no node_modules bundling required for deps):

```html
"imports": {
  "react": "https://esm.sh/react@19.2.4",
  "react-dom/client": "https://esm.sh/react-dom@19.2.4/client",
  "lucide-react": "https://esm.sh/lucide-react@0.563.0?external=react"
}
```

Only server-side packages (better-sqlite3, express, cors) and dev tools are in package.json.
