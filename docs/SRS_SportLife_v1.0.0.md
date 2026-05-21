# Software Requirements Specification (SRS) - SportLife

**Version:** 1.0.4  
**Date:** 2026-05-21  
**Status:** Draft for stakeholder review  
**Author:** doc-coordinator / srs-agent

---

## I. Record of Changes

| Version | Date | A/M/D | In charge | Change Description |
| ----- | ----- | ----- | ----- | ----- |
| 1.0.0 | 2026-05-18 | A | doc-coordinator | Initial SRS for SportLife |
| 1.0.1 | 2026-05-18 | M | doc-coordinator | Added recommended web tech stack for implementation planning |
| 1.0.2 | 2026-05-18 | M | doc-coordinator | Refined community posts as sport-tagged discussion content, not match scheduling |
| 1.0.3 | 2026-05-19 | M | doc-coordinator | Added community post title and admin approval before publication; removed community report flow |
| 1.0.4 | 2026-05-21 | M | doc-coordinator | Added image upload limits for Player avatars and Venue photos |

*A - Added, M - Modified, D - Deleted*

---

## II. Software Requirement Specification

## 1. Product Overview

### 1.1 Purpose

This document defines the Software Requirements Specification for **SportLife**, a web application that connects local sport players, venue owners, and administrators in Hanoi. The SRS describes the product scope, actors, use cases, functional requirements, business rules, interface expectations, and non-functional requirements for version 1.0.0.

### 1.2 Product Scope

SportLife helps:

- Venue owners publish sport venue information.
- Players create sport profiles with preferred sports, skill levels, and ward/commune location.
- Players find open matches, create matches, and find people to play with in the same area.
- Players use sport-tagged community posts for discussion, advice, event announcements, and general sport topics.
- Admins manage users, venues, categories, areas, skill levels, content, and system visibility.

Version 1.0.0 is a **web application** focused on Hanoi. It does not support online payment or in-system financial settlement. Venue booking is limited to venue discovery and direct contact between player and venue owner.

### 1.3 Target Users

| # | User Group | Description |
| :---- | :---- | :---- |
| 1 | Player | Sport player who creates a profile, searches venues, finds or creates matches, joins communities, and contacts others. |
| 2 | Venue Owner | Owner or representative of a sport venue who publishes venue information and communicates with players. |
| 3 | Admin | System administrator who manages users, venues, categories, locations, skill levels, community content, and dashboards. |

### 1.4 Context Diagram

See: [Context Diagram](./diagrams/context-diagram.puml)

### 1.5 Assumptions

| ID | Assumption |
| :---- | :---- |
| AS-01 | SportLife v1.0.0 is a new system built from scratch. |
| AS-02 | The initial service area is Hanoi only. |
| AS-03 | Area selection uses ward/commune-level data. |
| AS-04 | Initial sports are Billiard, Badminton, and Pickleball. |
| AS-05 | Admin can later configure sports, player levels, and supported areas. |
| AS-06 | Email service is available for account verification and password reset links. |

### 1.6 Out of Scope

| ID | Out-of-scope Item |
| :---- | :---- |
| OOS-01 | Online payment and payment gateway integration. |
| OOS-02 | In-system venue booking transaction settlement. |
| OOS-03 | Rating and review functions. |
| OOS-04 | Push notification and email notification for match events. |
| OOS-05 | Detailed performance targets and audit logging requirements. |

---

## 2. User Requirements

### 2.1 Actors

| # | Actor | Description |
| :---- | :---- | :---- |
| 1 | Guest | Unauthenticated visitor who can access public pages and register/login. |
| 2 | Player | Authenticated sport player. |
| 3 | Venue Owner | Authenticated venue owner. |
| 4 | Admin | Privileged internal user. |
| 5 | Email Service | External email delivery service for verification and password reset links. |

### 2.2 Use Cases

#### 2.2.1 UC-01 - Register, Verify Email, Login, and Reset Password

**Use Case Diagram:** [UC-01 Use Case](./diagrams/uc-01-auth/uc-01-use-case.puml)  
**Screen Flow:** [UC-01 Screen Flow](./diagrams/uc-01-auth/uc-01-screenflow.puml)  
**State Diagram:** [UC-01 State Diagram](./diagrams/uc-01-auth/uc-01-statediagram.puml)  
**Sequence Diagram:** [UC-01 Sequence](./diagrams/uc-01-auth/uc-01-sequence.puml)  
**Backend Classes:** [UC-01 Backend Classes](./diagrams/uc-01-auth/uc-01-class-backend.puml)  
**Frontend Classes:** [UC-01 Frontend Classes](./diagrams/uc-01-auth/uc-01-class-frontend.puml)

| Field | Description |
| :---- | :---- |
| Primary Actor | Guest, Player, Venue Owner |
| Secondary Actors | Email Service |
| Description | User registers with email and password, selects role, verifies email through a link, logs in, and can reset password by email link. |
| Trigger | User wants to access authenticated SportLife features. |
| Preconditions | User has a valid email address. |
| Postconditions | User account is created, verified, and authenticated, or password is reset. |
| Normal Flow | 1. Guest opens registration page. 2. Guest enters email/password and selects Player or Venue Owner. 3. System sends verification link. 4. User opens link. 5. System activates account. 6. User logs in. |
| Alternative Flows | A1: User requests password reset; system sends reset link; user sets a new password. |
| Exceptions | E1: Email already exists. E2: Verification/reset link is expired or invalid. |
| Priority | Must |

#### 2.2.2 UC-02 - Manage Player Sport Profile

**Use Case Diagram:** [UC-02 Use Case](./diagrams/uc-02-player-profile/uc-02-use-case.puml)  
**Screen Flow:** [UC-02 Screen Flow](./diagrams/uc-02-player-profile/uc-02-screenflow.puml)  
**State Diagram:** [UC-02 State Diagram](./diagrams/uc-02-player-profile/uc-02-statediagram.puml)  
**Sequence Diagram:** [UC-02 Sequence](./diagrams/uc-02-player-profile/uc-02-sequence.puml)  
**Backend Classes:** [UC-02 Backend Classes](./diagrams/uc-02-player-profile/uc-02-class-backend.puml)  
**Frontend Classes:** [UC-02 Frontend Classes](./diagrams/uc-02-player-profile/uc-02-class-frontend.puml)

| Field | Description |
| :---- | :---- |
| Primary Actor | Player |
| Description | Player creates and updates sport profile including display name, avatar, Hanoi ward/commune, preferred sports, per-sport level, introduction, available time, and contact information in app. |
| Trigger | Player completes onboarding or edits profile. |
| Preconditions | Player is authenticated and email is verified. |
| Postconditions | Profile is saved and available for discovery and match filtering. |
| Normal Flow | 1. Player opens profile page. 2. System loads configurable sports, levels, and wards/communes. 3. Player enters profile information. 4. Player saves profile. 5. System validates and stores data. |
| Exceptions | E1: Required field missing. E2: Selected sport/level/area is inactive. |
| Priority | Must |

#### 2.2.3 UC-03 - Manage Venue Listing

**Use Case Diagram:** [UC-03 Use Case](./diagrams/uc-03-venue-management/uc-03-use-case.puml)  
**Screen Flow:** [UC-03 Screen Flow](./diagrams/uc-03-venue-management/uc-03-screenflow.puml)  
**State Diagram:** [UC-03 State Diagram](./diagrams/uc-03-venue-management/uc-03-statediagram.puml)  
**Sequence Diagram:** [UC-03 Sequence](./diagrams/uc-03-venue-management/uc-03-sequence.puml)  
**Backend Classes:** [UC-03 Backend Classes](./diagrams/uc-03-venue-management/uc-03-class-backend.puml)  
**Frontend Classes:** [UC-03 Frontend Classes](./diagrams/uc-03-venue-management/uc-03-class-frontend.puml)

| Field | Description |
| :---- | :---- |
| Primary Actor | Venue Owner |
| Secondary Actors | Admin |
| Description | Venue Owner creates or updates venue information including name, sports, address, ward/commune, description, images, opening hours, reference price, and contact information. |
| Trigger | Venue Owner wants to publish or update a venue. |
| Preconditions | Venue Owner is authenticated and verified. |
| Postconditions | Venue listing is submitted for Admin approval and becomes public only after approval. |
| Normal Flow | 1. Venue Owner opens venue management. 2. Venue Owner enters venue data. 3. System validates required fields. 4. System saves listing as Pending Approval. |
| Alternative Flows | A1: Updating an approved venue may require re-approval before public changes are visible. |
| Exceptions | E1: Missing contact information. E2: Invalid area or sport category. |
| Priority | Must |

#### 2.2.4 UC-04 - Discover Venue and Contact Owner

**Use Case Diagram:** [UC-04 Use Case](./diagrams/uc-04-venue-discovery/uc-04-use-case.puml)  
**Screen Flow:** [UC-04 Screen Flow](./diagrams/uc-04-venue-discovery/uc-04-screenflow.puml)  
**State Diagram:** [UC-04 State Diagram](./diagrams/uc-04-venue-discovery/uc-04-statediagram.puml)  
**Sequence Diagram:** [UC-04 Sequence](./diagrams/uc-04-venue-discovery/uc-04-sequence.puml)  
**Backend Classes:** [UC-04 Backend Classes](./diagrams/uc-04-venue-discovery/uc-04-class-backend.puml)  
**Frontend Classes:** [UC-04 Frontend Classes](./diagrams/uc-04-venue-discovery/uc-04-class-frontend.puml)

| Field | Description |
| :---- | :---- |
| Primary Actor | Player |
| Secondary Actors | Venue Owner |
| Description | Player searches public approved venues by sport and Hanoi ward/commune, views venue details, and contacts venue owner directly. |
| Trigger | Player wants to find a sport venue. |
| Preconditions | Venue must be approved and active. |
| Postconditions | Player obtains contact information or starts a direct chat with the venue owner. |
| Normal Flow | 1. Player opens venue search. 2. Player filters by sport and area. 3. System displays approved venues. 4. Player opens venue detail. 5. Player uses contact information or chat to communicate. |
| Exceptions | E1: No venue matches filters. |
| Priority | Must |

#### 2.2.5 UC-05 - Create Match and Manage Join Requests

**Use Case Diagram:** [UC-05 Use Case](./diagrams/uc-05-matchmaking/uc-05-use-case.puml)  
**Screen Flow:** [UC-05 Screen Flow](./diagrams/uc-05-matchmaking/uc-05-screenflow.puml)  
**State Diagram:** [UC-05 State Diagram](./diagrams/uc-05-matchmaking/uc-05-statediagram.puml)  
**Sequence Diagram:** [UC-05 Sequence](./diagrams/uc-05-matchmaking/uc-05-sequence.puml)  
**Backend Classes:** [UC-05 Backend Classes](./diagrams/uc-05-matchmaking/uc-05-class-backend.puml)  
**Frontend Classes:** [UC-05 Frontend Classes](./diagrams/uc-05-matchmaking/uc-05-class-frontend.puml)

| Field | Description |
| :---- | :---- |
| Primary Actor | Player |
| Description | Player creates an open match with sport, area, time, required number of players, expected level, and description. Other players request to join; match owner approves or rejects requests. |
| Trigger | Player wants to find teammates/opponents. |
| Preconditions | Player is authenticated and has a profile. |
| Postconditions | Match is created, join requests are handled, and approved participants can communicate. |
| Normal Flow | 1. Match owner creates match. 2. Other players browse matching open matches. 3. Player sends join request. 4. System notifies match owner. 5. Match owner approves or rejects. 6. System notifies requester. |
| Alternative Flows | A1: Match owner closes/cancels match. A2: Match is full after approval. |
| Exceptions | E1: Player requests to join own match. E2: Player already has pending/approved request. |
| Priority | Must |

#### 2.2.6 UC-06 - Community Posts

**Use Case Diagram:** [UC-06 Use Case](./diagrams/uc-06-community/uc-06-use-case.puml)  
**Screen Flow:** [UC-06 Screen Flow](./diagrams/uc-06-community/uc-06-screenflow.puml)  
**State Diagram:** [UC-06 State Diagram](./diagrams/uc-06-community/uc-06-statediagram.puml)  
**Sequence Diagram:** [UC-06 Sequence](./diagrams/uc-06-community/uc-06-sequence.puml)  
**Backend Classes:** [UC-06 Backend Classes](./diagrams/uc-06-community/uc-06-class-backend.puml)  
**Frontend Classes:** [UC-06 Frontend Classes](./diagrams/uc-06-community/uc-06-class-frontend.puml)

| Field | Description |
| :---- | :---- |
| Primary Actor | Player |
| Secondary Actors | Admin |
| Description | Player creates community posts tagged by sport so other players can discuss advice, equipment, events, venue experiences, and general sport topics. |
| Trigger | Player wants to discuss a sport topic with the community. |
| Preconditions | Player is authenticated. |
| Postconditions | Post is submitted for approval, approved by Admin, edited/deleted by owner, or deleted by Admin. |
| Normal Flow | 1. Player opens community. 2. Player writes post with title, content, sport tag, post type, and optional area context. 3. System stores the post as pending approval. 4. Admin approves the post. 5. Other players read and comment on approved posts. |
| Exceptions | E1: Admin deletes a pending or approved post. |
| Priority | Should |

#### 2.2.7 UC-07 - Admin Moderation and Configuration

**Use Case Diagram:** [UC-07 Use Case](./diagrams/uc-07-admin/uc-07-use-case.puml)  
**Screen Flow:** [UC-07 Screen Flow](./diagrams/uc-07-admin/uc-07-screenflow.puml)  
**State Diagram:** [UC-07 State Diagram](./diagrams/uc-07-admin/uc-07-statediagram.puml)  
**Sequence Diagram:** [UC-07 Sequence](./diagrams/uc-07-admin/uc-07-sequence.puml)  
**Backend Classes:** [UC-07 Backend Classes](./diagrams/uc-07-admin/uc-07-class-backend.puml)  
**Frontend Classes:** [UC-07 Frontend Classes](./diagrams/uc-07-admin/uc-07-class-frontend.puml)

| Field | Description |
| :---- | :---- |
| Primary Actor | Admin |
| Description | Admin manages player accounts, venue owner accounts, venue approval/rejection/locking, community moderation, homepage/content visibility, dashboard statistics, sports, areas, and skill-level configuration. |
| Trigger | Admin performs operational management. |
| Preconditions | Admin is authenticated with admin role. |
| Postconditions | System data/configuration/content status is updated. |
| Normal Flow | 1. Admin opens dashboard. 2. Admin selects management area. 3. Admin reviews records. 4. Admin updates status/configuration/content. 5. System saves changes. |
| Exceptions | E1: Admin action conflicts with already deleted/changed record. |
| Priority | Must |

#### 2.2.8 UC-08 - In-App Match Notifications

**Use Case Diagram:** [UC-08 Use Case](./diagrams/uc-08-notification/uc-08-use-case.puml)  
**Screen Flow:** [UC-08 Screen Flow](./diagrams/uc-08-notification/uc-08-screenflow.puml)  
**State Diagram:** [UC-08 State Diagram](./diagrams/uc-08-notification/uc-08-statediagram.puml)  
**Sequence Diagram:** [UC-08 Sequence](./diagrams/uc-08-notification/uc-08-sequence.puml)  
**Backend Classes:** [UC-08 Backend Classes](./diagrams/uc-08-notification/uc-08-class-backend.puml)  
**Frontend Classes:** [UC-08 Frontend Classes](./diagrams/uc-08-notification/uc-08-class-frontend.puml)

| Field | Description |
| :---- | :---- |
| Primary Actor | Player |
| Description | System creates in-app notifications only when a player requests to join a match and when the match owner approves or rejects the request. |
| Trigger | Match join request is created or resolved. |
| Preconditions | Related match and users exist. |
| Postconditions | Recipient can view unread/read notification in the web app. |
| Normal Flow | 1. Event occurs. 2. System creates notification. 3. Recipient opens notification list. 4. Recipient marks notification as read by viewing it. |
| Exceptions | E1: Recipient account is inactive; notification is not shown. |
| Priority | Must |

---

## 3. Software Features

### 3.1 Functional Overview

#### 3.1.1 System Screen Flow

See: [Screen Flow Diagram](./diagrams/screen-flow.puml)

#### 3.1.2 Entity Relationship Diagram

See: [Entity Relationship Diagram](./diagrams/entity-relationship.puml)

#### 3.1.3 Screen Descriptions

| # | Screen | Primary Users | Description |
| :---- | :---- | :---- | :---- |
| 1 | Landing/Public Home | Guest, Player | Public entry point and access to login/register. |
| 2 | Register | Guest | Email/password registration with role selection. |
| 3 | Email Verification Result | Guest | Confirms account activation or shows invalid/expired link. |
| 4 | Login | Guest | Authenticates by email and password. |
| 5 | Forgot/Reset Password | Guest | Sends reset link and allows setting a new password. |
| 6 | Player Profile | Player | Manages sport profile, area, levels, availability, and contact info. |
| 7 | Venue Search | Player | Searches approved venues by sport and ward/commune. |
| 8 | Venue Detail | Player | Displays venue information and direct contact entry points. |
| 9 | Match List | Player | Browses open matches by sport, area, time, and level. |
| 10 | Match Detail | Player | Shows match info and join request status. |
| 11 | Create/Edit Match | Player | Creates or updates open match information. |
| 12 | Community Feed | Player | Displays approved posts by title, sport, type, and optional area; Player can also view own pending/approved posts. |
| 13 | Community Post Detail | Player | Shows post title, content, comments, and moderation status when owner/admin views it. |
| 14 | Venue Owner Dashboard | Venue Owner | Manages venue listings and basic statistics. |
| 15 | Venue Form | Venue Owner | Creates/updates venue information. |
| 16 | Admin Dashboard | Admin | Shows system overview statistics. |
| 17 | Admin User Management | Admin | Manages player and venue owner accounts. |
| 18 | Admin Venue Approval | Admin | Reviews, approves, rejects, locks, or hides venues. |
| 19 | Admin Community Moderation | Admin | Reviews, approves, and deletes community posts. |
| 20 | Admin Configuration | Admin | Configures sports, skill levels, and Hanoi wards/communes. |
| 21 | Notification Center | Player | Shows in-app match join request notifications. |

#### 3.1.4 Screen Authorization

| # | Screen | Guest | Player | Venue Owner | Admin |
| :---- | :---- | :---: | :---: | :---: | :---: |
| 1 | Landing/Public Home | X | X | X | X |
| 2 | Register/Login/Forgot Password | X |  |  |  |
| 3 | Player Profile |  | X |  |  |
| 4 | Venue Search/Detail |  | X | X | X |
| 5 | Match List/Detail/Create |  | X |  | X |
| 6 | Community Feed/Post |  | X |  | X |
| 7 | Venue Owner Dashboard/Form |  |  | X | X |
| 8 | Admin Dashboard |  |  |  | X |
| 9 | Admin User/Venue/Community/Config |  |  |  | X |
| 10 | Notification Center |  | X |  |  |

### 3.2 Feature Details

#### F01 - Authentication and Account Verification

| Item | Description |
| :---- | :---- |
| Feature ID | F01 |
| Priority | Must |
| Actors | Guest, Player, Venue Owner, Admin |
| Description | Provides email/password registration, email verification link, login, logout, and password reset link. |

Functional Requirements:

- FR-F01-01: The system shall allow Guest users to register with email and password.
- FR-F01-02: The system shall require users to select either Player or Venue Owner during public registration.
- FR-F01-03: The system shall send an email verification link after registration.
- FR-F01-04: The system shall prevent unverified users from accessing authenticated features.
- FR-F01-05: The system shall allow users to log in with email and password after verification.
- FR-F01-06: The system shall allow users to request a password reset link by email.
- FR-F01-07: The system shall allow Admin accounts to be created/managed internally, not through public registration.

#### F02 - Player Sport Profile

| Item | Description |
| :---- | :---- |
| Feature ID | F02 |
| Priority | Must |
| Actor | Player |
| Description | Allows Player to complete and update sport profile. |

Functional Requirements:

- FR-F02-01: The system shall allow Player to manage display name and avatar.
- FR-F02-07: The system shall accept Player avatar uploads as JPG, PNG, or WEBP up to 2MB.
- FR-F02-02: The system shall allow Player to select a Hanoi ward/commune.
- FR-F02-03: The system shall allow Player to select interested sports.
- FR-F02-04: The system shall allow Player to select configured skill level for each sport.
- FR-F02-05: The system shall allow Player to enter introduction, regular available time, and in-app contact information.
- FR-F02-06: The system shall use Player profile data for search, match, and community filtering.

#### F03 - Venue Listing Management

| Item | Description |
| :---- | :---- |
| Feature ID | F03 |
| Priority | Must |
| Actor | Venue Owner |
| Description | Allows Venue Owner to create and manage sport venue listings. |

Functional Requirements:

- FR-F03-01: The system shall allow Venue Owner to create venue listing with name, supported sports, detailed address, ward/commune, description, images, opening hours, reference price, and contact information.
- FR-F03-02: The system shall set new or updated venue listing status to Pending Approval.
- FR-F03-03: The system shall show approval status and rejection reason to Venue Owner.
- FR-F03-04: The system shall allow Venue Owner to edit venue information.
- FR-F03-05: The system shall display basic venue statistics such as view count or contact interactions where available.
- FR-F03-06: The system shall accept up to 5 venue images as JPG, PNG, or WEBP, with each image up to 5MB.

#### F04 - Venue Discovery and Direct Contact

| Item | Description |
| :---- | :---- |
| Feature ID | F04 |
| Priority | Must |
| Actor | Player |
| Description | Allows Player to find approved venues and contact owners directly. |

Functional Requirements:

- FR-F04-01: The system shall allow Player to search venues by sport and ward/commune.
- FR-F04-02: The system shall display only approved and active venues publicly.
- FR-F04-03: The system shall show venue details, images, address, opening hours, price reference, and contact information.
- FR-F04-04: The system shall allow Player to contact Venue Owner directly through displayed contact information or in-app chat.
- FR-F04-05: The system shall not process payment for venue usage.

#### F05 - Match Creation and Join Requests

| Item | Description |
| :---- | :---- |
| Feature ID | F05 |
| Priority | Must |
| Actor | Player |
| Description | Allows Player to create open matches and manage join requests. |

Functional Requirements:

- FR-F05-01: The system shall allow Player to create match with sport, ward/commune, time, required player count, expected skill level, and description.
- FR-F05-02: The system shall allow Player to browse open matches by sport, area, time, and level.
- FR-F05-03: The system shall allow Player to request to join a match.
- FR-F05-04: The system shall notify match owner when another player requests to join.
- FR-F05-05: The system shall allow match owner to approve or reject join requests.
- FR-F05-06: The system shall notify requester when request is approved or rejected.
- FR-F05-07: The system shall prevent duplicate join requests for the same match by the same Player.

#### F06 - Community Posts

| Item | Description |
| :---- | :---- |
| Feature ID | F06 |
| Priority | Should |
| Actor | Player |
| Description | Allows Player to post sport-tagged community discussion content. Match scheduling belongs to the Match feature, not community posts. |

Functional Requirements:

- FR-F06-01: The system shall allow Player to create community posts.
- FR-F06-02: The system shall allow posts to include title, content, sport tag, post type, and optional ward/commune context.
- FR-F06-03: The system shall store newly created or edited posts as pending approval before they appear in the public feed.
- FR-F06-04: The system shall allow other Players to view and comment on approved posts.
- FR-F06-05: The system shall allow post owner to edit or delete own pending or approved post.
- FR-F06-06: The system shall allow Admin to approve or delete community posts.

#### F07 - Admin Management and Configuration

| Item | Description |
| :---- | :---- |
| Feature ID | F07 |
| Priority | Must |
| Actor | Admin |
| Description | Allows Admin to operate, configure, and moderate SportLife. |

Functional Requirements:

- FR-F07-01: The system shall allow Admin to manage Player accounts.
- FR-F07-02: The system shall allow Admin to manage Venue Owner accounts.
- FR-F07-03: The system shall allow Admin to approve or reject venue listings with rejection reason.
- FR-F07-04: The system shall allow Admin to lock or hide approved venues that violate rules.
- FR-F07-05: The system shall allow Admin to manage community content approval and deletion.
- FR-F07-06: The system shall allow Admin to manage displayed system content.
- FR-F07-07: The system shall provide Admin dashboard statistics.
- FR-F07-08: The system shall allow Admin to configure sports, Hanoi wards/communes, and per-sport skill levels.

#### F08 - In-App Notifications

| Item | Description |
| :---- | :---- |
| Feature ID | F08 |
| Priority | Must |
| Actor | Player |
| Description | Provides limited in-app notifications for match join request events. |

Functional Requirements:

- FR-F08-01: The system shall create an in-app notification when a Player requests to join a match.
- FR-F08-02: The system shall create an in-app notification when match owner approves a join request.
- FR-F08-03: The system shall create an in-app notification when match owner rejects a join request.
- FR-F08-04: The system shall allow recipient to view unread and read notifications.

### 3.3 Business Rules

| Rule ID | Rule |
| :---- | :---- |
| BR-01 | Public registration supports only Player and Venue Owner roles. |
| BR-02 | Admin accounts are not self-registered publicly. |
| BR-03 | New accounts must verify email before using authenticated features. |
| BR-04 | Initial configured sports are Billiard, Badminton, and Pickleball. |
| BR-05 | Sport and skill level values are configurable by Admin. |
| BR-06 | SportLife v1.0.0 supports Hanoi ward/commune selection only. |
| BR-07 | Venue listing is public only when Approved and Active. |
| BR-08 | Rejected venue listing must include a rejection reason visible to Venue Owner. |
| BR-09 | Player cannot request to join their own match. |
| BR-10 | Player cannot submit duplicate join requests for the same match. |
| BR-11 | Match owner can approve or reject join requests. |
| BR-12 | Community is post-based discussion; match scheduling by time/location belongs to the Match feature and is not duplicated in community posts. |
| BR-13 | Payment and financial settlement are not handled by SportLife. |
| BR-14 | Rating/review functions are excluded from v1.0.0. |
| BR-15 | Uploaded image binaries are stored outside PostgreSQL; PostgreSQL stores image URLs only. |

### 3.4 Data Entities

| Entity | Key Fields | Relationships |
| :---- | :---- | :---- |
| User | id, email, password_hash, role, email_verified, status | One user may have one PlayerProfile or one VenueOwnerProfile. |
| PlayerProfile | user_id, display_name, avatar_url, area_id, introduction, availability, contact_info | Belongs to User; has many PlayerSportLevels. |
| VenueOwnerProfile | user_id, business_name, contact_info | Belongs to User; owns many Venues. |
| Sport | id, name, status | Used by profiles, venues, matches, posts, and levels. |
| SkillLevel | id, sport_id, name, order, status | Configured by Admin per sport. |
| Area | id, name, type, city, status | Hanoi ward/commune used by users, venues, matches, posts. |
| Venue | id, owner_id, name, address, area_id, description, opening_hours, reference_price, contact_info, approval_status, visibility_status | Belongs to owner and area; supports many sports and images. |
| Match | id, owner_id, sport_id, area_id, time, required_players, expected_level_id, status, description | Created by Player; has many join requests. |
| MatchJoinRequest | id, match_id, requester_id, status | Belongs to Match and requester. |
| CommunityPost | id, author_id, sport_id, post_type, area_id, title, content, status | Created by Player; has many comments. Area is optional context; match time/location fields are excluded. |
| Comment | id, post_id, author_id, content, status | Belongs to post and author. |
| Notification | id, recipient_id, type, reference_id, read_at | Created from match join events. |

---

## 4. Non-Functional Requirements

### 4.1 Security Requirements

- NFR-SEC-01: The system shall authenticate users using email and password.
- NFR-SEC-02: The system shall verify email ownership through verification link before enabling authenticated features.
- NFR-SEC-03: The system shall protect passwords using secure one-way hashing.
- NFR-SEC-04: The system shall authorize access by role: Player, Venue Owner, Admin.
- NFR-SEC-05: The system shall prevent users from accessing or modifying resources they do not own unless they have Admin permission.
- NFR-SEC-06: The system shall protect personal data such as email, contact information, location preference, and profile data.

### 4.2 Usability and Availability Requirements

- NFR-USE-01: The web application shall support responsive layouts for desktop and mobile browsers.
- NFR-USE-02: A new Player shall be able to complete a basic sport profile through a guided form.
- NFR-USE-03: A Player shall be able to create a match through a concise form using configured sports, areas, and levels.
- NFR-USE-04: Search and filtering controls shall use recognizable category, sport, level, and area selectors.

### 4.3 Maintainability and Extensibility Requirements

- NFR-EXT-01: Admin shall be able to configure sports without code changes.
- NFR-EXT-02: Admin shall be able to configure skill levels per sport without code changes.
- NFR-EXT-03: Admin shall be able to configure supported Hanoi ward/commune areas.
- NFR-EXT-04: System design shall keep venue, match, community, and admin modules logically separated.

---

## 5. Recommended Implementation Tech Stack (Non-Binding)

This section records a recommended implementation stack to guide development planning. It does not change functional scope.

### 5.1 Selected Stack (Recommendation #1)

**Frontend + Backend-for-Frontend (BFF)**

- Next.js (App Router) + TypeScript
- UI: Tailwind CSS (optionally a component kit such as shadcn/ui for consistent forms and dashboards)
- Data fetching: server-first where appropriate (Server Actions / Route Handlers) and client caching for lists/filters where needed

**API Style**

- REST-style endpoints via Next.js Route Handlers
- OpenAPI documentation for core endpoints (auth, venues, matches, admin configuration)

**Data Layer**

- Database: PostgreSQL
- ORM + migrations: Prisma

**Authentication and Authorization**

- Email/password authentication with role-based access control (Guest/Player/Venue Owner/Admin)
- Auth framework: Auth.js (NextAuth)
- Email verification and password reset implemented via time-limited token links (UC-01)

**Email Delivery**

- Transactional email provider (e.g., Resend or SendGrid) for verification and reset links

**File Storage (Images)**

- Object storage (S3-compatible such as AWS S3 / Cloudflare R2 / MinIO)
- Store image URLs in the database; do not store large image blobs in the database

**Testing**

- E2E: Playwright for critical flows (register/verify/login, venue approval, match join requests, admin moderation)
- Unit/integration testing for business rules and authorization boundaries

**Deployment**

- Local/dev: Docker (including PostgreSQL) for reproducible environments
- CI/CD: GitHub Actions (lint/test/build)
- Hosting: Vercel for the Next.js web app, or a Docker-based deployment on a VPS/cloud as needed

### 5.2 Rationale (Summary)

- Fits a web-first product with multiple roles, dashboards, and forms (Section 3.1.3).
- Supports strong security requirements (Section 4.1) via centralized RBAC and consistent API patterns.
- Matches the need for configurable sports/areas/skill levels without code changes (NFR-EXT-01/02/03) through admin CRUD + migrations.
- Keeps UC-08 in-app notifications simple (DB-backed notification center) without requiring push infrastructure.

---

## 5. Interface Requirements

### 5.1 User Interface Requirements

| UI Area | Requirement |
| :---- | :---- |
| Authentication | Register, verify email result, login, forgot password, reset password. |
| Player | Profile, venue search, match list/detail/form, community feed/post/detail, notification center. |
| Venue Owner | Venue owner dashboard, venue listing form, venue status view, basic statistics. |
| Admin | Dashboard, user management, venue approval, community moderation, category/area/level configuration. |

### 5.2 External Interface Requirements

| External System | Purpose | Interface |
| :---- | :---- | :---- |
| Email Service | Send verification and password reset links. | Email API/SMTP, implementation TBD. |

### 5.3 Notification Requirements

| Event | Recipient | Channel |
| :---- | :---- | :---- |
| Player requests to join match | Match owner | In-app only |
| Match owner approves request | Requester | In-app only |
| Match owner rejects request | Requester | In-app only |

---

## 6. Acceptance Criteria

| ID | Criteria |
| :---- | :---- |
| AC-01 | User can register as Player or Venue Owner and verify email by link. |
| AC-02 | User can reset password by email link. |
| AC-03 | Player can complete sport profile using Admin-configured sports, levels, and Hanoi ward/commune. |
| AC-04 | Venue Owner can submit venue listing and see approval status. |
| AC-05 | Admin can approve, reject with reason, lock, or hide venue listings. |
| AC-06 | Player can search approved venues by sport and ward/commune and contact owner directly. |
| AC-07 | Player can create match and manage join requests. |
| AC-08 | Player receives in-app notifications for match join request, approval, and rejection. |
| AC-09 | Player can create, edit, delete own pending/approved community posts and comment on approved posts. |
| AC-10 | Admin can approve or delete community posts. |
| AC-11 | Payment and rating/review functions are absent from v1.0.0. |

---

## 7. Open Questions

| # | Question | Status | Notes |
| :---- | :---- | :---- | :---- |
| 1 | Exact email service provider | TBD | Required during SDD/implementation planning. |
| 2 | Exact list of Hanoi wards/communes | TBD | Admin-configured data source to be decided. |
| 3 | Chat scope and storage policy | TBD | User requested chat/contact; detailed chat behavior can be refined in SDD. |

---

## 8. Quality Checklist

| Checklist Item | Status |
| :---- | :---- |
| Actors identified | Complete |
| Use cases described | Complete |
| Functional requirements documented | Complete |
| Non-functional requirements documented | Complete |
| Business rules documented | Complete |
| PlantUML diagrams linked externally | Complete |
| Each use case has a separate diagram folder | Complete |
| Stakeholder review | Pending |
