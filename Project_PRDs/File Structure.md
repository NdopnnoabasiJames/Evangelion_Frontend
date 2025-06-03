frontend/
├── public/
│   ├── index.html
│   └── vite.svg
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Main app with routing
│   ├── index.css                   # Global styles
│   │
│   ├── components/                 # Reusable components
│   │   ├── Layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Layout.jsx
│   │   ├── common/
│   │   │   ├── Loading.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   └── SearchBox.jsx
│   │   └── forms/
│   │       ├── LoginForm.jsx
│   │       ├── EventForm.jsx
│   │       └── GuestForm.jsx
│   │
│   ├── pages/                      # Main pages only
│   │   ├── Login.jsx               # Authentication
│   │   ├── Dashboard.jsx           # Role-based dashboard
│   │   ├── Events.jsx              # Event management
│   │   ├── Guests.jsx              # Guest management
│   │   ├── Workers.jsx             # Worker management
│   │   ├── Registrars.jsx          # Registrar & check-in
│   │   └── Analytics.jsx           # Reports & analytics
│   │
│   ├── hooks/                      # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   └── usePermissions.js
│   │
│   ├── services/                   # API services
│   │   ├── api.js                  # Base API setup
│   │   ├── authService.js
│   │   ├── eventService.js
│   │   ├── guestService.js
│   │   └── registrarService.js
│   │
│   ├── utils/                      # Utilities
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── permissions.js
│   │
│   └── styles/                     # Styles
│       ├── components.css
│       └── variables.css
│
├── package.json
├── vite.config.js
└── eslint.config.js
