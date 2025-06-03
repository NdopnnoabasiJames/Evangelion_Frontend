### **Streamlined Implementation Roadmap**

#### **Phase 1: Foundation** 

**Goal: Get authentication and basic navigation working**

1. **Setup Dependencies**

   **npm** **install** **react-router-dom** **axios** **react-query** **react-hook-form**
2. **Core Infrastructure**

   * Authentication service and context
   * API service with base configuration
   * Basic routing setup
   * Simple layout with header/sidebar
3. **Login System**

   * Login form component
   * Role-based redirect after login
   * Protected routes wrapper

#### **Phase 2: Dashboard & Navigation (Week 1-2)**

**Goal: Role-based dashboard with navigation**

1. **Layout Components**
   * Header with user info and logout
   * Sidebar with role-based menu items
   * Main layout wrapper
2. **Dashboard Page**
   * Single dashboard that adapts based on user role
   * Key metrics and quick actions
   * Role-specific widgets

#### **Phase 3: Core Functionality (Week 2-3)**

**Goal: Essential CRUD operations**

1. **Events Page**
   * List events (filtered by user role/hierarchy)
   * Create/edit events (role-based permissions)
   * Event selection (branch/zone selection)
2. **Guests Page**
   * Guest registration by workers
   * Guest search and management
   * Basic analytics
3. **Check-in System**
   * Simple registrar interface for guest check-in
   * Guest search by name/phone
   * Check-in statistics

#### **Phase 4: Management Pages (Week 3-4)**

**Goal: Admin functionality**

1. **Workers Page**
   * Worker approval (for branch admins)
   * Worker performance view
   * Worker-guest relationships
2. **Registrars Page**
   * Registrar approval workflow
   * Zone assignments
   * Check-in management

#### **Phase 5: Analytics & Polish (Week 4)**

**Goal: Reporting and final touches**

1. **Analytics Page**
   * Basic charts and reports
   * Export functionality
   * Performance metrics
2. **Polish & Optimization**
   * Mobile responsiveness
   * Loading states and error handling
   * Final UI improvements

### **Key Features Per Page:**

**Dashboard:** Quick overview, role-specific actions, key metrics **Events:** CRUD operations, hierarchical creation, status management **Guests:** Registration, search, check-in status, basic analytics **Workers:** Approval workflow, performance tracking, guest assignments **Registrars:** Approval, zone assignment, check-in interface **Analytics:** Charts, reports, export functionality

### **Technology Stack:**

* **React 18** with Vite
* **React Router** for navigation
* **React Query** for server state
* **React Hook Form** for forms
* **Bootstrap 5** for styling (already included)
* **Chart.js** for analytics (when needed)
* **Axios** for API calls
