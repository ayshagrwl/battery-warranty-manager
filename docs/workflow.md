# Battery Warranty & Claim Management System — Workflow & State Machine

## 1. Lifecycle Overview

The Battery Warranty & Claim Management System coordinates five interconnected lifecycles:
1. **Intake Ticket Lifecycle:** From battery surrender to diagnostic conclusion.
2. **Battery Testing Lifecycle:** Electrical and physical diagnostics determining eligibility.
3. **Manufacturer Claim Lifecycle:** Consolidated dispatch to factory/depot and replacement tracking.
4. **Service (Loaner) Battery Lifecycle:** Temporary loaner issuance and recovery.
5. **Stock Reconciliation Lifecycle:** Mandatory inventory ERP alignment upon replacement receipt.

---

## 2. End-to-End Workflow Diagram

```mermaid
flowchart TD
    Start([Customer or Dealer Arrives]) --> Intake[1. Intake & Ticket Creation\nIssue TKT-YYYY-XXXXXX\nOptional: Issue Service Battery]
    
    Intake --> Lab[2. Battery Testing Lab\nStatic Voltage • Specific Gravity • 15s Load Test]
    
    Lab --> Decision{Test Result?}
    
    %% Rejection Branch
    Decision -->|FAIL / REJECT\nBulged, Sulphated, or Abused| Reject[3A. Test Rejected]
    Reject --> RetChallan[Generate Battery Return Challan\nDC-RET-YYYY-XXXXXX]
    RetChallan --> RetHandover[Return Battery to Customer/Dealer\nCollect Service Loaner\nAcknowledge Challan]
    RetHandover --> CloseReject([Ticket Closed - Rejected])
    
    %% Pass Branch
    Decision -->|PASS\nInternal Short / Dead Cell / Drop| ClaimDraft[3B. Test Passed\nDraft Manufacturer Claim\nCLM-YYYY-XXXXXX]
    
    ClaimDraft --> Docs[Upload Documents to Drive\nInvoice • Warranty Card • Test Slip]
    Docs --> ReadyCo[Status: READY_FOR_COMPANY]
    
    ReadyCo --> Batch[4. Consolidated Company Dispatch\nBatch ID: DSP-YYYY-XXXXXX\nConsolidated Challan: DC-COM-YYYY-XXXXXX\nAttach LR/Docket No.]
    Batch --> SentCo[Status: SENT_TO_COMPANY]
    
    SentCo --> CoReview{Manufacturer Inspection}
    
    CoReview -->|Approved| ReplRecv[5. Replacement Battery Arrives\nRecord Replacement Serial REP-XXXXX\nStatus: REPLACEMENT_RECEIVED]
    CoReview -->|Rejected by Co.| CoReject[Return to Service Center\nUpdate Claim: REJECTED_BY_COMPANY]
    
    ReplRecv --> StockTask[6. Enforce Stock Task\nSTK-YYYY-XXXXXX Created\nStatus: UPDATE_REQUIRED]
    
    StockTask --> StockAction[Operator Updates ERP / Busy / Tally\nEnter Accounting Voucher Ref No.]
    StockAction --> StockDone[Stock Status: UPDATED]
    
    StockDone --> CustomerDelivery[7. Customer Handover\nDeliver New Replacement Battery\nRecover Service Battery\nCustomer Signs Delivery Challan]
    CustomerDelivery --> CloseClaim([Claim Closed - Complete])
    CoReject --> RetHandover
```

---

## 3. Ticket State Machine

```mermaid
stateDiagram-v2
    [*] --> RECEIVED: Battery surrendered by Customer/Dealer
    RECEIVED --> TESTING: Moved to diagnostic bench
    TESTING --> TEST_PASSED: Passes electrical/physical test
    TESTING --> TEST_REJECTED: Fails criteria (e.g. physical damage, deep discharge)
    
    TEST_PASSED --> CLAIM_CREATED: Converted to manufacturer claim
    TEST_REJECTED --> RETURN_CHALLAN_GENERATED: Delivery challan issued
    RETURN_CHALLAN_GENERATED --> CLOSED_REJECTED: Battery returned & acknowledged
    
    CLAIM_CREATED --> [*]
    CLOSED_REJECTED --> [*]
```

### Ticket Status Matrix

| Status | Description | Allowed Actions | Next Valid States |
| :--- | :--- | :--- | :--- |
| `RECEIVED` | Intake created. Original battery in holding bay. Loaner battery recorded if issued. | Edit notes, assign technician, start testing | `TESTING`, `CANCELLED` |
| `TESTING` | Battery connected to load tester and hydrometer. | Record test parameters (OCV, Gravity, Load V) | `TEST_PASSED`, `TEST_REJECTED` |
| `TEST_PASSED` | Diagnostic test completed; defect confirmed eligible under warranty terms. | Create Claim (`CLM-YYYY-XXXXXX`) | `CLAIM_CREATED` |
| `TEST_REJECTED`| Battery failed warranty eligibility (abused, uncharged, physical crack). | Generate Return Challan (`DC-RET`) | `RETURN_CHALLAN_GENERATED` |
| `RETURN_CHALLAN_GENERATED` | Return challan printed. Awaiting customer pickup. | Handover battery, collect loaner, sign challan | `CLOSED_REJECTED` |
| `CLAIM_CREATED` | Official manufacturer claim generated; ticket archived into claim. | Manage under Claim lifecycle | (Controlled by Claim lifecycle) |
| `CLOSED_REJECTED` | Battery returned to customer. Service loaner returned. Final state. | View only | Terminal |

---

## 4. Manufacturer Claim State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFTED: Generated from Ticket
    DRAFTED --> READY_FOR_COMPANY: In-warranty validated & docs attached
    READY_FOR_COMPANY --> SENT_TO_COMPANY: Included in Dispatch Batch (DSP)
    
    SENT_TO_COMPANY --> REPLACEMENT_RECEIVED: Company ships new replacement
    SENT_TO_COMPANY --> REJECTED_BY_COMPANY: Factory technical rejection
    
    REPLACEMENT_RECEIVED --> STOCK_UPDATED: Busy/Tally inventory voucher logged
    STOCK_UPDATED --> CLOSED: Replacement handed to customer & loaner returned
    
    REJECTED_BY_COMPANY --> RETURN_CHALLAN_GENERATED: Battery returned from factory
    RETURN_CHALLAN_GENERATED --> CLOSED: Returned to customer
    
    CLOSED --> [*]
```

### Claim Status Matrix

| Status | Trigger Condition | Mandatory Fields Required |
| :--- | :--- | :--- |
| `DRAFTED` | Created from `TEST_PASSED` ticket | `ticket_no`, `original_serial_no`, `battery_model`, `customer_name` |
| `READY_FOR_COMPANY` | Warranty validity verified; documents uploaded | `warranty_status`, `date_of_sale`, `warranty_expiry_date` |
| `SENT_TO_COMPANY` | Added to consolidated dispatch batch | `dispatch_batch_no`, `company_challan_no`, `company_dispatch_date`, `carrier_transporter` |
| `REPLACEMENT_RECEIVED`| New replacement battery arrives at distributor | `replacement_model`, `replacement_serial_no`, `replacement_received_date` |
| `REJECTED_BY_COMPANY`| Manufacturer warranty engineer rejects claim | `remarks` explaining factory rejection |
| `CLOSED` | Replacement delivered, service battery collected, stock updated | `stock_status = UPDATED`, `closed_date` |

---

## 5. Service (Loaner) Battery Protocol

To prevent lost loaner inventory, the system enforces a strict 2-key loaner lifecycle:

```mermaid
flowchart LR
    subgraph Intake["Intake Stage"]
        A[Customer has no spare] --> B[Issue Service Battery\nRecord Model & Serial\ne.g. SB-00349]
        B --> C[Print Intake Receipt\nwith Loaner Undertaking]
    end
    
    subgraph Processing["Processing Stage"]
        C --> D[Service Battery Active\nFlagged in Dashboard]
        D --> E[Track Overdue Loaners\n>15 Days Alert]
    end
    
    subgraph Handover["Resolution Stage"]
        E --> F{Handover Event}
        F -->|Warranty Approved| G[Receive New Replacement]
        F -->|Warranty Rejected| H[Return Original Battery]
        G --> I[MANDATORY CHECK:\nReturn Service Battery SB-00349]
        H --> I
        I --> J[Inspection of Loaner Condition]
        J --> K[Service Battery Restored to Pool]
        K --> L[Complete Handover]
    end
```

### Loaner Rules
1. **Serial Number Isolation:** Service battery serial number is strictly stored in `service_battery_serial` and NEVER copied into `original_serial_no` or `replacement_serial_no`.
2. **Release Blocker:** A claim or ticket cannot be marked `CLOSED` while `service_battery_issued = TRUE` until the return checklist is confirmed.
3. **Overdue Tracking:** Any loaner issued for more than 14 business days without an active company dispatch is highlighted in amber/red on the administrative dashboard.

---

## 6. Stock Reconciliation Lifecycle

When a warranty replacement battery is received from the manufacturer, it constitutes physical inventory entering the warehouse. Without explicit ERP reconciliation, the distributor's inventory system (Busy, Tally, Marg, or SAP) suffers discrepancy.

```mermaid
flowchart TD
    A[Replacement Battery Arrives from Company] --> B[Log Replacement in System\nRecord REP Serial No.]
    B --> C[System Automatically Generates Stock Task\nID: STK-YYYY-XXXXXX\nStatus: UPDATE_REQUIRED]
    
    C --> D[Alert Appears on Dashboard:\nPending Physical Stock Entry]
    
    D --> E[Operator Opens Accounting ERP\nBusy / Tally / Marg]
    E --> F[Create Material Receipt / Warranty Inward Voucher\nReference No. e.g. VR-2026-0928]
    
    F --> G[Operator Returns to Warranty System]
    G --> H[Enter Accounting Ref No. & Operator ID]
    H --> I[Mark Task as UPDATED\nClaim Stock Status becomes UPDATED]
    
    I --> J[Handover Enabled]
```

### Stock Update Validation Rules
* **No Premature Handover:** An operator cannot mark a claim `CLOSED` unless `stock_status` is `UPDATED`.
* **Voucher Audit:** The accounting voucher number (`accounting_ref_no`) is immutable once logged and indexed in the audit trail.
