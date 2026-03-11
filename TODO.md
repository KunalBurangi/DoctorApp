# Doctor App - Task Tracker

## Phase 1: Planning & Setup
- [x] Finalize Technology Stack (React + Vite, TypeScript, IndexedDB for local storage)
- [x] Initialize the project repository
- [ ] Set up Tailwind CSS for styling
- [ ] Set up state management and local database (idb) architecture

## Phase 2: Core Data Models & Storage Service
- [ ] Create `Doctor` data model (id, name, specialization, contact, etc.)
- [ ] Create `DoctorImage` data model (id, doctorId, imageBase64/URI, etc.)
- [ ] Implement IndexedDB generic service for doctors and images

## Phase 3: Doctor Management
- [x] UI: Build "List of Doctors" screen using React Router
- [x] UI: Build "Add Doctor Details" form/dialog
- [x] Logic: Connect Add Doctor form to local database
- [x] Logic: Fetch and display doctors list from the database

## Phase 4: Doctor Details & Image Management
- [x] UI: Build "Doctor Details" screen (accessible by clicking a doctor)
- [x] Logic: Implement image picking functionality via `<input type="file" accept="image/*" />`
- [x] Logic: Save selected images to IndexedDB and associate them with the specific doctor
- [x] UI: Display a thumbnail grid of added images in the Doctor Details screen

## Phase 5: Presentation / Carousel Mode
- [x] UI: Build a Full-screen Image Carousel View component
- [x] Logic: Pass associated images to the Carousel View for the presentation
- [x] UX: Add keyboard bindings (Left/Right) and generic swipe interactions for navigation

## Phase 6: Platform Adjustments & Polish
- [x] Responsive UI adjustments specific to Tab/Desktop (Grid layouts, larger touch targets)
- [x] Final UI/UX styling, aesthetics, animations using Tailwind
