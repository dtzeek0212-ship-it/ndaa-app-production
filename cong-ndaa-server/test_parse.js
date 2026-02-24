const fs = require('fs');
const PDFParser = require('pdf-parse');
console.log(typeof PDFParser);
// Sometimes it's pdf-parse/lib/pdf.js
const libPdf = require('pdf-parse/lib/pdf.js');
console.log(typeof libPdf);
