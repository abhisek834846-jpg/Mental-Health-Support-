# Digital Psychological Intervention System

A web-based platform for students’ mental health support.

## Features
- Authentication (Email/Password, Google OAuth)
- AI-guided First-Aid Chat
- Confidential Booking
- Resources Section
- Peer Forum (Prototype)
- Admin Dashboard

## Tech Stack
- Frontend: HTML, CSS, JavaScript (Vanilla)
- Backend/Database: Firebase Firestore
- Auth: Firebase Authentication
- Deployment: Firebase Hosting

## Setup Instructions
1. Clone the repo.
2. Add your Firebase config to `scripts/firebase-config.js`.
3. Deploy with Firebase Hosting.

## Firestore Example Schema
- `bookings`: { userId, counsellor, date, time, notes }
- `forum_posts`: { postId, content, timestamp, anonymous }
- `resources`: { type, title, url, description }
