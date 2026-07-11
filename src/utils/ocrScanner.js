// OCR Scanner Utility Module
// Provides real OCR scanning via Tesseract.js and text extraction/parsing

import Tesseract from 'tesseract.js';

/**
 * Convert a PDF file (first page) to a canvas for OCR processing
 * Uses a dynamic import of pdf.js to avoid bundle size issues
 */
export async function convertPdfToCanvas(file, addLog) {
  if (addLog) addLog('Loading PDF renderer...');
  // Dynamically import pdfjs-dist inside the function scope
  const pdfjsLib = await import(/* @vite-ignore */ 'pdfjs-dist');
  
  // Set worker source for pdf.js using CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 2.5 }); // Higher scale for better OCR
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d');

  await page.render({ canvasContext: context, viewport }).promise;
  
  if (addLog) addLog('PDF page 1 rendered to canvas successfully.');
  return canvas;
}

/**
 * Perform real OCR using Tesseract.js with progress tracking
 * @param {File|HTMLCanvasElement} source - Image file or canvas element
 * @param {Function} onStatus - Callback for status messages
 * @param {Function} onProgress - Callback for progress percentage
 * @returns {Promise<string>} Extracted raw text
 */
export async function performRealOCR(source, onStatus, onProgress) {
  // Determine if source is a file or canvas
  let imageData;

  if (source instanceof HTMLCanvasElement) {
    imageData = source.toDataURL('image/png');
    if (onStatus) onStatus('Canvas image converted to data URL...');
  } else if (source instanceof File) {
    imageData = source;
    if (onStatus) onStatus(`File selected: ${source.name} (${(source.size / 1024).toFixed(0)} KB)`);
  } else if (typeof source === 'string' && source.startsWith('data:')) {
    imageData = source;
  } else {
    throw new Error('Unsupported source type for OCR. Provide a File, Canvas, or data URL.');
  }

  if (onStatus) onStatus('Initializing Tesseract.js worker...');
  if (onProgress) onProgress(10);

  const worker = await Tesseract.createWorker('eng+ara', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        if (onProgress) onProgress(Math.min(95, 10 + Math.round(m.progress * 85)));
      }
      if (onStatus && m.status) {
        if (['loading tesseract core', 'initializing tesseract', 'loading language traineddata', 'initializing api'].includes(m.status)) {
          onStatus(`Tesseract: ${m.status}...`);
        }
      }
    }
  });

  if (onStatus) onStatus('Worker created. Running OCR recognition...');
  if (onProgress) onProgress(15);

  const { data } = await worker.recognize(imageData);

  if (onStatus) onStatus('OCR recognition complete.');
  if (onProgress) onProgress(100);

  await worker.terminate();

  return data.text;
}

/**
 * Parse extracted OCR text and extract structured fields based on document type
 * @param {string} rawText - Raw text from OCR
 * @param {string} activeTab - Document type tab name
 * @returns {Object} Parsed fields object
 */
export function parseExtractedText(rawText, activeTab) {
  const extractedFields = {};
  const debugDates = [];
  const debugValidityDates = [];

  let docNumber = '';
  let startDate = '';
  let expiryDate = '';

  // Common date patterns
  const datePatterns = [
    /\b(\d{4}[-/]\d{2}[-/]\d{2})\b/g,        // YYYY-MM-DD or YYYY/MM/DD
    /\b(\d{2}[-/]\d{2}[-/]\d{4})\b/g,        // DD-MM-YYYY or MM-DD-YYYY
    /\b(\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/gi, // 01 Jan 2024
  ];

  // Collect all dates
  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(rawText)) !== null) {
      debugDates.push(match[1]);
    }
  }

  // Try to identify issue/expiry dates using context
  const issueKeywords = ['issue', 'issuing', 'date of issue', 'issued on', 'date issued', 'valid from', 'start date'];
  const expiryKeywords = ['expir', 'valid until', 'valid thru', 'valid through', 'expiry date', 'expiration', 'end date'];

  // Convert text to lines for context analysis
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Check for issue dates
    for (const keyword of issueKeywords) {
      if (line.includes(keyword)) {
        // Look for dates in current or next line
        const dateMatch = lines[i].match(/\b(\d{1,4}[-/]\d{1,2}[-/]\d{1,4})\b/) || 
                         (i + 1 < lines.length ? lines[i + 1].match(/\b(\d{1,4}[-/]\d{1,2}[-/]\d{1,4})\b/) : null);
        if (dateMatch) {
          startDate = normalizeDate(dateMatch[1]);
          debugValidityDates.push(`Issue: ${startDate}`);
        }
      }
    }

    // Check for expiry dates
    for (const keyword of expiryKeywords) {
      if (line.includes(keyword)) {
        const dateMatch = lines[i].match(/\b(\d{1,4}[-/]\d{1,2}[-/]\d{1,4})\b/) ||
                         (i + 1 < lines.length ? lines[i + 1].match(/\b(\d{1,4}[-/]\d{1,2}[-/]\d{1,4})\b/) : null);
        if (dateMatch) {
          expiryDate = normalizeDate(dateMatch[1]);
          debugValidityDates.push(`Expiry: ${expiryDate}`);
        }
      }
    }
  }

  // Fallback: if no contextual dates found, use the first two dates found
  if (!startDate && debugDates.length > 0) {
    startDate = normalizeDate(debugDates[0]);
  }
  if (!expiryDate && debugDates.length > 1) {
    expiryDate = normalizeDate(debugDates[1]);
  }

  // Extract document number based on type
  if (activeTab === 'Emirates ID') {
    // Emirates ID format: 784-XXXX-XXXXXXX-X
    const eidMatch = rawText.match(/(\d{3}[-]\d{4}[-]\d{7}[-]\d{1})/);
    if (eidMatch) docNumber = eidMatch[1];

    // Extract other fields
    const nameMatch = extractName(rawText);
    if (nameMatch) extractedFields.fullName = nameMatch;

    const nationalityMatch = extractField(rawText, ['nationality', 'national']);
    if (nationalityMatch) extractedFields.nationality = nationalityMatch;

    const dobMatch = rawText.match(/\b(\d{2}[-/]\d{2}[-/]\d{4})\b.*(?:birth|dob|date of birth)/i) ||
                     rawText.match(/(?:birth|dob|date of birth).*?(\d{2}[-/]\d{2}[-/]\d{4})/i) ||
                     rawText.match(/\b(\d{4}[-/]\d{2}[-/]\d{2})\b/);
    if (dobMatch) extractedFields.dob = normalizeDate(dobMatch[1]);

    const cardMatch = rawText.match(/\b(\d{9,10})\b/);
    if (cardMatch) extractedFields.cardNumber = cardMatch[1];

    const sexMatch = rawText.match(/\b(MALE|FEMALE|M|F)\b/i);
    if (sexMatch) extractedFields.sex = sexMatch[1].toUpperCase();

    const occupationMatch = extractField(rawText, ['occupation', 'job title', 'profession']);
    if (occupationMatch) extractedFields.occupation = occupationMatch;

    const employerMatch = extractField(rawText, ['employer', 'sponsor', 'company', 'establishment']);
    if (employerMatch) extractedFields.employer = employerMatch;

    const placeMatch = extractField(rawText, ['issuing place', 'place of issue', 'issued at']);
    if (placeMatch) extractedFields.issuingPlace = placeMatch;

  } else if (activeTab === 'Visa') {
    // Visa: look for visa/resident ID patterns
    const visaMatch = rawText.match(/(\d{3}\/\d{4}\/\d{6,7})/);
    if (visaMatch) docNumber = visaMatch[1];

    const nameMatch = extractName(rawText);
    if (nameMatch) extractedFields.fullName = nameMatch;

    const passportMatch = rawText.match(/\b([A-Z]{1,2}\d{6,7})\b/);
    if (passportMatch) extractedFields.passportNumber = passportMatch[1];

    const fileMatch = rawText.match(/\b(\d{6,8})\b/);
    if (fileMatch && !docNumber) extractedFields.fileNumber = fileMatch[1];

    const placeMatch = extractField(rawText, ['place of issue', 'issuing place', 'issued at']);
    if (placeMatch) extractedFields.issuingPlace = placeMatch;

    const employerMatch = extractField(rawText, ['sponsor', 'employer', 'company']);
    if (employerMatch) extractedFields.employer = employerMatch;

  } else if (activeTab === 'Passport') {
    const passportMatch = rawText.match(/\b([A-Z]{1,2}\d{6,7})\b/);
    if (passportMatch) docNumber = passportMatch[1];

    const nameMatch = extractName(rawText);
    if (nameMatch) extractedFields.fullName = nameMatch;

  } else if (activeTab === 'Labour Card') {
    const labourMatch = rawText.match(/L[-]\d{6,8}/);
    if (labourMatch) docNumber = labourMatch[0];

    const permitMatch = rawText.match(/WP[-]\d{5,7}/i) || rawText.match(/work\s*permit\s*[:#]?\s*(\d{6,8})/i);
    if (permitMatch) extractedFields.workPermitNo = permitMatch[1] || permitMatch[0];

  } else if (activeTab === 'ILOE') {
    const iloeMatch = rawText.match(/ILOE[-]\d{4}[-]\d{2}/) || rawText.match(/policy\s*(?:no|#|number)[:\s]*([A-Z0-9-]+)/i);
    if (iloeMatch) docNumber = iloeMatch[0] || iloeMatch[1];

    const insMatch = extractField(rawText, ['insurance', 'provider', 'company']);
    if (insMatch) extractedFields.insuranceCompany = insMatch;

  } else if (activeTab === 'Health Card') {
    const healthMatch = rawText.match(/HC[-]\d{4,6}[-][A-Z]{2,3}/);
    if (healthMatch) docNumber = healthMatch[0];

    const networkMatch = extractField(rawText, ['network', 'plan', 'tier']);
    if (networkMatch) extractedFields.network = networkMatch;

  } else if (activeTab === 'Drivers License') {
    const dlMatch = rawText.match(/DL[-]\d{5,7}[-][A-Z]{2,3}/);
    if (dlMatch) docNumber = dlMatch[0];

    const classMatch = rawText.match(/class\s*[:#]?\s*([A-Za-z0-9\s()]+)/i);
    if (classMatch) extractedFields.class = classMatch[1].trim();
  }

  return {
    docNumber,
    startDate,
    expiryDate,
    extractedFields,
    debugDates,
    debugValidityDates
  };
}

/**
 * Normalize date to YYYY-MM-DD format
 */
function normalizeDate(dateStr) {
  if (!dateStr) return '';
  
  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  // Handle YYYY/MM/DD → YYYY-MM-DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
    return dateStr.replace(/\//g, '-');
  }

  // Handle DD-MM-YYYY or DD/MM/YYYY → YYYY-MM-DD
  const dmyMatch = dateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  }

  // Handle "01 Jan 2024" format
  const monthNames = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const textDateMatch = dateStr.match(/(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i);
  if (textDateMatch) {
    const month = monthNames[textDateMatch[2].toLowerCase().substring(0, 3)];
    if (month) return `${textDateMatch[3]}-${month}-${textDateMatch[1]}`;
  }

  return dateStr;
}

/**
 * Extract a field value following a keyword in OCR text
 */
function extractField(text, keywords) {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}\\s*[:#]?\\s*([A-Za-z0-9\\s/&-]+)`, 'i');
    const match = regex.exec(lowerText);
    if (match) {
      const value = match[1].trim();
      if (value.length > 1 && value.length < 60) {
        return value.replace(/\s+/g, ' ').toUpperCase();
      }
    }
  }
  return null;
}

/**
 * Extract a person's name from OCR text
 */
function extractName(text) {
  if (!text) return null;
  
  // Look for name after common labels
  const namePatterns = [
    /name\s*[:#]?\s*([A-Za-z\s']{5,40})/i,
    /full\s*name\s*[:#]?\s*([A-Za-z\s']{5,40})/i,
    /holder\s*name\s*[:#]?\s*([A-Za-z\s']{5,40})/i,
    /surname\s*[:#]?\s*([A-Za-z\s']{3,30})/i,
    /given\s*names?\s*[:#]?\s*([A-Za-z\s']{3,30})/i,
  ];

  for (const pattern of namePatterns) {
    const match = pattern.exec(text);
    if (match) {
      const name = match[1].trim();
      if (name.length >= 3) return name.toUpperCase();
    }
  }

  return null;
}