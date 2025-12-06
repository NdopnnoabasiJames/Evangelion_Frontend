# Evangelion Event Management System - Frontend

<p align="center">
  ⚛️ <strong>React</strong> • ⚡ <strong>Vite</strong> • 🎨 <strong>Bootstrap</strong> • 🚀 <strong>Modern Web App</strong>
</p>

## 🌟 Project Overview

**Evangelion Frontend** is the user interface component of the comprehensive event management platform designed for religious organizations and spiritual communities. Built with **React** and powered by **Vite**, this modern web application provides an intuitive, responsive interface for managing complex spiritual events, guest journeys, and volunteer coordination across hierarchical organizational structures.

## 🎯 Core Purpose

The frontend serves as the primary interface for all stakeholders in the spiritual event management ecosystem:

- **📊 Administrative Dashboards**: Comprehensive control centers for different management levels
- **👥 Guest Management Interfaces**: Streamlined workflows for registration, check-in, and spiritual journey tracking
- **🤝 Volunteer Coordination**: Intuitive tools for event volunteering and role-based task management
- **📈 Real-Time Analytics**: Live event metrics, attendance tracking, and performance insights
- **🎪 Event Orchestration**: Complete event lifecycle management from creation to post-event analysis

## 🏗️ User Experience Architecture

### **Role-Based Interface Design**

#### **🏛️ Administrative Hierarchy**
- **Super Admin Dashboard**: Global oversight with cross-organizational analytics
- **State Admin Interface**: Regional event coordination and branch management
- **Branch Admin Portal**: Local event management and volunteer approval workflows  
- **Zonal Admin Controls**: Area-specific coordination and guest tracking

#### **👷 Volunteer Workspaces**
- **Registrar Interface**: Guest registration, check-in management, and daily attendance tracking
- **PCU Dashboard**: First-timer identification and spiritual newcomer processing
- **Intern Workspace**: Commence assimilation workflow and spiritual integration tracking
- **Worker Portal**: General event support and guest assistance tools

## 🚀 Key Features & Capabilities

### **🎪 Dynamic Event Management**
- **Multi-Event Dashboard**: Comprehensive view of all accessible events
- **Smart Event Filtering**: Active/expired event categorization with real-time updates
- **Cross-Jurisdictional Volunteering**: Seamless volunteering across different branches and states
- **Event Timeline Visualization**: Clear event progression with status indicators

### **👤 Advanced Guest Journey Interface**
- **Intuitive Guest Registration**: Step-by-step guest onboarding with validation
- **Real-Time Guest Lists**: Live-updating guest lists with powerful search and filtering
- **Three-Phase Processing UI**: 
  - **Check-In Interface** → Visual confirmation of guest attendance
  - **First Timer Marking** → PCU workflow for identifying spiritual newcomers
  - **Assimilation Tracking** → Intern tools for spiritual integration process
- **Guest Status Visualization**: Clear visual indicators for each guest's journey stage

### **🔄 Multi-Day Event Excellence**
- **Daily Check-In Management**: Day-specific attendance tracking with calendar integration
- **Attendance Report Generation**: Detailed multi-day attendance analytics with export capabilities
- **Progressive Guest Tracking**: Visual journey mapping across multiple event days

### **📊 Intelligent Analytics & Reporting**
- **Real-Time Statistics Dashboard**: Live event metrics with auto-refreshing data
- **Performance Analytics**: Volunteer efficiency tracking and guest conversion insights
- **Interactive Data Visualizations**: Charts, graphs, and trend analysis
- **Export Capabilities**: Downloadable reports in multiple formats

### **🎨 Modern User Experience**
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **Intuitive Navigation**: Role-based navigation with contextual menu systems
- **Real-Time Notifications**: Instant feedback for user actions and system updates
- **Accessibility Features**: WCAG-compliant design for inclusive user access

## 🛠️ Technical Stack

### **Core Technologies**
- **⚛️ React 18**: Modern functional components with hooks and context
- **⚡ Vite**: Lightning-fast build tool and development server
- **🎨 Bootstrap 5**: Responsive design framework with custom theming
- **🔗 Axios**: HTTP client for API communication with interceptors
- **🧭 React Router**: Declarative routing with protected routes

### **State Management & Architecture**
- **Context API**: Global state management for user authentication and app settings
- **Custom Hooks**: Reusable logic for API calls, authentication, and data fetching
- **Component Architecture**: Modular, reusable components with clear separation of concerns
- **Service Layer**: Abstracted API communications with error handling

### **Development Tools & Quality**
- **ESLint**: Code quality and consistency enforcement
- **Prettier**: Automated code formatting
- **Vite HMR**: Hot module replacement for rapid development
- **Environment Configuration**: Multi-environment support with secure variable management

## 💼 User Workflows & Interactions

### **Guest Management Workflow**
1. **Registration Interface**: Workers use intuitive forms to register guests with validation
2. **Check-In Dashboard**: Registrars verify attendance with QR codes or manual confirmation
3. **First Timer Processing**: PCUs identify and mark spiritual newcomers with one-click actions
4. **Assimilation Tracking**: Interns guide first-timers through integration with progress indicators

### **Volunteer Coordination Flow**
1. **Event Discovery**: Browse available events with filtering and search capabilities
2. **Volunteer Request**: Submit requests to participate in events with instant feedback
3. **Approval Workflow**: Admins review and approve requests with notification systems
4. **Role Activation**: Access role-specific interfaces based on assigned responsibilities

### **Administrative Management**
1. **Event Creation**: Comprehensive event setup with multi-step wizards
2. **Volunteer Management**: Approve/reject volunteer requests with bulk operations
3. **Analytics Review**: Monitor event performance with interactive dashboards
4. **Report Generation**: Export detailed analytics for organizational insights

## 🎨 Design Philosophy

### **User-Centric Design**
- **Intuitive Interfaces**: Minimal learning curve with contextual guidance
- **Role-Appropriate Views**: Interfaces tailored to specific user responsibilities
- **Progressive Disclosure**: Information presented at the right time and context
- **Accessibility First**: Inclusive design for users with varying abilities

### **Performance Optimization**
- **Lazy Loading**: Components and routes loaded on-demand
- **Efficient API Calls**: Optimized data fetching with caching strategies
- **Responsive Images**: Adaptive image loading based on device capabilities
- **Bundle Optimization**: Tree-shaking and code splitting for minimal load times

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v18+ recommended)
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### **Quick Start Guide**

#### 1. Clone & Setup
```bash
git clone <repository-url>
cd evangelion-frontend
npm install
```

#### 2. Environment Configuration
```bash
cp example.env .env
```

Configure your `.env` file with:
```env
VITE_API_BASE_URL=http://localhost:3000  # Backend API URL
VITE_APP_NAME=Evangelion Event Management
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
```

#### 3. Development Server
```bash
npm run dev
# or use the provided script
./start-dev.sh
```

The application will be available at `http://localhost:5173`

#### 4. Production Build
```bash
npm run build
npm run preview  # Preview production build locally
```

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Shared components (Loading, Modals, etc.)
│   ├── dashboard/       # Dashboard-specific components
│   ├── events/          # Event management components
│   ├── guests/          # Guest management components
│   └── admin/           # Administrative components
├── pages/               # Page-level components
├── services/            # API service layer
├── hooks/               # Custom React hooks
├── utils/               # Utility functions and constants
├── styles/              # Global styles and themes
├── assets/              # Static assets (images, icons, etc.)
└── App.jsx             # Main application component
```

## 🎯 Key Components

### **Dashboard Components**
- `RegistrarTabs.jsx` - Multi-role volunteer dashboard with event management
- `AdminDashboard.jsx` - Administrative oversight with analytics and controls
- `GuestManagement.jsx` - Comprehensive guest lifecycle management interface

### **Event Management**
- `EventCreationModal.jsx` - Intuitive event setup with validation
- `MultiDayCheckInManager.jsx` - Daily attendance tracking for extended events
- `PickupStationAssignment.jsx` - Transportation coordination interface

### **User Interface**
- `RoleSwitchingSection.jsx` - Dynamic role management for multi-role users  
- `LoadingCard.jsx` - Consistent loading states across the application
- `NotificationSystem.jsx` - Real-time user feedback and alerts

## 🔒 Security & Authentication

### **Authentication Flow**
- JWT-based authentication with secure token storage
- Protected routes with role-based access control
- Automatic token refresh and session management
- Secure logout with token invalidation

### **Data Security**
- Input validation and sanitization
- XSS protection with proper data encoding
- CSRF protection with API token validation
- Secure API communication with HTTPS

## 🌍 Deployment & Production

### **Build Optimization**
```bash
npm run build    # Creates optimized production build
npm run preview  # Local production preview
```

### **Environment Considerations**
- Environment-specific API endpoints
- CDN integration for static assets
- Caching strategies for optimal performance
- Error logging and monitoring integration

### **Performance Monitoring**
- Bundle size analysis with build reports
- Core Web Vitals tracking
- User experience monitoring
- API response time optimization

## 🧪 Testing & Quality Assurance

### **Development Testing**
```bash
npm run test        # Run unit tests
npm run test:watch  # Watch mode for development
npm run lint        # Code quality checks
npm run format      # Code formatting
```

### **Quality Standards**
- Component testing with React Testing Library
- Integration testing for user workflows
- Accessibility testing with automated tools
- Cross-browser compatibility testing

## 🤝 Contributing & Development

### **Development Workflow**
- Feature branch development with descriptive naming
- Component-first development approach
- Comprehensive code review process
- Documentation updates with new features

### **Code Standards**
- ESLint configuration for consistent code quality
- Prettier formatting for uniform code style
- Component documentation with PropTypes or TypeScript
- Meaningful commit messages with conventional commits

## 📞 Support & Maintenance

### **Production Considerations**
- Regular security updates and dependency management
- Performance monitoring and optimization
- User feedback collection and feature iteration
- Backup and recovery procedures for user data

### **Monitoring & Analytics**
- User behavior analytics for UX improvements
- Error tracking and performance monitoring
- Feature usage analytics for product decisions
- A/B testing capabilities for UI optimization

---

## 📄 License

This project is proprietary software developed for religious event management. Please review the license terms before use.

---

**🎨 Crafted with modern web technologies for spiritual communities worldwide.**
**⚡ Fast • 📱 Responsive • 🎯 User-Focused • 🔒 Secure**
