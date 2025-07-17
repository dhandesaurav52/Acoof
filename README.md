# Acoof - Modern Menswear Store

This is a Next.js e-commerce application built with Firebase Studio. It features a complete shopping experience, including product listings, a shopping cart, and a secure checkout process with Razorpay.

## Final Steps for Live Deployment

To make your live application fully functional, you must link a billing account to your project, create a dedicated service account, give it the correct permissions, and add its key to your GitHub repository secrets. This guide provides the definitive, tested steps to ensure a successful deployment.

### 1. Enable Billing for Your Project

Modern web framework deployments on Firebase Hosting require the underlying Google Cloud project to be on the "Blaze" (Pay-as-you-go) plan.

1.  **Go to the Google Cloud Billing page for your project:**
    [https://console.cloud.google.com/billing/linkedaccount?project=acoof-8e92d](https://console.cloud.google.com/billing/linkedaccount?project=acoof-8e92d)
2.  If the project is not linked to a billing account, click **"LINK A BILLING ACCOUNT"** and follow the prompts. You may need to create a new billing account if you don't have one.

**This is a required step. The deployment will fail without it.**

### 2. Create a Service Account and Generate a Key

1.  Navigate to the [Service Accounts page in your Google Cloud Console](https://console.cloud.google.com/iam-admin/service-accounts?project=acoof-8e92d).
2.  Click **"+ CREATE SERVICE ACCOUNT"**.
3.  Enter a name like `github-deployer` and click **"CREATE AND CONTINUE"**.
4.  In the "Grant this service account access to project" step, add the following three roles. This is the complete and correct list that ensures all necessary permissions are granted:
    *   **`Firebase Admin`** (This is a powerful role that includes permissions for all Firebase services).
    *   **`Cloud Run Admin`** (This is required for the Next.js backend).
    *   **`Service Account User`** (This allows the service account to act on its own behalf).
    *   **`Project Billing Manager`** (This is required to verify the project's billing status during deployment).
5.  Click **"CONTINUE"**, then click **"DONE"**.
6.  Find the new `github-deployer` service account in the list and click on its email address.
7.  Go to the **KEYS** tab.
8.  Click **ADD KEY** -> **Create new key**.
9.  Select **JSON** as the key type and click **CREATE**. A JSON file will be downloaded to your computer.

### 3. Configure GitHub Secrets

Navigate to your repository's secrets page:
`https://github.com/[YOUR_USERNAME]/[YOUR_REPO_NAME]/settings/secrets/actions`

You will need to create two secrets. Click **"New repository secret"** for each one.

**A. Add Your Firebase Service Account Key:**

1.  Open the JSON file you just downloaded.
2.  Copy its **entire contents**.
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

### 4. Deploy the Application

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
