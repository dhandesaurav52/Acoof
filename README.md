# Acoof - Modern Menswear Store

This is a Next.js e-commerce application built with Firebase Studio. It features a complete shopping experience, including product listings, a shopping cart, and a secure checkout process with Razorpay.

## Final Steps for Live Deployment

Your application code is complete. To make your live application fully functional, you need to configure the production secrets. This is a critical security step.

### 1. Set Up Production Secrets

Your live app needs two secret keys to function: one for Firebase Admin (to manage orders) and one for Razorpay (to process payments). You must store these in **Google Secret Manager**.

**A. Get Your Firebase Service Account Key:**

1.  Go to your [Firebase Project Settings](https://console.firebase.google.com/project/acoof-8e92d/settings/serviceaccounts/adminsdk).
2.  Select the **"Service accounts"** tab.
3.  Click **"Generate new private key"**. A JSON file will be downloaded.
4.  Open the JSON file and copy its **entire contents**.
5.  Go to [Google Secret Manager](https://console.cloud.google.com/security/secret-manager?project=acoof-8e92d).
6.  Click **"Create Secret"**.
    *   **Name:** `FIREBASE_SERVICE_ACCOUNT_KEY` (must be this exact name).
    *   **Secret value:** Paste the entire contents of the JSON file here.
    *   Click **"Create secret"**.

**B. Get Your Razorpay Secret Key:**

1.  Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2.  Navigate to **Settings -> API Keys**.
3.  Generate a new **Live Key** if you haven't already.
4.  Copy the **Key Secret**.
5.  Go back to [Google Secret Manager](https://console.cloud.google.com/security/secret-manager?project=acoof-8e92d).
6.  Click **"Create Secret"** again.
    *   **Name:** `RAZORPAY_KEY_SECRET` (must be this exact name).
    *   **Secret value:** Paste your Razorpay Key Secret here.
    *   Click **"Create secret"**.

### 2. Deploy the Application

With your secrets configured, you are ready to deploy. All you need to do is commit the latest code changes and push them to GitHub.

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

### 3. (Optional) Add a Custom Domain

After your site is live, you can connect your own domain (e.g., `www.yourstore.com`).

1.  Go to the **Hosting** section of your [Firebase Project](https://console.firebase.google.com/project/acoof-8e92d/hosting).
2.  Click **"Add custom domain"** and follow the instructions.
