/**
 * WarrantyService.gs
 * Server-side warranty expiry, guarantee, and pro-rata calculation based on Battery_Models master.
 */

var WarrantyService = (function () {
  var STATUS = {
    IN_WARRANTY: 'IN_WARRANTY',
    PRO_RATA: 'PRO_RATA',
    OUT_OF_WARRANTY: 'OUT_OF_WARRANTY',
    UNKNOWN: 'UNKNOWN'
  };

  var COVERAGE = {
    FULL_REPLACEMENT: 'FULL_REPLACEMENT',
    PRO_RATA: 'PRO_RATA',
    EXPIRED: 'EXPIRED',
    UNKNOWN: 'UNKNOWN'
  };

  /**
   * Find a model by ID, code, or commercial name.
   */
  function getModelDetails(modelQuery) {
    if (!modelQuery) return null;
    var models = Database.getRows('Battery_Models');
    var query = String(modelQuery).trim().toLowerCase();

    for (var i = 0; i < models.length; i++) {
      var m = models[i];
      var id = String(m.model_id || '').toLowerCase();
      var code = String(m.model_code || '').toLowerCase();
      var name = String(m.model_name || '').toLowerCase();

      if (id === query || code === query || name === query || (name && (name.indexOf(query) !== -1 || query.indexOf(name) !== -1))) {
        return m;
      }
    }
    return null;
  }

  /**
   * Get all active battery models for dropdowns and masters.
   */
  function getAllActiveModels() {
    var models = Database.getRows('Battery_Models');
    return models.filter(function (m) {
      return m.is_active === true || String(m.is_active).toUpperCase() === 'TRUE' || m.is_active === undefined || m.is_active === '';
    });
  }

  /**
   * Calculate warranty duration, expiration dates, and current warranty status.
   *
   * @param {string} batteryModel - Model ID or model name
   * @param {string|Date} dateOfSale - Original purchase date
   * @param {string|Date} [referenceDate] - Date of claim or today (defaults to now)
   * @return {Object} Calculation result
   */
  function calculateWarranty(batteryModel, dateOfSale, referenceDate) {
    var model = getModelDetails(batteryModel);
    var saleDate = Utils.parseDate(dateOfSale);
    var refDate = referenceDate ? Utils.parseDate(referenceDate) : new Date();
    if (!refDate || isNaN(refDate.getTime())) refDate = new Date();

    var totalMonths = model ? (parseInt(model.warranty_months, 10) || 0) : 0;
    var guaranteeMonths = model ? (parseInt(model.guarantee_months, 10) || 0) : 0;
    var proRataMonths = model ? (parseInt(model.pro_rata_months, 10) || 0) : 0;

    if (!model && batteryModel) {
      var rawQ = String(batteryModel);
      var plusMatch = rawQ.match(/(\d{1,2})\s*[\+\/]\s*(\d{1,2})/);
      if (plusMatch) {
        guaranteeMonths = parseInt(plusMatch[1], 10);
        proRataMonths = parseInt(plusMatch[2], 10);
        totalMonths = guaranteeMonths + proRataMonths;
      } else {
        var mMatch = rawQ.match(/(\d{1,2})\s*(?:m\b|months)/i);
        if (mMatch) {
          totalMonths = parseInt(mMatch[1], 10);
          guaranteeMonths = Math.round(totalMonths / 2);
          proRataMonths = totalMonths - guaranteeMonths;
        }
      }
    }

    if (totalMonths <= 0) totalMonths = 36;
    if (guaranteeMonths <= 0) guaranteeMonths = Math.round(totalMonths / 2);
    if (proRataMonths <= 0) proRataMonths = Math.max(0, totalMonths - guaranteeMonths);

    if (!saleDate || isNaN(saleDate.getTime())) {
      return {
        model_found: !!model,
        battery_model: batteryModel,
        brand: model ? model.brand : '',
        capacity_ah: model ? model.capacity_ah : '',
        warranty_months: totalMonths,
        totalWarrantyMonths: totalMonths,
        guarantee_months: guaranteeMonths,
        pro_rata_months: proRataMonths,
        date_of_sale: '',
        date_of_sale_formatted: '-',
        warranty_expiry_date: '',
        expiryDate: '',
        warranty_expiry_formatted: '-',
        guarantee_expiry_date: '',
        guarantee_expiry_formatted: '-',
        warranty_status: STATUS.IN_WARRANTY,
        status: STATUS.IN_WARRANTY,
        coverage_type: COVERAGE.UNKNOWN,
        days_remaining: 0,
        is_in_warranty: false,
        remarks: !model ? 'Battery model not found in master' : 'Valid Date of Sale required for calculation'
      };
    }

    var warrantyExpiry = Utils.addMonths(saleDate, totalMonths);
    var guaranteeExpiry = guaranteeMonths > 0 ? Utils.addMonths(saleDate, guaranteeMonths) : saleDate;

    // Normalizing time components for pure date comparison
    var refMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    var expMidnight = new Date(warrantyExpiry.getFullYear(), warrantyExpiry.getMonth(), warrantyExpiry.getDate());
    var gExpMidnight = new Date(guaranteeExpiry.getFullYear(), guaranteeExpiry.getMonth(), guaranteeExpiry.getDate());

    var isInWarranty = refMidnight <= expMidnight;
    var warrantyStatus = isInWarranty ? STATUS.IN_WARRANTY : STATUS.OUT_OF_WARRANTY;
    var coverageType = COVERAGE.EXPIRED;

    if (isInWarranty) {
      if (refMidnight <= gExpMidnight) {
        coverageType = COVERAGE.FULL_REPLACEMENT;
        warrantyStatus = STATUS.IN_WARRANTY;
      } else {
        coverageType = COVERAGE.PRO_RATA;
        warrantyStatus = STATUS.PRO_RATA;
      }
    }

    var diffDays = Math.floor((expMidnight.getTime() - refMidnight.getTime()) / (1000 * 60 * 60 * 24));
    var expIso = Utils.toIsoDate(warrantyExpiry);

    return {
      model_found: !!model,
      battery_model: (model && model.model_name) ? model.model_name : batteryModel,
      brand: model ? model.brand : '',
      capacity_ah: model ? model.capacity_ah : '',
      warranty_months: totalMonths,
      totalWarrantyMonths: totalMonths,
      guarantee_months: guaranteeMonths,
      pro_rata_months: proRataMonths,
      date_of_sale: Utils.toIsoDate(saleDate),
      date_of_sale_formatted: Utils.formatDateIndian(saleDate),
      warranty_expiry_date: expIso,
      expiryDate: expIso,
      warranty_expiry_formatted: Utils.formatDateIndian(warrantyExpiry),
      guarantee_expiry_date: Utils.toIsoDate(guaranteeExpiry),
      guarantee_expiry_formatted: Utils.formatDateIndian(guaranteeExpiry),
      warranty_status: warrantyStatus,
      status: warrantyStatus,
      coverage_type: coverageType,
      days_remaining: Math.max(0, diffDays),
      days_expired: diffDays < 0 ? Math.abs(diffDays) : 0,
      is_in_warranty: isInWarranty,
      remarks: isInWarranty
        ? (coverageType === COVERAGE.FULL_REPLACEMENT ? '100% Free Replacement Guarantee' : 'Eligible under Pro-Rata Warranty')
        : 'Battery warranty expired on ' + Utils.formatDateIndian(warrantyExpiry)
    };
  }

  return {
    STATUS: STATUS,
    COVERAGE: COVERAGE,
    getModelDetails: getModelDetails,
    getAllActiveModels: getAllActiveModels,
    getActiveModels: getAllActiveModels,
    calculateWarranty: calculateWarranty,
    evaluateWarranty: calculateWarranty
  };
})();
