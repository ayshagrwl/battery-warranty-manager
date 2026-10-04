/**
 * Setup.gs
 * Application initialization for the 14-sheet schema, text number formats, initial configurations,
 * and realistic Indian battery distributor demo dataset seeder.
 */

/**
 * Initializes the 14 Google Sheets database tabs with formatted header rows,
 * sets column text number formats (@) for battery serials and contact numbers,
 * writes default configuration keys, and seeds battery model and dealer masters.
 *
 * @return {boolean} True on success
 */
function setupApplication() {
  return Database.setupDatabase();
}

/**
 * Populates realistic sample cases for an Indian battery service center (Amaron & Exide):
 * - Ticket 1: Fresh customer intake with service loaner battery
 * - Ticket 2: Under testing
 * - Ticket 3: Rejected battery with generated & acknowledged Return Delivery Challan (Qty 1, no price/tax)
 * - Ticket 4: Passed testing, warranty claim generated, sent to company
 * - Ticket 5: Sent to company, replacement battery received with separate serial number, pending ERP stock update
 *
 * @return {boolean} True on success
 */
function seedDemoData() {
  return Database.seedDemoData();
}
