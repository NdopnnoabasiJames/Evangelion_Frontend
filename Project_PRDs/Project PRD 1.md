Project Requirements Document (PRD)

Project Title: EVANGELION Event Invitation and Tracking System
Project Owner: Mr. Funsho

1. Project Summary
   The system is built to manage and track event invitations and logistics at multiple levels of the church hierarchy: State, Branch, and Zone. It also features an admin approval hierarchy to maintain operational control and decentralization. This PRD focuses only on the Admin Structure, Admin Registration/Approval Flow, and Event Creation/Flow. The Worker, Guest, and Registrar modules will be documented separately.

2. Organizational Structure
   Hierarchical Levels:

* Super Admin (seeded manually into the system)
* State Admin
* Branch Admin
* Zonal Admin

Geo Hierarchy:

* States → Branches → Zone
* Bus pickup locations are under the Zone. Usually, there is only 1 Bus pickup per Zone. Seldomly, some Zones could have more than 1 Bus pickup.
* A list of States and their corresponding Church Branches, Zones, and Pickup locations would be availed. This would be input into the system accordingly.
* All tables within the system should be downloadable to Excel.
* Admins can log in and use the forgotten password feature to retrieve login credentials.
* Each admin type only has control and visibility over their jurisdiction.

3. Admin Features and Permissions
   3.1 Super Admin:

* Full system access
* Seeded manually
* Can:

  * Create events across all states
  * View and manage all states, branches, zones
  * View platform audit trail, with time stamps for all system activities
  * Approve or reject State Admin registrations

3.2 State Admin:

* Registers on platform (pending Super Admin approval)
* Manages a specific state
* Can:

  * Create events in their state
  * Approve/reject Branch Admin registrations
  * View branches and zones within their state
  * Select active branches to participate in Super Admin–created events

3.3 Branch Admin:

* Registers on platform (pending State Admin approval)
* Manages a specific branch
* Can:

  * Create branch-level events
  * View and approve Zonal Admin registrations
  * Select active zones for events created by State Admin

3.4 Zonal Admin:

* Registers on platform (pending Branch Admin approval)
* Manages a specific zone
* Can:

  * Create zone-level events
  * Assign bus pickup locations and departure times for events passed down from higher levels
  * Manage a saved list of frequently used bus pickup stations (retrieved from database)

4. Admin Onboarding Flow
   \| Admin Type   | Registration Required | Approval By     |
   \|--------------|-----------------------|------------------|
   \| Super Admin  | No (Seeded)           | N/A              |
   \| State Admin  | Yes                   | Super Admin      |
   \| Branch Admin | Yes                   | State Admin      |
   \| Zonal Admin  | Yes                   | Branch Admin     |

5. Event Creation Flow
   \| Created By   | Scope        | Participation Flow                             |
   \|--------------|--------------|-------------------------------------------------|
   \| Super Admin  | All States   | State Admin selects branches                   |
   \| State Admin  | Their State  | Branch Admin selects zones                     |
   \| Branch Admin | Their Branch | Zonal Admin assigns buses                      |
   \| Zonal Admin  | Their Zone   | N/A                                            |

Notes:

* Events cascade downward automatically to dashboards when selected by the higher-level admin.
* No confirmation is required at any level.
* Each admin sees only relevant data based on their hierarchy.
* Bus pickup assignment is handled at the Zone Admin level and stored for reuse.
* Every table must be exportable to Excel.

6. Mobile Responsiveness

* The system will be mobile responsive so admins can access dashboards and perform approvals or event tasks on mobile.

7. Authentication

* JWT-based authentication.
* Role-based access control per admin level.

Next Section:
Separate PRD will be created to handle:

* Worker registration, volunteering, and guest registration flows.
* Registrar check-in operations.
* Communication logic for SMS/email notifications.
* Admin dashboards and performance tracking modules.

Common features for all Admin Roles:

* Ability to filter by State, Church Branch, Zones
* Performance ratings e.g., all gold, 3 star, 2 star, 1 star
* Ability to disable or replace a State, Branch, or Zonal head
