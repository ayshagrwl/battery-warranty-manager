# Battery Warranty & Claim Management System — Administrator Deployment Guide

This guide details the complete deployment process for setting up the Battery Warranty & Claim Management System from scratch using Google Workspace (Google Sheets, Google Drive, Google Apps Script) and `@google/clasp`.

---

## 1. Prerequisites

Before beginning the deployment, ensure you have:
1. **Google Account:** A Google Workspace or personal Gmail account with Google Drive and Google Sheets access.
2. **Node.js & npm:** Node.js (v18+ recommended) installed locally.
3. **Google Clasp:** The official Google Apps Script CLI tool (`npm install -g @google/clasp`).
4. **Google Apps Script API Enabled:**
   - Navigate to [https://script.google.com/home/usersettings](https://script.google.com/home/usersettings).
   - Toggle **Google Apps Script API** to **ON**.

---

## 2. Step 1: Google Sheet Database Setup

1. Create a new Google Spreadsheet in your Google Drive:
   - Name it: `Battery_Warranty_Master_DB`.
2. Copy the Spreadsheet ID from the browser URL:
   ```text
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
3. Initialize the **14 Normalized Tabs** exactly matching [sheet-schema.md](sheet-schema.md):
   * `Config`
   * `Users`
   * `Battery_Models`
   * `Dealers`
   * `Customers`
   * `Tickets`
   * `Battery_Tests`
   * `Claims`
   * `Claim_Documents`
   * `Delivery_Challans`
   * `Company_Dispatches`
   * `Company_Dispatch_Items`
   * `Stock_Update_Log`
   * `Audit_Log`

> [!IMPORTANT]
> **Serial Number Text Forcing:**
> In the `Tickets`, `Battery_Tests`, `Claims`, `Delivery_Challans`, `Company_Dispatch_Items`, and `Stock_Update_Log` sheets, highlight the columns containing Serial Numbers (`original_serial_no`, `service_battery_serial`, `replacement_serial_no`, `battery_serial_no`) and format them strictly as **Format > Number > Plain Text**. This prevents Google Sheets from stripping leading zeroes (e.g. converting `00849201` to `849201`).

---

## 3. Step 2: Google Drive Storage Hierarchy Setup

1. Open your Google Drive and create a dedicated parent folder:
   - Folder Name: `Battery Warranty System`
2. Inside `Battery Warranty System`, create four subfolders:
   - `Claims/`
   - `Delivery Challans/`
   - `Company Dispatches/`
   - `Backups/`
3. Copy the Folder ID of the root `Battery Warranty System` folder from the URL:
   ```text
   https://drive.google.com/drive/folders/[DRIVE_ROOT_FOLDER_ID]
   ```
4. Configure Folder Permissions:
   - Set access to **Restricted** (Only designated staff Google accounts can view/edit).

---

## 4. Step 3: Google Apps Script Project & Clasp Setup

### A. Clone and Install Clasp
If `@google/clasp` is not installed globally, install it:
```bash
npm install -g @google/clasp
```

Log in to your Google Account from your terminal:
```bash
clasp login
```
*A browser window will open requesting permissions. Authorize the application.*

### B. Configure Project Linking
1. In the root of this repository, copy the example clasp configuration:
   ```bash
   cp .clasp.json.example .clasp.json
   ```
2. Create a new standalone Apps Script project or bind to your spreadsheet:
   ```bash
   # Option A: Create a new standalone script
   clasp create --title "Battery Warranty Backend" --type standalone --rootDir ./apps-script

   # Option B: Link an existing script
   # Replace YOUR_SCRIPT_ID in .clasp.json
   ```
3. Your `.clasp.json` should resemble:
   ```json
   {
     "scriptId": "YOUR_ACTUAL_APPS_SCRIPT_ID_HERE",
     "rootDir": "./apps-script"
   }
   ```

### C. Push Backend Code to Google Apps Script
Push all services and HTML templates to Google:
```bash
clasp push
```
Verify the push by opening the script editor:
```bash
clasp open
```

---

## 5. Step 4: Configure Script Properties

The backend uses **Script Properties** to securely access environment-specific IDs without hardcoding them in version control.

1. In the Google Apps Script online editor, navigate to:
   - **Project Settings** (gear icon on the left navigation bar).
2. Scroll down to **Script Properties** and click **Edit script properties**.
3. Add the following key-value pairs:

| Property Name | Example Value | Description |
| :--- | :--- | :--- |
| `SPREADSHEET_ID` | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms` | ID of your master Google Sheet |
| `DRIVE_ROOT_FOLDER_ID`| `1A2b3C4d5E6f7G8h9I0jKlMnOpQrStUvW` | ID of the Drive root folder |
| `COMPANY_NAME` | `Amaron Battery Hub & Service Care` | Distributor business name |
| `ADMIN_EMAIL` | `admin@batteryhub.in` | Administrator alert email |
| `TIMEZONE` | `Asia/Kolkata` | Standard operating timezone |

4. Click **Save script properties**.

---

## 6. Step 5: Web App Deployment

1. In the Apps Script online editor, click the blue **Deploy** button (top right) > **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure the deployment settings:
   - **Description:** `Production v1.0 - Battery Warranty Management System`
   - **Execute as:** `User accessing the web app` (for internal domain staff) or `Me` (service account mode).
   - **Who has access:** `Anyone within your organization` (Recommended for Google Workspace) or `Anyone` (if restricted by internal login).
4. Click **Deploy**.
5. Grant permissions:
   - Click **Authorize access**.
   - Select your Google administrator account.
   - Click **Advanced** > **Go to Battery Warranty Backend (unsafe)** > Click **Allow**.
6. Copy the **Web App URL**:
   ```text
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

---

## 7. Step 6: Initial Database Seeding

1. Open the script editor in Apps Script.
2. In the file dropdown, select `Config.gs` (or `Database.gs`).
3. Select the function `seedInitialConfiguration` (or `initDatabase`).
4. Click **Run**.
5. Inspect the execution log to confirm all default sequence counters (`TKT_SEQ: 1`, `CLM_SEQ: 1`, `DC_RET_SEQ: 1`, `DC_COM_SEQ: 1`, `DSP_SEQ: 1`) and standard master battery models (Amaron, Exide, Tata Green) have been populated into the Google Sheet.

---

## 8. Step 7: Ongoing Maintenance & Clasp Sync Workflow

### Local Development Workflow
1. Make modifications to `.gs` services or `.html` templates inside the `apps-script/` folder.
2. Test code changes locally or run syntax linting.
3. Push to Google Apps Script:
   ```bash
   clasp push
   ```
4. If testing directly on a development deployment:
   ```bash
   clasp deploy --description "Staging test build"
   ```

### Daily Backup Automation
To ensure disaster recovery:
1. In Apps Script, open `Triggers` (alarm clock icon).
2. Click **Add Trigger**:
   - Function to run: `createAutomatedDailyBackup`
   - Event source: `Time-driven`
   - Type of time based trigger: `Day timer`
   - Time of day: `1:00 AM to 2:00 AM`
3. Save the trigger. Backups will automatically snapshot the master spreadsheet into `Battery Warranty System/Backups/` daily.
