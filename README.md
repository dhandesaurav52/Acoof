
# Acoof - Modern Menswear Store

This is a Next.js e-commerce application built with Firebase Studio. It features a complete shopping experience, including product listings, a shopping cart, and a secure checkout process.

## Final Steps for Live Deployment

To make your live application fully functional, you must link a billing account to your project and ensure the correct APIs and permissions are enabled. This simplified guide provides the definitive steps for a successful deployment.

### 1. Link Billing Account & Enable APIs

Deploying modern web frameworks to Firebase Hosting requires the underlying Google Cloud project to be on the "Blaze" (Pay-as-you-go) plan.

#### A. Link Billing Account

1.  **Go to the Google Cloud Billing page for your project:**
    [https://console.cloud.google.com/billing/linkedaccount?project=acoof-8e92d](https://console.cloud.google.com/billing/linkedaccount?project=acoof-8e92d)
2.  If your project is not linked to a billing account, click **"LINK A BILLING ACCOUNT"** and follow the prompts. **This step is mandatory.**

#### B. Enable Required Google Cloud APIs

Click each link below and ensure you click the blue **"ENABLE"** button on each page.

1.  **Cloud Run API:**
    [https://console.cloud.google.com/apis/library/run.googleapis.com?project=acoof-8e92d](https://console.cloud.google.com/apis/library/run.googleapis.com?project=acoof-8e92d)
2.  **Cloud Billing API:**
    [https://console.cloud.google.com/apis/library/cloudbilling.googleapis.com?project=acoof-8e92d](https://console.cloud.google.com/apis/library/cloudbilling.googleapis.com/project=acoof-8e92d)
3.  **Identity and Access Management (IAM) API:**
    [https://console.cloud.google.com/apis/library/iam.googleapis.com?project=acoof-8e92d](https://console.cloud.google.com/apis/library/iam.googleapis.com/project=acoof-8e92d)
4.  **Cloud Resource Manager API:**
    [https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com?project=acoof-8e92d](https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com/project=acoof-8e92d)

### 2. Grant Permissions and Generate a Key

We will use the **`firebase-adminsdk`** service account for deployment.

#### A. Go to the Service Accounts Page
1.  Navigate to the [Service Accounts page in your Google Cloud Console](https://console.cloud.google.com/iam-admin/service-accounts?project=acoof-8e92d).
2.  Find the service account with the **Name** `firebase-adminsdk`. The full email will look like `firebase-adminsdk-fbsvc@acoof-8e92d.iam.gserviceaccount.com`.

#### B. Grant Required Roles

1.  Go to the main [IAM & Admin page](https://console.cloud.google.com/iam?project=acoof-8e92d).
2.  Find the **`firebase-adminsdk-fbsvc@...`** account in the list of principals. Click the pencil icon (Edit principal) on the far right of its row.
3.  Click **"+ ADD ANOTHER ROLE"** and add the following roles if they are not already present. The complete list of required roles is:
    *   **`Firebase Admin`** (This is a powerful base role).
    *   **`Cloud Run Admin`** (Required for the Next.js backend).
    *   **`Service Account User`** (Allows the service account to act on its own behalf during deployment).
4.  Click **"SAVE"**.

#### C. Generate a Service Account Key

1.  Go back to the [Service Accounts page](https://console.cloud.google.com/iam-admin/service-accounts?project=acoof-8e92d) and click on the email address of the **`firebase-adminsdk-fbsvc@...`** service account.
2.  Go to the **KEYS** tab.
3.  Click **ADD KEY** -> **Create new key**.
4.  Select **JSON** as the key type and click **CREATE**. A JSON file will be downloaded to your computer.

### 3. Configure GitHub Secrets

Navigate to your repository's secrets page:
`https://github.com/[YOUR_USERNAME]/[YOUR_REPO_NAME]/settings/secrets/actions`

You will need to create two secrets.

**A. Add Your Firebase Service Account Key:**

1.  Open the JSON file you just downloaded.
2.  Copy its **entire contents**.
3.  In GitHub, create a new repository secret:
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

With your secrets and permissions configured, you are ready to deploy. All you need to do is commit your latest code changes and push them to GitHub.

Run these commands in your Studio terminal:

```bash
# 1. Add all recent changes
git add .

# 2. Commit the changes
git commit -m "Finalize configuration for live deployment"

# 3. Push to GitHub to trigger the deployment
git push origin main
```

This will start the deployment workflow in the **Actions** tab of your GitHub repository. Once it finishes successfully, your application will be live and fully functional.
