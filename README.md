# Acoof - Modern Menswear Store

This is a Next.js e-commerce application built with Firebase Studio. It features a complete shopping experience, including product listings, a shopping cart, and a secure checkout process with Razorpay.

## Final Steps for Live Deployment

Your application code is complete. To make your live application fully functional, you must complete the following configuration steps in your Google Cloud project.

### 1. Create Secrets in Secret Manager

Your live app needs two secret keys to function. You must store these in **Google Secret Manager**.

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

---

### 2. **(CRUCIAL) Grant Permissions to the Service Account**

This is the most critical step to fix deployment errors. You must give the deployment service account permission to deploy your app and read the secrets you just created.

1.  Go to the **IAM** page in your Google Cloud Console: [IAM & Admin](https://console.cloud.google.com/iam-admin/iam?project=acoof-8e92d).
2.  Find the service account (Principal) named **`github-action-1020136778@acoof-8e92d.iam.gserviceaccount.com`**.
3.  Click the **pencil icon** (Edit principal) on that row.
4.  Click **"ADD ANOTHER ROLE"** and add the following four roles:
    *   **Cloud Run Admin**: Allows creating and managing the backend service.
    *   **Firebase Hosting Admin**: Allows deploying new site versions.
    *   **Secret Manager Secret Accessor**: Allows reading the secrets you created.
    *   **Firebase Extensions Admin**: Allows managing underlying services required for deployment.
5.  Click **"SAVE"**.

---

### 3. Deploy the Application

With your secrets configured and permissions granted, you are ready to deploy. All you need to do is commit the latest code changes and push them to GitHub.

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
