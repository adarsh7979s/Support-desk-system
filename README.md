# ⚡ DeskPulse Pro — Enterprise Support Desk System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.1-black?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-14%2F14_Passing-brightgreen?logo=vitest&logoColor=white)](https://vitest.dev/)

A modern full-stack customer support operations platform designed for managing tickets, SLA compliance, team triage, audit histories, and performance analytics.

Built to production standards as a **TypeScript Monorepo** with complete end-to-end relational data persistence, atomic database transactions, dual-boundary validation, and a dark SaaS interface.

---

## 📑 Table of Contents

- [1. System Highlights & Key Features](#1-system-highlights--key-features)
- [2. Architecture & Monorepo Structure](#2-architecture--monorepo-structure)
- [3. Technology Stack](#3-technology-stack)
- [4. Relational Data Model & ERD](#4-relational-data-model--erd)
- [5. Core Business Logic & Rules](#5-core-business-logic--rules)
- [6. Quickstart & Local Setup](#6-quickstart--local-setup)
- [7. Production & Cloud Deployment](#7-production--cloud-deployment)
- [8. REST API Reference](#8-rest-api-reference)
- [9. Automated Test Suite](#9-automated-test-suite)
- [10. Environment Variables](#10-environment-variables)

---

## 1. System Highlights & Key Features

### 🎨 Modern Dark SaaS Interface
- **Obsidian & Dark Violet Aesthetic**: High-contrast dark surfaces (`#0A0910`, `#12111D`), subtle violet/cyan atmospheric lighting, and border highlights.
- **Micro-Interactions & Glows**: Smooth hover transitions, status indicators, and backdrop blur.

### 📊 Real-Time Operations Dashboard
- **Dynamic Metric Cards**: Total volume, active queue, resolution rate, and overdue tickets calculated dynamically from database records.
- **Interactive SVG Spline Chart**: Multi-metric performance tracking with interactive metric toggles (**Volume**, **Resolved**, **SLA %**) and hover data tooltips.
- **Operational Sparklines**: Mini SVG trendlines tracking Active Queue, SLA Rate, and Avg. First Response Time.
- **Live Activity Feed**: Chronological event cards for assignments, SLA milestones, and database updates.

### 🎫 Complete Ticket Lifecycle & Queue Views
- **Dual View Modes**:
  - **Table View**: High-density data table with customer avatars, email tooltips, overdue tags, and priority badges.
  - **Kanban Board View**: 4-column visual board (**Open**, **In Progress**, **Waiting on Customer**, **Resolved**) with column counts.
- **Multi-Criteria Search & Filter**: Real-time debounce search, status pills, priority filters, assignee filters, and 4-way sorting.
- **Global Command Palette (<kbd>Ctrl+K</kbd> / <kbd>⌘K</kbd>)**: Floating modal for search and navigation across any page.

### 💬 Dual-Channel Conversation & Collaboration
- **Public Customer Replies**: Visible to the customer with agent profile avatars and relative timestamps.
- **Internal Confidential Notes**: Distinct amber-accented container with lock icon and *"Internal Note — Only visible to team"* tag.
- **Quick Macro Templates**: 1-click canned responses (*"Request diagnostic logs"*, *"Investigating with engineering"*, *"Issue verified & resolved"*).
- **Keyboard Shortcuts**: Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to submit replies or notes.

### ⏱️ Dynamic 24-Hour SLA & Audit Trails
- **Zero Stale Flags**: Overdue status is computed dynamically (`createdAt < now - 24h AND status !== 'RESOLVED'`), ensuring data integrity without background cron jobs.
- **Immutable Audit Logging**: Every ticket creation, status change, priority mutation, and reassignment is recorded in `ActivityLog` via atomic transactions with before/after diffs.

### ✍️ Guided Ticket Creation with Live Preview
- **Reactive Ticket Preview**: Renders an identical live preview card of how the ticket will look on the dashboard and queue as you type.
- **Priority Selector Cards**: Color-coded selectable intensity cards (**Low**, **Medium**, **High**, **Urgent**).
- **1-Click Test Data**: "Fill Sample Data" button to test ticket workflows.

---

## 2. Architecture & Monorepo Structure

The project is structured as a TypeScript monorepo using **npm workspaces**:

```text
support-desk-system/
├── server/                      # Node.js + Express 5 + TypeScript Backend
│   ├── prisma/
│   │   ├── schema.prisma        # Relational schema (SQLite / PostgreSQL ready)
│   │   ├── migrations/          # Version-controlled migrations
│   │   └── seed.ts              # Seed data: 8 tickets, 4 agents, comments, audit logs
│   ├── src/
│   │   ├── lib/
│   │   │   ├── db.ts            # PrismaClient singleton instance
│   │   │   └── schemas.ts       # Zod validation schemas & domain enums
│   │   ├── routes/
│   │   │   └── tickets.ts       # Express REST route handlers
│   │   ├── services/
│   │   │   └── ticket.service.ts# Atomic business logic & DB transactions
│   │   ├── __tests__/
│   │   │   └── business-rules.test.ts # 14 Vitest automated test cases
│   │   └── index.ts             # Express app, CORS, static SPA fallback
│   ├── tsconfig.json            # Server TypeScript configuration
│   └── package.json
├── client/                      # React 19 + TypeScript + Vite 6 Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts        # Typed API client with error mapping
│   │   ├── components/
│   │   │   ├── Layout.tsx       # Sidebar, mobile drawer, header, Command Palette
│   │   │   └── ui.tsx           # Status/Priority/Overdue badges, avatars, toasts
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # Metrics, SVG spline chart, activity, recent table
│   │   │   ├── TicketList.tsx   # Table view, Kanban board, search, multi-filters
│   │   │   ├── TicketDetail.tsx # Conversation thread, internal notes, live patching
│   │   │   └── CreateTicket.tsx # Form with validation & live reactive card preview
│   │   ├── types/
│   │   │   └── index.ts         # Shared domain contracts & interfaces
│   │   ├── utils/
│   │   │   └── constants.ts     # Formatters, SLA overdue engine, color tokens
│   │   ├── App.tsx              # React Router route tree
│   │   ├── main.tsx             # React 19 DOM entrypoint
│   │   └── index.css            # Tailwind directives, dark theme & glows
│   ├── tailwind.config.js       # Modern SaaS dark color palette
│   ├── vite.config.ts           # Development proxy & build settings
│   ├── vercel.json              # SPA client-side routing rewrites for Vercel
│   └── package.json
├── package.json                 # Monorepo scripts with npm workspaces
└── README.md
```

---

## 3. Technology Stack

| Layer | Technologies | Justification |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript 5.8, Vite 6, Tailwind CSS 3.4, React Router 7 | Sub-second HMR development, typed DOM, dark SaaS aesthetics, zero runtime CSS overhead. |
| **Backend** | Node.js 22, Express 5, TypeScript 5.8, TSX | Asynchronous request pipeline, clean REST architecture, parameter parsing. |
| **ORM & Database** | Prisma ORM 6, SQLite (100% PostgreSQL compatible) | Zero-setup local SQLite persistence for reviewers; one-line switch to PostgreSQL for cloud production. |
| **Icons** | Lucide React | Lightweight, scalable vector icons. |
| **Validation** | Zod | Dual-boundary schema validation on both incoming API requests and frontend forms. |
| **Testing** | Vitest 3.1 | Automated test runner verifying business logic, transactions, and edge cases. |

---

## 4. Relational Data Model & ERD

The database schema models four core entities connected via relational foreign keys with cascading deletion rules to prevent orphaned data:

```mermaid
erDiagram
    Agent ||--o{ Ticket : "assigned to"
    Ticket ||--o{ Comment : "contains (CASCADE)"
    Ticket ||--o{ ActivityLog : "logs (CASCADE)"

    Agent {
        string id PK "cuid"
        string name
        string email UK "unique"
        string role "ADMIN | AGENT"
        datetime createdAt
    }

    Ticket {
        string id PK "cuid"
        string subject
        string customerName
        string customerEmail
        string description
        string status "OPEN | IN_PROGRESS | WAITING_ON_CUSTOMER | RESOLVED"
        string priority "LOW | MEDIUM | HIGH | URGENT"
        string assigneeId FK "nullable"
        datetime createdAt
        datetime updatedAt
    }

    Comment {
        string id PK "cuid"
        string ticketId FK "CASCADE"
        string content
        string type "REPLY | NOTE"
        string authorName
        datetime createdAt
    }

    ActivityLog {
        string id PK "cuid"
        string ticketId FK "CASCADE"
        string action "CREATED | STATUS_CHANGED | PRIORITY_CHANGED | ASSIGNED | COMMENT_ADDED"
        string field "nullable"
        string oldValue "nullable"
        string newValue "nullable"
        string performedBy
        datetime createdAt
    }
```

---

## 5. Core Business Logic & Rules

### A. Dynamic 24-Hour Overdue Rule
```text
Overdue = (status !== "RESOLVED") AND (createdAt < (now - 24 hours))
```
- **Design Decision**: Overdue status is **never** stored as a static boolean flag in the database to avoid stale data.
- It is evaluated on-the-fly both via SQL query filters in backend aggregate metrics and via client helper utilities (`isOverdue()`).
- The moment a ticket is transitioned to `RESOLVED`, it immediately clears overdue status across all queues and dashboard counts.

### B. Atomic Transactional Audit Trails
All ticket mutations are executed inside `prisma.$transaction()`:
- When a ticket is created: logs `CREATED`.
- When status changes (e.g., `OPEN` → `IN_PROGRESS`): logs `STATUS_CHANGED` with `oldValue` and `newValue`.
- When priority changes (e.g., `MEDIUM` → `URGENT`): logs `PRIORITY_CHANGED`.
- When an assignee is assigned or changed: logs `ASSIGNED` with previous and new agent names.
- When comments are added: logs `COMMENT_ADDED` (for public replies) or `NOTE_ADDED` (for internal notes).

---

## 6. Quickstart & Local Setup

### Prerequisites
- **Node.js** >= 18.x (Tested on Node.js v22 & v24)
- **npm** >= 9.x

### 1. Clone & Install Dependencies
Open your terminal in the project directory:
```bash
npm install
```

### 2. Database Migration & Seed
Run migrations and seed the database with initial agents, tickets, and conversation histories:
```bash
npm run db:setup
```
*(Runs `prisma migrate deploy` and populates 8 realistic support tickets, 4 staff agents, replies, and notes).*

### 3. Run Development Servers
Start both the backend API server and frontend client simultaneously:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173) *(or [http://localhost:5175](http://localhost:5175))*
- **Backend API**: [http://localhost:3001](http://localhost:3001)

### Running Individual Services (Optional)
- Backend only: `npm run dev:server` (Port `3001`)
- Frontend only: `npm run dev:client` (Port `5173`)

---

## 7. Production & Cloud Deployment

### Option A: Render.com (Recommended — 100% Free All-in-One)
The Express backend is configured to serve the React frontend build (`client/dist`) directly from the same port.

1. Push your repository to **GitHub**.
2. Go to **[Render.com](https://render.com)** → **New +** → **Web Service**.
3. Connect your repository and configure:
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install --include=dev && npm run build && npm run db:setup
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Environment Variables**:
     - `NODE_ENV` = `production`
     - `DATABASE_URL` = `file:./dev.db`
4. Click **Deploy**. Render will deploy the app with free SSL on `https://<your-app>.onrender.com`.

---

### Option B: Split Hosting (Vercel Frontend + Render Backend)

#### **1. Deploy Backend to Render**
- Root directory: `server`
- Build: `npm install --include=dev && npm run build && npm run db:setup`
- Start: `npm start`
- Note your API URL (e.g., `https://deskpulse-api.onrender.com`).

#### **2. Deploy Frontend to Vercel**
- Go to **[Vercel.com](https://vercel.com)** → **Import Repository**.
- **Root Directory**: Select `client`.
- **Framework Preset**: `Vite`.
- **Environment Variables**:
  - `VITE_API_URL` = `https://deskpulse-api.onrender.com`
- Click **Deploy**. Vercel will deploy your frontend with SPA routing backed by `client/vercel.json`.

---

### Option C: Local Production Build
To test the production build on your local machine or internal network:
```bash
# 1. Compile backend and build frontend bundles
npm run build

# 2. Start the unified production server
npm start
```
Access at **`http://localhost:3001`**.

---

### 🗄️ PostgreSQL Setup (Optional Cloud Database)
To switch from SQLite to PostgreSQL (e.g., [Supabase](https://supabase.com) or [Neon](https://neon.tech)):
1. In `server/prisma/schema.prisma`, update line 6:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `server/.env` (or cloud env variables):
   ```env
   DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
   ```
3. Run `npm run db:setup` to deploy tables to PostgreSQL.

---

## 8. REST API Reference

All API routes are served under `/api` and return standardized JSON.

### Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck and server timestamp |
| `GET` | `/api/dashboard` | Dashboard metrics: total, open, in-progress, resolved, urgent, overdue |
| `GET` | `/api/agents` | List all support agents |
| `GET` | `/api/tickets` | Query tickets with search, status, priority, assignee, sort, pagination |
| `POST` | `/api/tickets` | Create a new ticket (validates subject, customer, email, priority) |
| `GET` | `/api/tickets/:id` | Fetch ticket detail with comments and full activity audit log |
| `PATCH` | `/api/tickets/:id` | Update status, priority, assignee, or subject with atomic audit logging |
| `POST` | `/api/tickets/:id/comments` | Add a public reply (`REPLY`) or confidential internal note (`NOTE`) |

### Example: Query Tickets with Filters
```http
GET /api/tickets?status=OPEN&priority=HIGH&sortBy=updatedAt&sortOrder=desc&page=1&limit=10 HTTP/1.1
```

### Example: Create Ticket Payload
```json
POST /api/tickets
Content-Type: application/json

{
  "subject": "Cannot connect to payment gateway",
  "customerName": "Alice Johnson",
  "customerEmail": "alice@example.com",
  "description": "Payment requests are timing out with 504 error.",
  "priority": "HIGH",
  "assigneeId": "clxxx..."
}
```

---

## 9. Automated Test Suite

The test suite covers core business rules, relational constraints, and database transactions using **Vitest**:

```bash
npm run test
```

### Test Coverage Summary:

```text
✓ src/__tests__/business-rules.test.ts (14 tests)
  ✓ Priority sorting (URGENT > HIGH > MEDIUM > LOW)
  ✓ Status filtering and invalid status handling
  ✓ 24-hour overdue calculation rule
  ✓ Resolved tickets excluded from overdue metrics
  ✓ Email validation rejects malformed customer emails
  ✓ Cascade deletion removes associated comments and activity logs
  ✓ SetNull constraint preserves tickets when an agent is deleted
  ✓ Public reply adds comment and updates ticket updatedAt
  ✓ Internal note creates confidential note without changing status
  ✓ Activity log records before/after values on status mutation
  ✓ Activity log records agent name changes on reassignment
  ✓ Ticket creation defaults status to OPEN
  ✓ Search query matches across subject, name, and email
  ✓ Pagination limits and page boundary calculations

Test Files  1 passed (1)
     Tests  14 passed (14)
  Duration  855ms
```

---

## 10. Environment Variables

Default environment variables are preconfigured:

### Backend (`server/.env`)
```env
PORT=3001
DATABASE_URL="file:./dev.db"
CLIENT_URL="http://localhost:5173"
```

### Frontend (`client/.env`)
```env
# Optional: Only needed when frontend and backend are hosted on different domains
VITE_API_URL=""
```

---

## 📄 License

This project was built for the **Technical Practical Assessment Task**. Distributed under the MIT License.
