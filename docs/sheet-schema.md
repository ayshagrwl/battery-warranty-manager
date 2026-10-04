# Google Sheets Database Schema

The system uses a single Google Spreadsheet structured into **14 normalized tabs**. Spreadsheet row numbers are never used as identifiers; every record has a durable business ID.

All dates are stored in ISO 8601 strings (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`) internally and displayed in Indian format (`DD/MM/YYYY`) in the UI. Timezone is fixed to `Asia/Kolkata`.

---

## 1. `Config`
Key-value application settings, branding, prefixes, and sequence counters.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `key` | String | Setting identifier | `COMPANY_NAME` |
| `value` | String | Setting value | `Amaron Battery Hub & Service Care` |
| `description`| String | Human-readable note | `Distributor/Service center business name` |

**Standard Keys:**
* `COMPANY_NAME`, `COMPANY_ADDRESS`, `COMPANY_PHONE`, `COMPANY_GST`, `COMPANY_LOGO_URL`
* `TIMEZONE` (`Asia/Kolkata`), `DATE_FORMAT` (`DD/MM/YYYY`)
* `TICKET_PREFIX` (`TKT`), `CLAIM_PREFIX` (`CLM`), `RETURN_CHALLAN_PREFIX` (`DC-RET`), `COMPANY_CHALLAN_PREFIX` (`DC-COM`), `DISPATCH_PREFIX` (`DSP`)
* `TICKET_SEQ` (`1`), `CLAIM_SEQ` (`1`), `RETURN_CHALLAN_SEQ` (`1`), `COMPANY_CHALLAN_SEQ` (`1`), `DISPATCH_SEQ` (`1`)
* `DRIVE_ROOT_FOLDER_ID` (Google Drive folder ID)

---

## 2. `Users`
Authorized staff members for role-based authentication and audit tracing.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `user_id` | String | Unique user ID | `USR-001` |
| `email` | String | Google account email | `admin@batteryhub.in` |
| `name` | String | Full display name | `Ramesh Sharma` |
| `role` | String | Access role (`ADMIN`, `OPERATOR`, `TESTER`) | `ADMIN` |
| `status` | String | Status (`ACTIVE`, `INACTIVE`) | `ACTIVE` |
| `created_at` | ISO Date | Timestamp | `2026-01-10T10:00:00.000Z` |

---

## 3. `Battery_Models`
Master list of battery models and manufacturer warranty parameters.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `model_id` | String | Model code / ID | `MOD-001` |
| `brand` | String | Battery manufacturer | `Amaron` |
| `model_name` | String | Commercial model name | `AAM-PR-00042B20R (Pro 42B20R)` |
| `capacity_ah`| Number | Battery capacity | `35` |
| `warranty_months`| Number | Total warranty period | `36` |
| `guarantee_months`| Number | Full replacement period | `18` |
| `pro_rata_months` | Number | Pro-rata discount period| `18` |
| `is_active` | Boolean | Available in intake form | `TRUE` |

---

## 4. `Dealers`
Master directory of authorized dealers who surrender batteries for warranty claims.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `dealer_id` | String | Unique dealer ID | `DLR-001` |
| `dealer_name`| String | Firm / Shop Name | `Shree Ganesh Auto Electricals` |
| `contact_person`| String | Owner / Manager name | `Mahesh Patel` |
| `mobile` | String | Contact mobile number | `9825012345` |
| `address` | String | Shop address | `Shop 12, Transport Nagar, Surat` |
| `gstin` | String | GST Number (optional) | `24AAACG1234A1Z5` |
| `is_active` | Boolean | Active status | `TRUE` |

---

## 5. `Customers`
Customer profile directory populated from intake tickets.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `customer_id`| String | Customer ID | `CUST-000001` |
| `name` | String | Full Name | `Rahul S. Verma` |
| `mobile` | String | 10-digit mobile number | `9876543210` |
| `address` | String | Residential / Office address | `Flat 402, Sai Residency, Adajan` |
| `vehicle_number`| String | Vehicle registration number | `GJ-05-CD-1234` |
| `created_at` | ISO Date | First visit date | `2026-09-12T09:30:00.000Z` |

---

## 6. `Tickets`
Core intake records for received batteries.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `ticket_no` | String | Unique Ticket ID | `TKT-2026-000001` |
| `source_type` | String | `CUSTOMER` or `DEALER` | `CUSTOMER` |
| `customer_id` | String | Linked Customer ID | `CUST-000001` |
| `customer_name`| String | Customer Name | `Rahul S. Verma` |
| `dealer_id` | String | Linked Dealer ID (if dealer) | `` |
| `dealer_name` | String | Dealer Name (if dealer) | `` |
| `mobile` | String | Contact mobile | `9876543210` |
| `address` | String | Full address | `Flat 402, Sai Residency, Adajan` |
| `vehicle_number`| String | Vehicle registration | `GJ-05-CD-1234` |
| `battery_model`| String | Model code / name | `Amaron Pro 42B20R` |
| `original_serial_no`| String | Original serial number (text) | `'0094829103` |
| `date_received`| Date | Intake date | `2026-09-12` |
| `service_battery_issued`| Boolean | Did customer receive loaner | `TRUE` |
| `service_battery_model`| String | Service battery model | `Exide Ride 35R` |
| `service_battery_serial`| String | Service battery serial (text) | `'SB-00349` |
| `service_battery_date`| Date | Date issued | `2026-09-12` |
| `status` | String | Current lifecycle status | `RECEIVED` |
| `remarks` | String | Intake notes | `Customer reports morning starting issue` |
| `created_at` | ISO Date | Creation timestamp | `2026-09-12T09:35:00.000Z` |
| `updated_at` | ISO Date | Last update timestamp | `2026-09-12T09:35:00.000Z` |
| `created_by` | String | Operator name / email | `ayush@batteryhub.in` |

---

## 7. `Battery_Tests`
Physical and electrical test records for received batteries.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `test_id` | String | Unique test ID | `TST-2026-000001` |
| `ticket_no` | String | Linked ticket number | `TKT-2026-000001` |
| `original_serial_no`| String | Battery serial tested | `'0094829103` |
| `test_date` | Date | Date of test | `2026-09-13` |
| `tested_by` | String | Technician name | `Sanjay Mistri` |
| `open_circuit_voltage`| Number | Static voltage (V) | `10.4` |
| `specific_gravity` | String | Cell gravity readings | `1.18, 1.18, 1.12, 1.18, 1.18, 1.18` |
| `load_test_voltage`| Number | Voltage under 15s load | `8.2` |
| `physical_condition`| String | Outer casing condition | `Clean, no bulging, terminal OK` |
| `test_result` | String | `PASS` or `REJECT` | `PASS` |
| `test_remarks` | String | Diagnostic conclusion | `Cell #3 dead. Eligible for warranty.` |
| `report_file_id`| String | Drive file ID of test slip | `1wXYZ...` |

---

## 8. `Claims`
Official manufacturer warranty claim records.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `claim_no` | String | Unique Claim ID | `CLM-2026-000001` |
| `ticket_no` | String | Originating Ticket ID | `TKT-2026-000001` |
| `source_type` | String | `CUSTOMER` or `DEALER` | `CUSTOMER` |
| `customer_name`| String | Customer Name | `Rahul S. Verma` |
| `mobile` | String | Mobile Number | `9876543210` |
| `address` | String | Address | `Flat 402, Sai Residency, Adajan` |
| `dealer_name` | String | Dealer Name (if applicable) | `` |
| `vehicle_number`| String | Vehicle Number | `GJ-05-CD-1234` |
| `battery_model`| String | Battery Model | `Amaron Pro 42B20R` |
| `original_serial_no`| String | Original serial number (text) | `'0094829103` |
| `date_of_sale` | Date | Original sale date | `2025-01-10` |
| `warranty_months`| Number | Total warranty duration | `36` |
| `warranty_expiry_date`| Date | Computed expiry date | `2028-01-10` |
| `warranty_status`| String | `IN_WARRANTY`, `OUT_OF_WARRANTY`, `UNKNOWN` | `IN_WARRANTY` |
| `claim_date` | Date | Date claim was drafted | `2026-09-13` |
| `status` | String | Claim lifecycle status | `READY_FOR_COMPANY` |
| `dispatch_batch_no`| String | Company dispatch ID | `DSP-2026-000001` |
| `company_challan_no`| String | Consolidated delivery challan | `DC-COM-2026-000001` |
| `company_dispatch_date`| Date | Date sent to company | `2026-09-15` |
| `replacement_model`| String | Model of received replacement | `Amaron Pro 42B20R` |
| `replacement_serial_no`| String | Serial of replacement battery | `'REP-9847120` |
| `replacement_received_date`| Date | Date replacement arrived | `2026-09-25` |
| `stock_status` | String | `PENDING`, `UPDATED`, `NOT_APPLICABLE` | `PENDING` |
| `stock_ref_no` | String | Inventory ERP/Busy voucher ref | `STK-REC-4901` |
| `stock_updated_date`| Date | Date updated in physical stock| `2026-09-26` |
| `stock_updated_by`| String | Staff member who updated stock | `ramesh@batteryhub.in` |
| `closed_date` | Date | Closure timestamp | `2026-09-26` |
| `remarks` | String | General remarks | `Replacement handed to customer` |
| `created_at` | ISO Date | Timestamp created | `2026-09-13T11:00:00.000Z` |
| `updated_at` | ISO Date | Timestamp updated | `2026-09-26T17:00:00.000Z` |

---

## 9. `Claim_Documents`
Document attachments linked to claims stored securely in Google Drive.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `doc_id` | String | Unique Document ID | `DOC-2026-000001` |
| `claim_no` | String | Linked Claim ID | `CLM-2026-000001` |
| `doc_type` | String | `INVOICE`, `WARRANTY_CARD`, `TEST_REPORT`, `CLAIM_FORM`, `OTHER` | `INVOICE` |
| `file_name` | String | Standardized filename | `CLM-2026-000001_Invoice.pdf` |
| `drive_file_id`| String | Google Drive File ID | `1aBCdEF...` |
| `mime_type` | String | MIME type | `application/pdf` |
| `file_size_kb`| Number | File size in kilobytes | `342` |
| `uploaded_at` | ISO Date | Upload timestamp | `2026-09-13T11:05:00.000Z` |
| `uploaded_by` | String | User email | `ayush@batteryhub.in` |

---

## 10. `Delivery_Challans`
Printed physical delivery challans for rejected battery returns and company dispatches.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `challan_no` | String | Unique Challan ID | `DC-RET-2026-000001` |
| `challan_type`| String | `BATTERY_RETURN` or `COMPANY_DISPATCH` | `BATTERY_RETURN` |
| `challan_date`| Date | Issuance date | `2026-09-14` |
| `recipient_type`| String | `CUSTOMER`, `DEALER`, `COMPANY` | `CUSTOMER` |
| `recipient_name`| String | Recipient entity | `Sunil Dave` |
| `mobile` | String | Recipient mobile | `9898012345` |
| `address` | String | Destination address | `Shop 4, Ring Road, Surat` |
| `ticket_no` | String | Linked Ticket (if return) | `TKT-2026-000002` |
| `battery_model`| String | Battery Model | `Amaron Fresh 35R` |
| `battery_serial_no`| String | Serial Number | `'0081273941` |
| `quantity` | Number | Quantity (strictly 1 for return) | `1` |
| `received_by_name`| String | Acknowledgement recipient name | `Sunil Dave` |
| `received_date`| Date | Date physical battery collected | `2026-09-14` |
| `status` | String | `GENERATED`, `ACKNOWLEDGED` | `ACKNOWLEDGED` |
| `remarks` | String | Challan remarks | `Tested rejected - deep discharge sulphation` |

---

## 11. `Company_Dispatches`
Consolidated dispatch batches sent to battery manufacturers.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `dispatch_batch_no`| String | Unique Batch ID | `DSP-2026-000001` |
| `company_name`| String | Battery Company Name | `Amaron Batteries Ltd.` |
| `destination`| String | Factory / Regional Depot | `Baroda Central Depot` |
| `company_challan_no`| String | Consolidated Challan ID | `DC-COM-2026-000001` |
| `dispatch_date`| Date | Date physically dispatched | `2026-09-15` |
| `carrier_transporter`| String | Logistics / Transporter | `Shree Tirupati Courier` |
| `lr_docket_no`| String | LR / Consignment Docket Number | `LR-994812` |
| `claim_count`| Number | Total claims in batch | `10` |
| `battery_count`| Number | Total batteries in batch | `10` |
| `created_by` | String | Dispatch operator | `ramesh@batteryhub.in` |
| `remarks` | String | Dispatch notes | `Packed in 2 crates` |

---

## 12. `Company_Dispatch_Items`
Itemized claims linked to each dispatch batch.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `item_id` | String | Item ID | `DPI-000001` |
| `dispatch_batch_no`| String | Linked Dispatch Batch | `DSP-2026-000001` |
| `claim_no` | String | Claim ID | `CLM-2026-000001` |
| `customer_name`| String | Customer Name | `Rahul S. Verma` |
| `battery_model`| String | Model | `Amaron Pro 42B20R` |
| `original_serial_no`| String | Original serial number | `'0094829103` |
| `warranty_status`| String | Warranty Status | `IN_WARRANTY` |

---

## 13. `Stock_Update_Log`
Action tasks generated when replacement batteries arrive to enforce manual stock reconciliation.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `stock_task_id`| String | Unique Stock Task ID | `STK-2026-000001` |
| `claim_no` | String | Linked Claim ID | `CLM-2026-000001` |
| `replacement_model`| String | Model received | `Amaron Pro 42B20R` |
| `replacement_serial_no`| String | Serial Number | `'REP-9847120` |
| `received_date`| Date | Receipt date | `2026-09-25` |
| `stock_status`| String | `UPDATE_REQUIRED` or `UPDATED` | `UPDATED` |
| `accounting_ref_no`| String | Tally / Busy voucher reference | `REC-VR-2026-402` |
| `updated_at` | ISO Date | Timestamp marked updated | `2026-09-26T14:20:00.000Z` |
| `updated_by` | String | Operator name | `ramesh@batteryhub.in` |
| `remarks` | String | Reconciliation remarks | `Entered in Main Godown physical stock` |

---

## 14. `Audit_Log`
Immutable, append-only log of every state change, override, and creation.

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `audit_id` | String | Unique audit ID | `AUD-2026-000001` |
| `timestamp` | ISO Date | Event timestamp (`Asia/Kolkata`) | `2026-09-25T16:30:12.000Z` |
| `user_email` | String | Operator email | `ayush@batteryhub.in` |
| `action` | String | Action type (`INTAKE`, `TEST`, `CLAIM_CREATE`, `DISPATCH`, `REPLACEMENT_RECEIVE`, `STOCK_UPDATE`, `CLOSE`) | `REPLACEMENT_RECEIVE` |
| `record_type`| String | Entity (`TICKET`, `CLAIM`, `CHALLAN`, `DISPATCH`) | `CLAIM` |
| `record_id` | String | Primary record ID | `CLM-2026-000001` |
| `old_status` | String | Prior status | `SENT_TO_COMPANY` |
| `new_status` | String | Updated status | `REPLACEMENT_RECEIVED` |
| `details` | String | Human-readable explanation | `Replacement battery REP-9847120 received` |
