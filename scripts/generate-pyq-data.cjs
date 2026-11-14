const fs = require('fs');
const path = require('path');

const pyqPapersPath = 'D:/hemu/hemu_2k26/PLAN-A/previous year question papers';
const outputPath = path.join(__dirname, '../src/data/pyq-papers-data.json');

// Function to categorize a file based on keywords - more specific patterns with priority
function categorizePaper(fileName) {
  const lower = fileName.toLowerCase();
  
  // Most specific patterns first (higher priority)
  
  // CSAT Paper 2 - must come before CSAT Paper 1
  if ((lower.includes('csp') || lower.includes('pre')) && 
      (lower.includes('paper ii') || lower.includes('paper-ii') || lower.includes('paper 2'))) return { type: 'csat-p2', priority: 2 };
  
  // CSAT Paper 1
  if ((lower.includes('csp') || lower.includes('pre')) && 
      (lower.includes('paper i') || lower.includes('paper-i') || lower.includes('paper 1'))) return { type: 'csat-p1', priority: 1 };
  
  // GS Paper IV - most specific Roman numeral
  if ((lower.includes('gen') || lower.includes('general')) && lower.includes('paper iv')) return { type: 'gs4', priority: 6 };
  if ((lower.includes('gen') || lower.includes('general')) && lower.includes('stud') && lower.includes('iv')) return { type: 'gs4', priority: 6 };
  if ((lower.includes('gen') || lower.includes('general')) && lower.includes('p4')) return { type: 'gs4', priority: 6 };
  
  // GS Paper III
  if ((lower.includes('gen') || lower.includes('general')) && lower.includes('paper iii')) return { type: 'gs3', priority: 5 };
  if ((lower.includes('gen') || lower.includes('general')) && lower.includes('stud') && lower.includes('iii')) return { type: 'gs3', priority: 5 };
  if ((lower.includes('gen') || lower.includes('general')) && lower.includes('p3')) return { type: 'gs3', priority: 5 };
  
  // GS Paper II
  if ((lower.includes('gen') || lower.includes('general')) && lower.includes('paper ii')) return { type: 'gs2', priority: 4 };
  if ((lower.includes('gen') || lower.includes('general')) && lower.includes('stud') && lower.includes('ii')) return { type: 'gs2', priority: 4 };
  if ((lower.includes('gen') || lower.includes('general')) && lower.includes('p2')) return { type: 'gs2', priority: 4 };
  
  // GS Paper I
  if ((lower.includes('gen') || lower.includes('general')) && lower.includes('paper i')) return { type: 'gs1', priority: 3 };
  if ((lower.includes('gen') || lower.includes('general')) && lower.includes('stud') && lower.includes('i')) return { type: 'gs1', priority: 3 };
  if ((lower.includes('gen') || lower.includes('general')) && lower.includes('p1')) return { type: 'gs1', priority: 3 };
  
  // PSIR Paper 2 - must come before PSIR Paper 1
  if (lower.includes('pol') && lower.includes('paper-ii')) return { type: 'psir2', priority: 11 };
  if (lower.includes('pol') && lower.includes('paper ii')) return { type: 'psir2', priority: 11 };
  if (lower.includes('pol') && lower.includes('paper-2')) return { type: 'psir2', priority: 11 };
  if (lower.includes('pol') && lower.includes('paper 2')) return { type: 'psir2', priority: 11 };
  
  // PSIR Paper 1
  if (lower.includes('pol') && lower.includes('paper-i')) return { type: 'psir1', priority: 10 };
  if (lower.includes('pol') && lower.includes('paper i')) return { type: 'psir1', priority: 10 };
  if (lower.includes('pol') && lower.includes('paper-1')) return { type: 'psir1', priority: 10 };
  if (lower.includes('pol') && lower.includes('paper 1')) return { type: 'psir1', priority: 10 };
  
  // Broader patterns (lower priority)
  
  // CSAT (pre-2011) - must come after CSP patterns
  if (lower.includes('csat')) return { type: 'csat', priority: 1 };
  
  // English
  if (lower.includes('english') || (lower.includes('eng') && !lower.includes('essay'))) return { type: 'english', priority: 7 };
  
  // Telugu
  if (lower.includes('telugu') || lower.includes('telu')) return { type: 'telugu', priority: 8 };
  
  // Essay
  if (lower.includes('essay')) return { type: 'essay', priority: 9 };
  
  return { type: 'unknown', priority: 99 };
}

// Function to get standardized name based on type and year range
function getStandardizedName(type, year) {
  const yearNum = parseInt(year);
  
  if (yearNum >= 2000 && yearNum <= 2009) {
    return 'CSAT';
  }
  
  const nameMap = {
    'csat': 'CSAT',
    'csat-p1': 'CSAT-P1',
    'csat-p2': 'CSAT-P2',
    'gs1': 'GS Paper I',
    'gs2': 'GS Paper II', 
    'gs3': 'GS Paper III',
    'gs4': 'GS Paper IV',
    'english': 'English',
    'telugu': 'Telugu',
    'essay': 'Essay',
    'psir1': 'PSIR-1',
    'psir2': 'PSIR-2'
  };
  
  return nameMap[type] || 'Unknown';
}

// Function to get expected paper count for a year
function getExpectedPaperCount(year) {
  const yearNum = parseInt(year);
  if (yearNum >= 2000 && yearNum <= 2009) return 1;
  if (yearNum === 2010) return 6;
  if (yearNum >= 2011 && yearNum <= 2012) return 7;
  return 11;
}

// Read the pyq-papers directory
const years = fs.readdirSync(pyqPapersPath)
  .filter(year => {
    const yearPath = path.join(pyqPapersPath, year);
    return fs.statSync(yearPath).isDirectory() && /^\d{4}$/.test(year);
  })
  .sort((a, b) => parseInt(b) - parseInt(a)); // Sort descending (newest first)

const pyqData = [];

years.forEach(year => {
  const yearPath = path.join(pyqPapersPath, year);
  const pdfFiles = fs.readdirSync(yearPath)
    .filter(file => file.endsWith('.pdf'));
  
  // Process each PDF file to categorize it
  const processedPapers = pdfFiles.map((pdfFile, index) => {
    const category = categorizePaper(pdfFile);
    const standardizedName = getStandardizedName(category.type, year);

    return {
      id: `${year}_${standardizedName.replace(/\s+/g, '_').toLowerCase()}_${index}`,
      name: standardizedName,
      fileName: pdfFile, // Keep actual file name for reference
      category: category.type,
      priority: category.priority
    };
  });
  
  // Sort papers by priority (category) to ensure correct order
  processedPapers.sort((a, b) => a.priority - b.priority);
  
  pyqData.push({
    year: year,
    paperCount: processedPapers.length,
    papers: processedPapers
  });
});

// Write to JSON file
fs.writeFileSync(outputPath, JSON.stringify(pyqData, null, 2));

console.log(`Generated PYQ data for ${years.length} years`);
console.log(`Output: ${outputPath}`);

// Show sample data for different year ranges
const sample2005 = pyqData.find(d => d.year === '2005');
const sample2010 = pyqData.find(d => d.year === '2010');
const sample2011 = pyqData.find(d => d.year === '2011');
const sample2024 = pyqData.find(d => d.year === '2024');

if (sample2005) {
  console.log('\n=== Sample 2005 (1 paper) ===');
  console.log(JSON.stringify(sample2005, null, 2));
}
if (sample2010) {
  console.log('\n=== Sample 2010 (6 papers) ===');
  console.log(JSON.stringify(sample2010, null, 2));
}
if (sample2011) {
  console.log('\n=== Sample 2011 (7 papers) ===');
  console.log(JSON.stringify(sample2011, null, 2));
}
if (sample2024) {
  console.log('\n=== Sample 2024 (11 papers) ===');
  console.log(JSON.stringify(sample2024, null, 2));
}
