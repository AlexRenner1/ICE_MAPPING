# 🛠️ Complete Setup Guide - Step by Step

This guide will walk you through every single step to get Protest Tracker running. No prior experience required!

---

## 📋 Table of Contents

1. [Prerequisites](#-1-prerequisites)
2. [Download the Project](#-2-download-the-project)
3. [Firebase Setup](#-3-firebase-setup-15-minutes)
4. [Roboflow Setup](#-4-roboflow-setup-5-minutes)
5. [Google Maps Setup](#-5-google-maps-setup-10-minutes)
6. [Configure Environment Variables](#-6-configure-environment-variables)
7. [Run Locally](#-7-run-locally)
8. [Deploy to the Internet](#-8-deploy-to-the-internet)
9. [Troubleshooting](#-9-troubleshooting)

---

## 📦 1. Prerequisites

Before starting, make sure you have:

### Install Node.js

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version (recommended)
3. Run the installer and follow the prompts
4. Verify installation by opening a terminal/command prompt and typing:
   ```bash
   node --version
   ```
   You should see something like `v18.17.0` or higher.

### Install a Code Editor (Optional but Recommended)

- Download [Visual Studio Code](https://code.visualstudio.com/) - it's free!

---

## 📥 2. Download the Project

### Option A: Download ZIP (Easiest)

1. Go to the GitHub repository page
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Extract the ZIP file to a folder on your computer
5. Open a terminal/command prompt in that folder

### Option B: Using Git

```bash
git clone https://github.com/yourusername/protest-tracker.git
cd protest-tracker
```

### Install Dependencies

In your terminal, inside the project folder, run:

```bash
npm install
```

Wait for it to complete (may take 1-2 minutes).

---

## 🔥 3. Firebase Setup (15 minutes)

Firebase provides the database and authentication for the app.

### Step 3.1: Create a Google Account

If you don't have one, create a Google account at [accounts.google.com](https://accounts.google.com)

### Step 3.2: Go to Firebase Console

1. Open your browser
2. Go to **[https://console.firebase.google.com](https://console.firebase.google.com)**
3. Click **"Sign in"** and use your Google account

### Step 3.3: Create a New Project

1. Click **"Create a project"** (or "Add project")
   
2. **Enter a project name:**
   - Type something like `my-protest-tracker`
   - Firebase will show a project ID below (e.g., `my-protest-tracker-abc123`)
   - Click **"Continue"**

3. **Google Analytics:**
   - Toggle OFF "Enable Google Analytics" (simplifies setup)
   - Click **"Create project"**

4. Wait 30 seconds for the project to be created
5. Click **"Continue"** when ready

### Step 3.4: Add a Web App

1. On the project dashboard, look for the icons near "Get started by adding Firebase to your app"
2. Click the **Web icon** `</>`

3. **Register app:**
   - App nickname: `protest-tracker-web`
   - ✅ Check the box **"Also set up Firebase Hosting"**
   - Click **"Register app"**

4. **IMPORTANT - Copy the Config:**
   You'll see a code block like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyB1234567890abcdefg",
     authDomain: "my-protest-tracker.firebaseapp.com",
     projectId: "my-protest-tracker",
     storageBucket: "my-protest-tracker.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```
   
   **Keep this page open or copy these values to a notepad - you'll need them later!**

5. Click **"Next"** through the remaining steps
6. Click **"Continue to console"**

### Step 3.5: Enable Anonymous Authentication

1. In the left sidebar, click **"Build"** to expand it
2. Click **"Authentication"**
3. Click **"Get started"**
4. Click the **"Sign-in method"** tab
5. Scroll down and click **"Anonymous"**
6. Click the toggle to **Enable** it
7. Click **"Save"**

✅ You should see "Anonymous" listed as "Enabled"

### Step 3.6: Create Firestore Database

1. In the left sidebar, click **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"**
   - ⚠️ This is for development only. See Security section for production.
4. Click **"Next"**
5. Choose a **Cloud Firestore location:**
   - Pick the region closest to your users
   - Example: `us-central1` for USA, `europe-west1` for Europe
6. Click **"Enable"**
7. Wait for the database to be created

✅ You should see an empty database interface

---

## 🤖 4. Roboflow Setup (5 minutes)

Roboflow provides the AI object detection.

### Step 4.1: Create a Roboflow Account

1. Go to **[https://app.roboflow.com](https://app.roboflow.com)**
2. Click **"Sign Up"**
3. You can sign up with Google, GitHub, or email
4. Complete the registration

### Step 4.2: Get Your API Key

1. After logging in, click your **profile icon** (top right corner)
2. Click **"Settings"**
3. In the left sidebar, click **"API Keys"** (under Roboflow API)
4. You'll see your **Private API Key**
5. Click **"Copy"** to copy it

**Save this key - you'll need it later!**

Example: `rf_abc123XYZ789...`

### Step 4.3: About the Detection Model

This project uses a **public model** that's already trained:

- **Model ID:** `fmy-first-project-ulnpd`
- **Version:** `1`

You don't need to do anything else - the model is public and works with any Roboflow API key!

**Want to use your own model?** See the "Custom Model" section at the end of this guide.

---

## 🗺️ 5. Google Maps Setup (10 minutes)

Google Maps displays the map and pins.

### Step 5.1: Go to Google Cloud Console

1. Go to **[https://console.cloud.google.com](https://console.cloud.google.com)**
2. Sign in with your Google account
3. Accept the terms of service if prompted

### Step 5.2: Create a Project

1. Click the project dropdown at the top (might say "Select a project")
2. Click **"NEW PROJECT"** (top right of the popup)
3. **Project name:** `protest-tracker-maps`
4. Click **"Create"**
5. Wait a few seconds for it to be created
6. Make sure this project is selected in the dropdown

### Step 5.3: Enable the Maps JavaScript API

1. In the search bar at the top, type **"Maps JavaScript API"**
2. Click on **"Maps JavaScript API"** in the results
3. Click the blue **"Enable"** button
4. Wait for it to be enabled

### Step 5.4: Create an API Key

1. In the left sidebar, click **"APIs & Services"**
2. Click **"Credentials"**
3. Click **"+ CREATE CREDENTIALS"** at the top
4. Select **"API key"**
5. A popup will show your new API key
6. Click **"Copy"** to copy it

**Save this key - you'll need it later!**

Example: `AIzaSyB1234567890abcdefghijklmnop`

### Step 5.5: Restrict Your API Key (Recommended)

To prevent others from using your key:

1. Click **"EDIT API KEY"** in the popup (or click on the key name in the list)
2. Under **"Application restrictions":**
   - Select **"HTTP referrers (web sites)"**
   - Click **"ADD"**
   - Add: `localhost:*`
   - Click **"ADD"** again
   - Add: `*.web.app/*`
   - Add: `*.firebaseapp.com/*`
3. Under **"API restrictions":**
   - Select **"Restrict key"**
   - Check **"Maps JavaScript API"**
4. Click **"Save"**

### Step 5.6: Enable Billing (Required by Google)

Google Maps requires a billing account, but offers $200 free credit monthly (more than enough for this app).

1. Go to **[https://console.cloud.google.com/billing](https://console.cloud.google.com/billing)**
2. Click **"Link a billing account"** or **"Create account"**
3. Follow the steps to add a payment method
4. Link it to your project

⚠️ **Don't worry:** The free tier is very generous. You won't be charged unless you exceed ~28,000 map loads per month.

---

## ⚙️ 6. Configure Environment Variables

Now let's put all those keys together!

### Step 6.1: Create the .env File

1. In your project folder, find the file **`.env.example`**
2. Make a copy of it and name it **`.env`**
   
   **On Mac/Linux:**
   ```bash
   cp .env.example .env
   ```
   
   **On Windows (Command Prompt):**
   ```bash
   copy .env.example .env
   ```
   
   **Or:** Just copy the file manually in your file explorer and rename it.

### Step 6.2: Fill in Your Keys

Open the `.env` file in a text editor (like VS Code or Notepad) and fill in each value:

```env
# -----------------------------
# FIREBASE CONFIGURATION
# -----------------------------
# Get these from Step 3.4 - the firebaseConfig object

VITE_FIREBASE_API_KEY=AIzaSyB1234567890abcdefg
VITE_FIREBASE_AUTH_DOMAIN=my-protest-tracker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-protest-tracker
VITE_FIREBASE_STORAGE_BUCKET=my-protest-tracker.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# -----------------------------
# ROBOFLOW CONFIGURATION
# -----------------------------
# Get your API key from Step 4.2

VITE_ROBOFLOW_API_KEY=rf_abc123XYZ789
VITE_ROBOFLOW_MODEL_ID=fmy-first-project-ulnpd
VITE_ROBOFLOW_MODEL_VERSION=1

# -----------------------------
# GOOGLE MAPS CONFIGURATION
# -----------------------------
# Get your API key from Step 5.4

VITE_GOOGLE_MAPS_API_KEY=AIzaSyB1234567890abcdefghijklmnop
```

### Step 6.3: Save the File

Save the `.env` file. Make sure it's in the root of your project folder (same level as `package.json`).

---

## 🚀 7. Run Locally

Let's test the app on your computer!

### Step 7.1: Start the Development Server

In your terminal, in the project folder, run:

```bash
npm run dev
```

You should see output like:
```
  VITE v6.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

### Step 7.2: Open in Browser

1. Open your web browser
2. Go to **http://localhost:5173**
3. You should see the app loading!

### Step 7.3: Test the Features

1. **Allow Location:** Click "Allow" when the browser asks for location permission
2. **Allow Camera:** Click "Open Camera" and allow camera access
3. **Test Detection:** Point at something and click "Capture & Analyze"
4. **Check Map:** Click "Map" to see any pins

### Step 7.4: Stop the Server

When you're done testing, press `Ctrl + C` in the terminal to stop the server.

---

## 🌐 8. Deploy to the Internet

Make your app available to everyone!

### Step 8.1: Install Firebase CLI

Run this command in your terminal:

```bash
npm install -g firebase-tools
```

### Step 8.2: Login to Firebase

```bash
firebase login
```

1. A browser window will open
2. Sign in with the same Google account you used for Firebase
3. Click "Allow" to grant permissions
4. Return to your terminal

### Step 8.3: Configure Firebase Project

1. Copy the example file:
   ```bash
   cp .firebaserc.example .firebaserc
   ```

2. Open `.firebaserc` in a text editor

3. Replace `your-firebase-project-id` with your actual project ID:
   ```json
   {
     "projects": {
       "default": "my-protest-tracker"
     }
   }
   ```

### Step 8.4: Build and Deploy

Run this single command:

```bash
npm run deploy
```

Or run the steps separately:

```bash
npm run build
firebase deploy
```

Wait for it to complete (1-2 minutes).

### Step 8.5: Access Your Live App!

When deployment is complete, you'll see:

```
✔  Deploy complete!

Hosting URL: https://my-protest-tracker.web.app
```

🎉 **Congratulations!** Your app is now live at that URL!

---

## 🔧 9. Troubleshooting

### "npm: command not found"

Node.js isn't installed correctly. Reinstall it from [nodejs.org](https://nodejs.org).

### "Module not found" errors

Run `npm install` again in the project folder.

### "Firebase: Error (auth/operation-not-allowed)"

Anonymous authentication isn't enabled. Go back to Step 3.5.

### "Google Maps failed to load"

- Check your API key is correct in `.env`
- Make sure Maps JavaScript API is enabled (Step 5.3)
- Make sure billing is enabled (Step 5.6)

### "Roboflow detection failed"

- Check your API key is correct in `.env`
- Make sure you copied the full key (starts with `rf_`)

### Camera not working

- Make sure you're using `localhost` or `https://` (camera requires secure context)
- Check browser permissions (click the lock icon in the address bar)
- Try a different browser

### "Firebase deployment failed"

- Make sure you're logged in: `firebase login`
- Make sure `.firebaserc` has the correct project ID
- Run `firebase use your-project-id` to switch projects

### Changes not appearing

- Clear your browser cache
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

---

## 🎨 Optional: Use Your Own AI Model

Want to detect different objects? Train your own model!

### Train a Custom Model on Roboflow

1. Go to [app.roboflow.com](https://app.roboflow.com)
2. Create a **New Project**
3. Choose **Object Detection**
4. Upload images
5. Annotate objects (draw boxes around them)
6. Click **Generate** → **Train**
7. Wait for training to complete
8. Click **Deploy** → **Hosted API**

### Get Your Model Details

From the deploy page, find:
- **Model ID:** Something like `my-custom-model`
- **Version:** Usually `1`

### Update Environment Variables

In your `.env` file, change:

```env
VITE_ROBOFLOW_MODEL_ID=my-custom-model
VITE_ROBOFLOW_MODEL_VERSION=1
```

Restart your development server and test!

---

## 📞 Need Help?

- **Open an issue** on GitHub
- Check [Firebase Documentation](https://firebase.google.com/docs)
- Check [Roboflow Documentation](https://docs.roboflow.com)
- Check [Google Maps Documentation](https://developers.google.com/maps/documentation)

---

**Happy tracking! 🗺️**
