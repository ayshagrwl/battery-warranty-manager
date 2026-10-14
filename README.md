# ⚡ Battery Warranty & Claim Management System

> **Enterprise-grade, zero-cost operational platform for Indian battery distributors, service centers, and authorized dealers.**
> Built on Google Workspace (Google Sheets, Drive, Apps Script) and deployed directly to production.

[![Live Production Web App](https://img.shields.io/badge/Live_Production-Google_Workspace-2563eb?style=for-the-badge&logo=google)](https://script.google.com/macros/s/AKfycbz8veuql4nvWujUKPskLUGKFB7l0DnPTlyMbkdh6OgPfJkJlI1IUNovRYyKMEHRPm1j/exec)
[![Master Google Sheet](https://img.shields.io/badge/Database-Google_Sheets-34a853?style=for-the-badge&logo=googlesheets)](https://docs.google.com/spreadsheets/d/1Vp8DLiLVwT6j_zyvKWHYKIpFrk-Je9Vfq2KtyUKXK08/edit)

---

## 📌 Executive Summary

Managing automotive and inverter battery warranties in India is notoriously complex. Distributors handle thousands of claims annually across brands like **Amaron**, **Exide**, **Tata Green**, **Luminous**, and **Livguard**. Key operational challenges include:
- **Lost Service/Loaner Batteries:** Temporary batteries given to customers are frequently misplaced or forgotten.
- **Lost Warranty Batteries & Serial Discrepancies:** Leading zeroes truncated by spreadsheets, causing manufacturer rejection.
- **Uncoordinated Company Dispatches:** Multi-battery consignments sent without structured LR dockets and manifests.
- **Inventory Desynchronization:** Replacement batteries received from manufacturers enter the warehouse without matching physical stock vouchers in accounting software (**Tally / Busy ERP**).

The **Battery Warranty & Claim Management System** solves these challenges using a **Free-First Architecture**—running entirely on Google Sheets (14 structured relational tabs), Google Drive (structured PDF/image repository), and Google Apps Script HTML Service.

---

## 🚀 Key Features

* **3-Way Serial Number Isolation:**
  - Strictly partitions `Original Battery Serial`, `Service (Loaner) Battery Serial`, and `Replacement Battery Serial` across all tables and forms to eliminate mix-ups.
* **Electrical & Physical Diagnostic Bench:**
  - Integrated testing workflow tracking **Open Circuit Voltage (OCV)**, **6-Cell Specific Gravity**, and **15-Second Load Test Voltage** with automatic PASS/REJECT qualification.
* **A4 Print-Ready Document Engine:**
  - Professional, GST-compliant printouts formatted specifically for standard A4 paper:
    - **Battery Return Delivery Challan (`DC-RET`):** Dual sign-off for rejected batteries.
    - **Consolidated Company Dispatch Challan (`DC-COM`):** Multi-claim consignment manifest with LR/Docket tracking.
    - **Official Warranty Inspection Slip:** Customer intake and service loaner undertaking.
* **Mandatory Accounting & Stock Reconciliation Engine:**
  - Automatically flags received replacement batteries and blocks ticket closure until an operator logs the physical stock inward voucher reference from **Busy / Tally**.
* **Zero-Cost Free-First Architecture:**
  - $0/month infrastructure cost using Google Sheets as a relational database, Google Drive for binary storage, and Google Apps Script for backend compute.
* **Source-Controlled via Google Clasp:**
  - Full local development workflow with `@google/clasp`, strict `.gitignore` guards, and modular `.gs` micro-services.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Tier (Mobile & Desktop Browser)"]
        UI["Google Apps Script HTML Service\n(Vanilla JS + Responsive CSS)"]
        Print["A4 Print Layouts\n(Return Challan, Dispatch Manifest, Claim Form)"]
        Demo["Standalone GitHub Pages Demo\n(Zero Backend Secrets • Mock Data)"]
    end

    subgraph Server["Application Server Tier (Google Apps Script)"]
        Router["Code.gs (doGet Router & API Dispatcher)"]
        Lock["LockService (Concurrency & Mutex ID Lock)"]
        
        subgraph Services["Modular Service Layer"]
            TicketSvc["TicketService.gs"]
            WarrantySvc["WarrantyService.gs"]
            ClaimSvc["ClaimService.gs"]
            ChallanSvc["ChallanService.gs"]
            DispatchSvc["DispatchService.gs"]
            ReplSvc["ReplacementService.gs"]
            DriveSvc["DriveService.gs"]
            AuditSvc["AuditService.gs"]
        end
    end

    subgraph Storage["Data & Storage Tier (Google Workspace)"]
        DB[("Google Sheets Master DB\n(14 Normalized Tabs)")]
        Drive[("Google Drive File Storage\n/Battery Warranty System/...")]
    end

    UI -->|"google.script.run (RPC)"| Router
    Router --> Lock
    Lock --> Services
    Services --> DB
    Services --> Drive
    Print -.-> UI
    Demo -.->|"Simulated in-memory / LocalStorage"| UI
```

---

## 🔄 Lifecycle & State Progression

```mermaid
stateDiagram-v2
    [*] --> RECEIVED: Customer/Dealer Intake
    RECEIVED --> TESTING: Moved to Diagnostic Bench
    TESTING --> TEST_PASSED: Confirmed Factory Defect
    TESTING --> TEST_REJECTED: Abuse / Sulphated / Physical Crack
    
    TEST_REJECTED --> RETURN_CHALLAN_ISSUED: Generate DC-RET Challan
    RETURN_CHALLAN_ISSUED --> CLOSED_REJECTED: Battery Handover & Loaner Collected
    
    TEST_PASSED --> READY_FOR_COMPANY: Create Claim & Attach Docs
    READY_FOR_COMPANY --> SENT_TO_COMPANY: Consolidated Dispatch (DSP)
    SENT_TO_COMPANY --> REPLACEMENT_RECEIVED: Company Delivers New Battery
    
    REPLACEMENT_RECEIVED --> STOCK_UPDATE_PENDING: Enforce STK Task
    STOCK_UPDATE_PENDING --> STOCK_UPDATED: Log Busy/Tally Voucher Ref
    STOCK_UPDATED --> CLOSED: Deliver Replacement & Recover Loaner
    
    CLOSED --> [*]
    CLOSED_REJECTED --> [*]
```

---

## 📁 Repository Structure

```text
battery-warranty-manager/
├── .clasp.json.example       # Example clasp configuration
├── .gitignore                # Guards credentials and private clasp IDs
├── LICENSE                   # MIT License
├── README.md                 # System overview and portfolio documentation
├── apps-script/              # Google Apps Script source code
│   ├── appsscript.json       # GAS manifest and OAuth scopes
│   ├── Code.gs               # Main doGet router and RPC handlers
│   ├── Config.gs             # Key-value settings and sequence counters
│   ├── Database.gs           # Sheets CRUD abstraction & text-forcing
│   ├── TicketService.gs      # Intake tickets & loaner battery logic
│   ├── WarrantyService.gs    # Diagnostic tests & warranty calculation
│   ├── ClaimService.gs       # Manufacturer claim lifecycle
│   ├── ChallanService.gs     # Delivery challan generator
│   ├── DispatchService.gs    # Consolidated company dispatch batches
│   ├── ReplacementService.gs # Replacement receipt & stock reconciliation
│   ├── DriveService.gs       # Google Drive folder & upload manager
│   ├── AuditService.gs       # Immutable event audit logging
│   └── templates/            # HTML Service templates (UI & print layouts)
├── dist/                     # Production builds and deployment bundles
│   ├── apps-script-bundle/   # All-in-one compiled GAS bundle
│   └── apps-script-production.zip # Direct import archive
├── scripts/                  # Production CLI utilities and diagnostics
│   ├── check-connection.js   # Automated Sheets API connection tester
│   └── run-full-system-test.js # End-to-end integration test runner
└── docs/                     # Comprehensive engineering documentation
    ├── architecture.md       # Technical design and architectural decisions
    ├── deployment.md         # Administrator guide for Sheets, Drive, & Clasp
    ├── sheet-schema.md       # 14-tab relational schema definitions
    └── workflow.md           # State machines, transition tables, & diagrams
```

---

## 🛠️ Production Operation & Verification

### Running Automated Diagnostics
```bash
# Test Google Cloud infrastructure, Sheets connectivity & rules engine:
npm test

# Verify Google Sheet relational schema & permissions:
npm run check-connection
```

### Direct Production Deployment Sync
```bash
# Push latest changes to live Google Apps Script:
npm run clasp:push

# Deploy new production version:
npm run clasp:deploy
```

---

## 🌐 Live Production Links

* **Live Web App:** [https://script.google.com/macros/s/AKfycbz8veuql4nvWujUKPskLUGKFB7l0DnPTlyMbkdh6OgPfJkJlI1IUNovRYyKMEHRPm1j/exec](https://script.google.com/macros/s/AKfycbz8veuql4nvWujUKPskLUGKFB7l0DnPTlyMbkdh6OgPfJkJlI1IUNovRYyKMEHRPm1j/exec)
* **Master Google Sheet Database:** [https://docs.google.com/spreadsheets/d/1Vp8DLiLVwT6j_zyvKWHYKIpFrk-Je9Vfq2KtyUKXK08/edit](https://docs.google.com/spreadsheets/d/1Vp8DLiLVwT6j_zyvKWHYKIpFrk-Je9Vfq2KtyUKXK08/edit)
* **Apps Script Project:** [https://script.google.com/d/1W69fIh938IkP6IX7zh4vpIINQZe24l86q6xKSJHpsqKyYcODMT2bsieg/edit](https://script.google.com/d/1W69fIh938IkP6IX7zh4vpIINQZe24l86q6xKSJHpsqKyYcODMT2bsieg/edit)

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
