# Acoof - Modern Menswear Store

This is a Next.js e-commerce application built with Firebase Studio. It features a complete shopping experience, including product listings, a shopping cart, and a secure checkout process with Razorpay.

## Final Steps for Live Deployment

Your application code is complete. To make your live application fully functional, you must add your secret keys to your GitHub repository so the deployment workflow can use them.

### 1. Go to GitHub Repository Settings

Navigate to your repository's secrets page. You can use this direct link:
[https://github.com/dhandesaurav52/Acoof/settings/secrets/actions](https://github.com/dhandesaurav52/Acoof/settings/secrets/actions)

### 2. Add Repository Secrets

You will need to create two secrets here. Click **"New repository secret"** for each one.

**A. Add Your Firebase Service Account Key:**

1.  If you don't have it, generate a new key from your [Firebase Project Settings](https://console.firebase.google.com/project/acoof-8e92d/settings/serviceaccounts/adminsdk) by clicking **"Generate new private key"**.
2.  Open the downloaded JSON file and copy its **entire contents**.
3.  In GitHub, create a new secret:
    *   **Name:** `FIREBASE_SERVICE_ACCOUNT_KEY` (must be this exact name)
    *   **Secret value:** Paste the entire contents of the JSON file here.
    *   Click **"Add secret"**.

**B. Add Your Razorpay Secret Key:**

1.  Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2.  Navigate to **Settings -> API Keys**.
3.  Generate a new **Live Key** if you haven't already.
4.  Copy the **Key Secret**.
5.  In GitHub, create another new secret:
    *   **Name:** `RAZORPAY_KEY_SECRET` (must be this exact name)
    *   **Secret value:** Paste your Razorpay Key Secret here.
    *   Click **"Add secret"**.

---

### 3. Deploy the Application

With your secrets configured in GitHub, you are ready to deploy. All you need to do is commit the latest code changes and push them to GitHub.

Run these commands in your Studio terminal:

```bash
# 1. Add all recent changes
git add .

# 2. Commit the changes
git commit -m "Finalize configuration for live deployment"

# 3. Push to GitHub to trigger the deployment
git push origin main
```

This will start the deployment workflow in the **Actions** tab of your GitHub repository. Once it finishes successfully, your order placement and all other features will work on the live URL.
