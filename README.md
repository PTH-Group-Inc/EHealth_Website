<div align="center">

# 🏥 EHealth — Digital Healthcare Management System

**A comprehensive, multi-role healthcare platform built with modern web technologies.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

[Features](#-key-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Architecture](#-architecture) · [Contributing](#-contributing)

</div>

---

## 📋 Overview

**EHealth** is a full-featured digital healthcare management system designed to streamline hospital operations — from patient reception and doctor consultations to pharmacy dispensing and administrative oversight.

The platform supports **4 distinct user roles**, each with a tailored dashboard and specialized workflows:

| Role | Portal | Description |
|------|--------|-------------|
| 🛡️ **Admin** | `/admin` | System configuration, user management, RBAC, analytics |
| 🩺 **Doctor** | `/portal/doctor` | Patient queue, examination, diagnosis (ICD-10), prescriptions |
| 💊 **Pharmacist** | `/portal/pharmacist` | Prescription dispensing, inventory management, stock alerts |
| 🏥 **Receptionist** | `/portal/receptionist` | Appointment scheduling, patient registration, billing |

---

## ✨ Key Features

### Multi-Role Access Control
- Role-based authentication with route guards
- Separate layouts, sidebars, and dashboards per role
- Centralized permission management

### Clinical Workflow
- **Patient Queue Management** — real-time queue with call-next functionality
- **Electronic Medical Records (EMR)** — vitals, symptoms, ICD-10 diagnosis
- **E-Prescriptions** — digital prescription creation with drug database lookup
- **Pharmacy Dispensing** — prescription verification and stock tracking

### Administration
- **User Management** — CRUD operations with role assignment
- **Department Management** — specialty/department organization
- **Medicine Catalog** — centralized drug master data
- **Schedule Management** — shift planning and doctor availability
- **Activity Logs** — full audit trail of system actions
- **Statistics Dashboard** — visual analytics with charts

### UX / UI
- 🌙 Dark mode support (CSS variables + Tailwind)
- 📱 Responsive design across all viewports
- ⚡ Glassmorphism login page with role-based demo accounts
- 🎨 Consistent design system with custom color tokens

---

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) |
| **UI Library** | React 18 |
| **HTTP Client** | [Axios](https://axios-http.com/) |
| **Icons** | Google Material Symbols |
| **Font** | Inter (Google Fonts) |
| **Linting** | ESLint + Next.js config |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v22.x (required — see setup below)
- **npm** ≥ 11.x
- **nvm** ([Node Version Manager](https://github.com/nvm-sh/nvm)) — recommended for managing Node versions

> **⚠️ Important:** This project requires **Node.js v22.x** and **npm ≥ 11**. Using a different version may cause build errors. The repository includes a `.nvmrc` file and an `engines` field in `package.json` to enforce this.

#### Installing the correct Node.js version

**Option 1 — Using nvm (recommended):**

```bash
# Install Node.js v22 (one-time setup)
nvm install 22

# Switch to the project's required version (reads .nvmrc automatically)
nvm use
```

**Option 2 — Manual installation:**

Download and install Node.js v22.x from the [official website](https://nodejs.org/).

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/minhquan2504/EHealth_Website.git
cd EHealth_Website

# 2. Activate the correct Node.js version (if using nvm)
nvm use

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

### Jenkins / CI

If your Jenkins job runs shell steps directly on the server, make sure it activates the repository's Node.js version before installing dependencies or building:

```bash
cd /var/www/EHealth/EHealth_Website
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install
nvm use
node -v
npm -v
npm ci
npm run build
```

If your Jenkins agent does not use `nvm`, install Node.js **v22.x** and npm **11+** on the agent itself. This project will show `EBADENGINE` warnings and may fail unpredictably on Node 18.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint checks |

---

## 🏗 Architecture

### Project Structure

```
src/
├── api/                  # API endpoint definitions
├── app/                  # Pages (Next.js App Router)
│   ├── login/            # Authentication
│   ├── admin/            # Admin portal (9 pages)
│   └── portal/
│       ├── doctor/       # Doctor portal (8 pages)
│       ├── pharmacist/   # Pharmacist portal (5 pages)
│       └── receptionist/ # Receptionist portal (6 pages)
├── components/
│   ├── admin/            # Admin-specific components
│   ├── common/           # Shared UI components
│   ├── portal/           # Portal-specific components
│   ├── shared/           # Sidebar, Header, Guards
│   └── ui/               # UI primitives
├── constants/            # Routes, roles, status, API, UI text
├── contexts/             # React Context providers
├── features/             # Feature-based modules
├── hooks/                # Custom React hooks
├── services/             # API service layer
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

### Design Principles

- **Constants-Driven** — Zero hard-coded strings for routes, roles, statuses, colors, or API endpoints. Everything lives in `src/constants/`
- **Feature-Based Modules** — Each domain (users, appointments, prescriptions) encapsulates its own components and types
- **Service Layer Pattern** — All API calls are abstracted into service files under `src/services/`
- **Layout Composition** — Each role has its own layout with dedicated sidebar and header components

For a deeper technical overview, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🗺 Roadmap

- [x] Multi-role authentication & authorization
- [x] Admin portal (users, doctors, departments, medicines, schedules, stats)
- [x] Doctor portal (queue, examination, EMR, prescriptions)
- [x] Pharmacist portal (dispensing, inventory, reports)
- [x] Receptionist portal (appointments, patient registration, billing)
- [ ] Real-time notifications (WebSocket)
- [ ] Dark mode toggle
- [ ] Print support (prescriptions, invoices, exam reports)
- [ ] Import/Export Excel
- [ ] AI-powered features (symptom analysis, smart scheduling)
- [ ] Video consultations
- [ ] Payment integration (Momo, VNPay, QR)
- [ ] Mobile app (Flutter)

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Development setup
- Branch naming & commit conventions
- Pull request process

---

## 📄 License

This project is developed as a graduation thesis project.

---

<div align="center">

**Built with ❤️ using Next.js, TypeScript & Tailwind CSS**

</div>
