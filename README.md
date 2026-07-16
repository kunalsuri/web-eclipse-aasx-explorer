<div align="center">

# 🚀 RE-Eclipse AASX Web

### *Next-Generation Asset Administration Shell Package Explorer*

**A modern, web-based platform for managing, validating, and exploring Industry 4.0 digital twins**

[![AAS V3](https://img.shields.io/badge/AAS-V3-blue?style=flat-square)](https://industrialdigitaltwin.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: EPL-2.0](https://img.shields.io/badge/License-EPL--2.0-red?style=flat-square)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

<br>

---

<p align="center">
  <strong>Developed at CEA-LIST</strong> • Contributing to the State of the Art in Asset Administration Shell Technology
</p>

</div>

---

<br>

## 🌟 Overview

**RE-Eclipse AASX Web** is an advanced, browser-based Asset Administration Shell (AAS) package explorer that pushes the boundaries of Industry 4.0 / 5.0 digital twin management. 

Built with modern web technologies and adhering to the latest AAS V3 specifications, this platform enables seamless creation, validation, and manipulation of AASX packages directly in your browser.

Developed at **[CEA-LIST](https://list.cea.fr/)** (French Alternative Energies and Atomic Energy Commission - LIST Institute), this project represents a significant contribution to the state of the art in AAS tooling, bridging the gap between traditional desktop applications and modern cloud-native architectures.

<br>

### 🎯 Why RE-Eclipse AASX Web?

- **🌐 Web-Native Architecture** - No installation required, runs entirely in the browser
- **🔬 Research-Backed** - Built on solid foundations from CEA-LIST's expertise in digital systems
- **⚡ Performance-First** - Handles large AASX packages (200MB+) with ease
- **🔐 Enterprise-Ready** - JWT authentication, session management, and audit logging
- **🎨 Modern UX** - Intuitive interface with dark/light themes and responsive design
- **🛡️ Validation Engine** - Comprehensive AAS V3 schema validation with detailed diagnostics

<br>

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🎯 Core AAS V3 Capabilities

- **📦 AASX Package Management**  
  Upload, parse, and manage AASX files up to 200MB with intelligent caching

- **🌳 Interactive Tree Navigation**  
  Hierarchical exploration of Shells, Submodels, and Elements with virtual scrolling

- **🛡️ Advanced Validation Engine**  
  Real-time AAS V3 schema validation with detailed error diagnostics and auto-correction suggestions

- **✏️ Intelligent Property Editing**  
  Type-specific editors with multi-language support, versioning, and change tracking

- **📤 Multi-Format Export**  
  Export to JSON, XML, Excel/CSV with customizable templates and batch operations

- **🔍 Semantic Search**  
  Full-text search across AAS elements with advanced filtering and query capabilities

</td>
<td width="50%">

### 🔧 Enterprise Features

- **🔐 Robust Authentication**  
  JWT-based authentication with role-based access control (RBAC) and session management

- **� Built-in Observability**  
  Comprehensive logging, tracing, and audit trails for compliance

- **🔄 Real-time Collaboration**  
  WebSocket support for multi-user editing (planned)

- **🌍 Internationalization**  
  Multi-language UI with i18n support for global deployment

- **⚡ Performance Optimized**  
  Lazy loading, code splitting, and optimized rendering for large datasets

- **🎨 Theming & Accessibility**  
  Dark/light modes, WCAG 2.1 AA compliant, keyboard navigation

</td>
</tr>
</table>

<br>

---

## 🛠️ Technology Stack

<table>
<tr>
<td width="33%" valign="top">

### Frontend

- **[React 18](https://react.dev/)** - UI library with concurrent features
- **[TypeScript 5.6](https://www.typescriptlang.org/)** - Static type checking
- **[Vite 5](https://vitejs.dev/)** - Next-gen build tool
- **[Tailwind CSS 3](https://tailwindcss.com/)** - Utility-first styling
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[TanStack Query](https://tanstack.com/query)** - Data fetching & caching
- **[Zustand](https://github.com/pmndrs/zustand)** - State management
- **[React Hook Form](https://react-hook-form.com/)** - Form handling
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[Wouter](https://github.com/molefrog/wouter)** - Lightweight routing

</td>
<td width="33%" valign="top">

### Backend

- **[Node.js 18+](https://nodejs.org/)** - JavaScript runtime
- **[Express 4](https://expressjs.com/)** - Web framework
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM
- **[JWT](https://jwt.io/)** - Authentication tokens
- **[Multer](https://github.com/expressjs/multer)** - File upload handling
- **[JSZip](https://stuk.github.io/jszip/)** - AASX package parsing
- **[Zod](https://zod.dev/)** - Schema validation
- **[fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)** - XML processing

</td>
<td width="33%" valign="top">

### DevOps & Tools

- **[Vitest](https://vitest.dev/)** - Unit testing framework
- **[Testing Library](https://testing-library.com/)** - React testing utilities
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[tsx](https://github.com/esbuild-kit/tsx)** - TypeScript execution
- **[cross-env](https://github.com/kentcdodds/cross-env)** - Environment variables
- **[drizzle-kit](https://orm.drizzle.team/kit-docs/overview)** - Database migrations

</td>
</tr>
</table>

<br>

### Additional Libraries

**UI Components**: Lucide React (icons), Recharts (charts), React Day Picker (date picker), Embla Carousel (carousels), Vaul (drawers)  
**Utilities**: nanoid (ID generation), date-fns (date manipulation), clsx & tailwind-merge (conditional styling), Immer (immutable state)  
**Data Handling**: Papa Parse (CSV parsing), XLSX (Excel support), Axios (HTTP client)

<br>

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** 18.x or higher
- **npm** 8.x or higher (comes with Node.js)
- A modern browser (Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+)

### Installation

```bash
# Clone the repository
git clone https://gitlab.deeplab.intra.cea.fr/dils-digitaltwin-ai/re-eclipse-aasx-web
cd re-eclipse-aasx-web

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will start at `http://localhost:5000`

### First Run

1. Open your browser and navigate to `http://localhost:5000`
2. Create a new account or use demo credentials (if available)
3. Upload your first AASX package using the file upload interface
4. Explore the AAS structure in the interactive tree view
5. Edit properties, run validation, and export your data

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reloading |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run check` | Type check with TypeScript |
| `npm test` | Run test suite |

---

## 🏗️ Architecture

This project follows a **Feature-Driven Modular Architecture** designed for scalability and maintainability.

```text
re-eclipse-aasx-web/
│
├── client/                      # React Frontend (SPA)
│   ├── src/
│   │   ├── components/          # Reusable UI components (Radix + Tailwind)
│   │   ├── features/            # Feature modules (domain-driven)
│   │   │   ├── auth/            # Authentication & authorization
│   │   │   ├── aas-explorer/    # AAS tree navigation & visualization
│   │   │   ├── editor/          # Property editing & validation
│   │   │   └── export/          # Export functionality
│   │   ├── pages/               # Route-level page components
│   │   ├── stores/              # Zustand state management
│   │   ├── hooks/               # Custom React hooks
│   │   ├── api/                 # API client & TanStack Query hooks
│   │   ├── lib/                 # Utilities & configurations
│   │   └── services/            # Business logic services
│   └── index.html               # Entry point
│
├── server/                      # Express Backend API
│   ├── auth/                    # JWT auth middleware & session mgmt
│   ├── src/
│   │   ├── api/                 # REST API route handlers
│   │   ├── services/            # Business logic layer
│   │   ├── models/              # Database models (Drizzle ORM)
│   │   └── utils/               # Server utilities
│   ├── storage.ts               # File storage abstraction
│   └── index.ts                 # Server entry point
│
├── shared/                      # Shared TypeScript types & utilities
│   ├── aas-v3-types.ts          # AAS V3 type definitions
│   ├── aas-parser.ts            # AASX parsing engine
│   ├── aas-validation-engine.ts # Validation logic
│   ├── aas-search-engine.ts     # Search & filtering
│   └── schema.ts                # Drizzle schema definitions
│
├── data/                        # JSON file-based storage (dev mode)
├── tests/                       # Test suites (unit, integration, e2e)
└── scripts/                     # Build & deployment scripts
├── data/                   # JSON file storage
└── shared/                 # Shared TypeScript types
```

---

## 🛣️ Roadmap

### 🎯 Release 1.0 - Core Foundation (Current)

- [x] AAS V3 Type System
- [x] AASX Package Upload/Download
- [x] Basic Tree Navigation
- [x] Property Viewer
- [x] Authentication System


---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## 🌍 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- **ESLint** + **Prettier** for consistent formatting
- **TypeScript Strict Mode** enabled
- **Functional components** with React hooks
- **Feature-driven** modular architecture

---

## 📄 License

This project is licensed under the Eclipse Public License 2.0 (EPL-2.0) - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

This project stands on the shoulders of giants and benefits from the contributions of the broader Industry 4.0 community:

- **[CEA-LIST](https://list.cea.fr/)** - French research laboratory driving innovation in embedded and intelligent systems
- **[Eclipse Foundation](https://www.eclipse.org/)** - For fostering open-source collaboration in industrial software
- **[Industrial Digital Twin Association (IDTA)](https://industrialdigitaltwin.org/)** - For stewarding the AAS specification and ecosystem
- **[Platform Industrie 4.0](https://www.plattform-i40.de/)** - For pioneering the Asset Administration Shell concept
- **Open Source Community** - For the incredible React, TypeScript, and Node.js ecosystems

### 🏛️ About CEA-LIST

[CEA-LIST](https://list.cea.fr/) is a research institute of CEA Tech, focused on intelligent digital systems. With over 800 researchers and engineers, CEA-LIST develops innovative solutions in areas including:

- Embedded Systems & IoT
- Artificial Intelligence & Machine Learning  
- Cybersecurity & Trusted Systems
- Software Engineering & Verification
- Industry 4.0 & Digital Twins

This project represents CEA-LIST's commitment to advancing the state of the art in AAS tooling, making digital twin technology more accessible and developer-friendly.

---

## 📞 Support & Community

- **🐛 Report Issues** - [GitHub Issues](https://github.com/kunalsuri/RE-Eclipse-AASX-Web/issues)
- **💬 Join Discussions** - [GitHub Discussions](https://github.com/kunalsuri/RE-Eclipse-AASX-Web/discussions)
- **� Documentation** - [Wiki](https://github.com/kunalsuri/RE-Eclipse-AASX-Web/wiki)
- **🌐 CEA-LIST** - [https://list.cea.fr/](https://list.cea.fr/)

---

<div align="center">

**Developed with dedication at CEA-LIST**  
*Contributing to the open-source Industry 4.0 ecosystem*

[![CEA-LIST](https://img.shields.io/badge/CEA-LIST-0055A4?style=flat-square)](https://list.cea.fr/)
[![Eclipse Foundation](https://img.shields.io/badge/Eclipse-Foundation-2C2255?style=flat-square&logo=eclipse)](https://www.eclipse.org/)
[![IDTA](https://img.shields.io/badge/IDTA-Member-00AAE7?style=flat-square)](https://industrialdigitaltwin.org/)

[Eclipse ESMF](https://eclipse.org/esmf) • [GitHub](https://github.com/kunalsuri/RE-Eclipse-AASX-Web) • [License](LICENSE)

</div>
