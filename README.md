# Acoof - Modern Menswear Store

This is a Next.js e-commerce application built with Firebase Studio. It features a complete shopping experience, including product listings, a shopping cart, and a secure checkout process with Razorpay.

## Final Steps for Live Deployment

To make your live application fully functional, you must add your secret keys to your GitHub repository and ensure the service account has the correct permissions.

### 1. Configure GitHub Secrets

Navigate to your repository's secrets page:
`https://github.com/[YOUR_USERNAME]/[YOUR_REPO_NAME]/settings/secrets/actions`

You will need to create two secrets. Click **"New repository secret"** for each one.

**A. Add Your Firebase Service Account Key:**

1.  If you don't have it, generate a new key from your [Firebase Project Settings](https://console.firebase.google.com/project/acoof-8e92d/settings/serviceaccounts/adminsdk) by clicking **"Generate new private key"**.
2.  Open the downloaded JSON file and copy its **entire contents**.
3.  In GitHub, create a new secret:
    *   **Name:** `FIREBASE_SERVICE_ACCOUNT_KEY`
    *   **Secret value:** Paste the entire contents of the JSON file here.
    *   Click **"Add secret"**.

**B. Add Your Razorpay Secret Key:**

1.  Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2.  Navigate to **Settings -> API Keys**.
3.  Generate a new **Live Key** if you haven't already.
4.  Copy the **Key Secret**.
5.  In GitHub, create another new secret:
    *   **Name:** `RAZORPAY_KEY_SECRET`
    *   **Secret value:** Paste your Razorpay Key Secret here.
    *   Click **"Add secret"**.

### 2. Set IAM Permissions in Google Cloud

The service account associated with the key you just created needs specific permissions to deploy the application.

1.  Go to the [IAM page in your Google Cloud Console](https://console.cloud.google.com/iam-admin/iam?project=acoof-8e92d).
2.  Find the service account you are using (its email address is in the JSON key file).
3.  Click the pencil icon (Edit principal) for that service account.
4.  Click **"Add another role"** and add the following roles one by one. This is the complete list needed:
    *   `Cloud Functions Admin` (Fixes function list permission error)
    *   `Cloud Run Admin` (Manages the Next.js backend service)
    *   `Firebase Hosting Admin` (Deploys to Firebase Hosting)
    *   `Service Account User` (Allows services to act on behalf of each other)

5.  Click **Save**.

### 3. Deploy the Application

With your secrets and permissions configured, you are ready to deploy. All you need to do is commit the latest code changes and push them to GitHub.

Run these commands in your Studio terminal:

```bash
# 1. Add all recent changes
git add .

# 2. Commit the changes
git commit -m "Finalize configuration for live deployment"

# 3. Push to GitHub to trigger the deployment
git push origin main
```

This will start the deployment workflow in the **Actions** tab of your GitHub repository. Once it finishes successfully, your application will be live.
