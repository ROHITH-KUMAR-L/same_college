<p align="center">
  <img src="public/Logo.jpeg" alt="Same College Logo" width="120" height="120" style="border-radius: 20px;" />
</p>

<h1 align="center">Same College</h1>

<p align="center">
  <strong>Your modern, intelligent academic companion and resource hub.</strong>
</p>

<p align="center">
  <a href="https://github.com/ROHITH-KUMAR-L/same_college/issues">🐛 Report Bug</a> &nbsp;·&nbsp;
  <a href="https://github.com/ROHITH-KUMAR-L/same_college/issues">💡 Request Feature</a>
</p>

<p align="center">
  <a href="https://github.com/ROHITH-KUMAR-L/same_college"><img src="https://img.shields.io/github/stars/ROHITH-KUMAR-L/same_college?style=for-the-badge&logo=github&color=yellow" alt="Stars" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License" /></a>
</p>

---

**Same College** is a premium, open-source academic management and resource platform designed to modernize the college experience for both students and faculty. It serves as a centralized hub for accessing study materials, previous year question papers, managing timetables, and simulating AI-based attendance — all wrapped in a beautifully crafted, glassmorphic UI.

## ✨ Key Features

| Feature | Description |
|---|---|
| 📚 **Universal Resource Access** | Browse notes and papers across all branches and syllabus schemes. |
| 📅 **Academic Timetable** | Clean, responsive timetable interface to track your daily lectures and labs. |
| 👨‍🏫 **Faculty Control Center** | Dedicated dashboard for faculty to manage classes, with a simulated AI automatic attendance scanner. |
| 🗂️ **Smart Workspace** | Personalized dashboard that tracks your favorites, downloads, and recently viewed materials. |
| 💾 **Persistent Preferences** | Automatically remembers your selected branch, syllabus, and semester. |
| 🛡️ **Admin Dashboard** | Robust management system for organizers to upload resources, manage users, and track system logs. |
| 💬 **Testimonial Engine** | Community-driven feedback system where students can share their academic journeys. |
| 🎨 **Modern UI/UX** | Premium aesthetic with glassmorphism, dynamic animations, and dark/light mode support. |
| 🔐 **Role-Based Access Control** | Environment-based security differentiating Admins, Faculty, and Students. |

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, React Router v7 |
| **Styling** | Vanilla CSS (Glassmorphism, Custom Animations) |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Backend / BaaS** | Firebase (Auth, Realtime Database, Hosting) |
| **Build Tool** | Vite 7 |
| **Linting** | ESLint 9 |

## 📂 Project Structure

```text
same_college/
├── public/              # Static assets (logo, favicon, manifest)
├── src/
│   ├── components/      # Reusable UI components (Navbar, Dock, Modals)
│   ├── context/         # React Context providers (Auth, Theme)
│   ├── hooks/           # Custom Hooks (Workspace, Stats)
│   ├── pages/           # Page components (Home, Notes, Timetable, Admin, Faculty)
│   ├── assets/          # App assets
│   ├── firebase.js      # Firebase configuration and initialization
│   ├── App.jsx          # Root application component with routing
│   └── main.jsx         # Entry point
├── .env                 # Environment variables (Firebase configs & Role Emails)
├── index.html           # HTML shell
├── vite.config.js       # Vite configuration
└── firebase.json        # Firebase hosting and database rules config
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)
- A Firebase project for Authentication and Realtime Database.

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ROHITH-KUMAR-L/same_college.git
cd same_college
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Environment Variables**
Create a `.env` file in the root directory and add your Firebase credentials and Role emails:
```env
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_auth_domain"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
VITE_FIREBASE_MEASUREMENT_ID="your_measurement_id"

VITE_ADMIN_EMAIL="admin@example.com"
VITE_FACULTY_EMAIL="faculty@example.com"
VITE_STUDENT_EMAIL="student@example.com"
```

4. **Start the development server**
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## 🤝 Contributing

We welcome contributions from the community! Whether you want to add new features, suggest improvements, or report bugs, your input is valuable.

1. **Fork** the repository
2. **Create** your feature branch — `git checkout -b feature/AmazingFeature`
3. **Commit** your changes — `git commit -m 'Add some AmazingFeature'`
4. **Push** to the branch — `git push origin feature/AmazingFeature`
5. **Open** a Pull Request

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
