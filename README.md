# 🗺️ Protest Tracker

DISCLAIMER: VIBECODED

A real-time, AI-powered mapping application that detects objects using your camera and displays them on a shared map.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vite](https://img.shields.io/badge/vite-6.x-purple.svg)
![Firebase](https://img.shields.io/badge/firebase-11.x-orange.svg)

---

## ✨ What Does It Do?

1. **📷 Capture** - Take a photo with your device camera
2. **🤖 Detect** - AI automatically identifies objects in the image
3. **📍 Map** - Detection pins appear on a real-time map
4. **🔄 Share** - All users see the same pins in real-time

### Features

- 📱 Works on mobile and desktop
- 🎨 Time-coded pins (red = recent, blue = old)
- 👥 Multi-user real-time synchronization
- 🔒 Anonymous authentication (no login required)
- 🌐 Deploy to your own domain

---

## 🚀 Quick Start (5 minutes if you have the keys)

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/protest-tracker.git
cd protest-tracker

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Edit .env and add your API keys (see SETUP.md for details)

# 5. Run the app
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 📖 Full Setup Guide

**New to this?** Follow the complete step-by-step guide:

### 👉 [**SETUP.md**](SETUP.md) - Detailed instructions with screenshots

The guide covers:
- ✅ Installing Node.js
- ✅ Creating a Firebase project
- ✅ Setting up Roboflow AI
- ✅ Getting Google Maps API key
- ✅ Running locally
- ✅ Deploying to the internet

---

## 🔑 What API Keys Do I Need?

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Firebase** | Database & authentication | ✅ Yes |
| **Roboflow** | AI object detection | ✅ Yes (1,000 calls/month) |
| **Google Maps** | Map display | ✅ Yes ($200 credit/month) |

**Total cost:** $0 for typical usage

---

## 📁 Project Structure

```
protest-tracker/
├── src/
│   └── main.js          # Main application logic
├── index.html           # Entry HTML file
├── .env.example         # Environment template (copy to .env)
├── .firebaserc.example  # Firebase config template
├── firebase.json        # Firebase hosting settings
├── firestore.rules      # Database security rules
├── vite.config.js       # Build configuration
├── package.json         # Dependencies
├── SETUP.md            # 📖 Detailed setup guide
└── README.md           # This file
```

---

## 🎯 Environment Variables

Create a `.env` file with these values:

```env
# Firebase (from Firebase Console)
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXX

# Roboflow (from Roboflow Settings)
VITE_ROBOFLOW_API_KEY=rf_xxxxx
VITE_ROBOFLOW_MODEL_ID=frenchpoliceunits-o2kkt
VITE_ROBOFLOW_MODEL_VERSION=1

# Google Maps (from Google Cloud Console)
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
```

---

## 🤖 About the AI Model

This project includes a **public detection model** hosted on Roboflow:

- **Model:** `frenchpoliceunits-o2kkt`
- **Version:** `1`

You can use this model with any Roboflow API key, or train your own custom model on [Roboflow](https://roboflow.com) and update the environment variables.

---

## 🚢 Deployment

```bash
# One-command deploy
npm run deploy
```

Or manually:

```bash
npm run build
firebase deploy
```

Your app will be live at: `https://your-project.web.app`

---

## 🔒 Security Notes

### Development Mode
The included `firestore.rules` uses test mode for easy development.

### Production Mode
Update `firestore.rules` before going live:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pins/{pinId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run deploy` | Build and deploy to Firebase |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ❓ Common Issues

| Problem | Solution |
|---------|----------|
| Firebase auth error | Enable Anonymous Auth in Firebase Console |
| Map not loading | Check Google Maps API key & billing |
| Camera not working | Use HTTPS or localhost |
| Detection failing | Verify Roboflow API key |

See [SETUP.md](SETUP.md) for detailed troubleshooting.

---

## 🙏 Built With

FUCKING AI THAT IS WHY IT IS FULL OF EMOJIS - FUCK AI

- [Vite](https://vitejs.dev/) - Build tool
- [Firebase](https://firebase.google.com/) - Backend services
- [Roboflow](https://roboflow.com/) - AI/ML platform
- [Google Maps](https://developers.google.com/maps) - Mapping

---

**Made with ❤️ for open source and hate for fascists**
