/**
 * DriveService.gs
 * Hierarchical Google Drive folder structuring, file uploads, and document attachment linking.
 */

var DriveService = (function () {
  var ROOT_FOLDER_NAME = 'Battery Warranty System';

  /**
   * Retrieve or create a child folder safely within a parent folder.
   */
  function getOrCreateFolder(parent, name) {
    var folders = parent.getFoldersByName(name);
    if (folders.hasNext()) {
      return folders.next();
    }
    return parent.createFolder(name);
  }

  /**
   * Retrieve the root Google Drive storage folder.
   */
  function getRootFolder() {
    var rootId = Config.get('DRIVE_ROOT_FOLDER_ID');
    if (!rootId) {
      rootId = PropertiesService.getScriptProperties().getProperty('DRIVE_ROOT_FOLDER_ID');
    }

    if (rootId) {
      try {
        return DriveApp.getFolderById(rootId);
      } catch (e) {
        Logger.log('DriveService: Provided DRIVE_ROOT_FOLDER_ID invalid or inaccessible: ' + e.toString());
      }
    }

    // Fallback: Find in Drive root or create
    var roots = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
    if (roots.hasNext()) {
      var folder = roots.next();
      Config.set('DRIVE_ROOT_FOLDER_ID', folder.getId());
      return folder;
    }

    var newRoot = DriveApp.createFolder(ROOT_FOLDER_NAME);
    Config.set('DRIVE_ROOT_FOLDER_ID', newRoot.getId());
    return newRoot;
  }

  /**
   * Retrieve or create a subfolder within a claim's directory.
   * Path: Battery Warranty System / Claims / <claimNo> / <subfolderName>
   */
  function getClaimFolder(claimNo, subfolderName) {
    var root = getRootFolder();
    var claimsFolder = getOrCreateFolder(root, 'Claims');
    var claimDir = getOrCreateFolder(claimsFolder, claimNo);

    if (subfolderName) {
      return getOrCreateFolder(claimDir, subfolderName);
    }
    return claimDir;
  }

  /**
   * Upload and link a document to a claim.
   *
   * @param {string} claimNo - Linked Claim ID
   * @param {string} docType - INVOICE, WARRANTY_CARD, TEST_REPORT, CLAIM_FORM, OTHER
   * @param {string} originalFileName - Original filename
   * @param {string} base64Data - Base64 encoded payload
   * @param {string} mimeType - MIME type string
   * @return {Object} Document metadata record
   */
  function uploadDocument(claimNo, docType, originalFileName, base64Data, mimeType) {
    if (!claimNo) throw new Error('Claim number is required for document upload');
    var claim = Database.getRowById('Claims', 'claim_no', claimNo);
    if (!claim) throw new Error('Claim ' + claimNo + ' not found');

    var type = String(docType || 'OTHER').toUpperCase();
    var targetFolder = getClaimFolder(claimNo, 'Documents');

    // Clean filename
    var safeName = String(originalFileName || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    var finalFileName = claimNo + '_' + type + '_' + safeName;

    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, mimeType || 'application/octet-stream', finalFileName);
    var file = targetFolder.createFile(blob);

    var currentYear = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy');
    var docId = 'DOC-' + currentYear + '-' + Utilities.getUuid().substring(0, 6).toUpperCase();
    var fileSizeKb = Math.round(blob.getBytes().length / 1024);
    var userEmail = Utils.getCurrentUserEmail();
    var nowIso = new Date().toISOString();

    var docRecord = {
      doc_id: docId,
      claim_no: claimNo,
      doc_type: type,
      file_name: finalFileName,
      drive_file_id: file.getId(),
      mime_type: mimeType || 'application/octet-stream',
      file_size_kb: fileSizeKb,
      uploaded_at: nowIso,
      uploaded_by: userEmail
    };

    Database.appendRow('Claim_Documents', docRecord);

    // If claim was in CLAIM_CREATED, automatically mark READY_FOR_COMPANY
    if (claim.status === 'CLAIM_CREATED') {
      Database.updateRow('Claims', 'claim_no', claimNo, {
        status: 'READY_FOR_COMPANY',
        updated_at: nowIso
      });
      Database.updateRow('Tickets', 'ticket_no', claim.ticket_no, {
        status: 'READY_FOR_COMPANY',
        updated_at: nowIso
      });
      AuditService.log(
        'STATUS_CHANGE',
        AuditService.RECORD_TYPE.CLAIM,
        claimNo,
        'CLAIM_CREATED',
        'READY_FOR_COMPANY',
        'Documents uploaded; claim marked ready for company dispatch'
      );
    }

    AuditService.log(
      'DOC_UPLOAD',
      AuditService.RECORD_TYPE.CLAIM,
      claimNo,
      '',
      '',
      'Uploaded ' + type + ' document: ' + finalFileName + ' (' + fileSizeKb + ' KB)',
      userEmail
    );

    docRecord.file_url = file.getUrl();
    return docRecord;
  }

  /**
   * Retrieve all uploaded documents for a claim.
   */
  function getClaimDocuments(claimNo) {
    var rows = Database.getRows('Claim_Documents');
    var target = String(claimNo).trim();
    var results = [];

    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].claim_no).trim() === target) {
        var r = rows[i];
        r.uploaded_at_formatted = Utils.formatDateTimeIndian(r.uploaded_at);
        r.file_url = 'https://drive.google.com/file/d/' + r.drive_file_id + '/view';
        results.push(r);
      }
    }
    return results;
  }

  /**
   * Save generated HTML or PDF into Drive folder and return file metadata.
   */
  function saveGeneratedPdf(folderCategory, fileName, htmlContent) {
    var root = getRootFolder();
    var targetFolder = getOrCreateFolder(root, folderCategory || 'Generated Documents');
    var blob = Utilities.newBlob(htmlContent, 'text/html', fileName + '.html').getAs('application/pdf');
    blob.setName(fileName + '.pdf');
    var file = targetFolder.createFile(blob);
    return {
      file_id: file.getId(),
      file_name: file.getName(),
      file_url: file.getUrl()
    };
  }

  return {
    getRootFolder: getRootFolder,
    getClaimFolder: getClaimFolder,
    uploadDocument: uploadDocument,
    getClaimDocuments: getClaimDocuments,
    saveGeneratedPdf: saveGeneratedPdf
  };
})();
