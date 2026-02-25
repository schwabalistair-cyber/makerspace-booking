// Certification requirements config — single source of truth
// type: 'area' = blocks booking, 'tool' = display only
// method: 'class' | 'private_instruction' | 'self_directed'

const CERT_REQUIREMENTS = {
  // Area-level certs (block booking)
  '3D Printer': {
    type: 'area',
    method: 'class',
    qualifyingClasses: ['Intro to 3D Printing'],
    message: 'Complete "Intro to 3D Printing" to earn this certification.'
  },
  'Boss Laser': {
    type: 'area',
    method: 'class',
    qualifyingClasses: ['Intro to Boss Laser'],
    message: 'Complete "Intro to Boss Laser" to earn this certification.'
  },
  'CNC Plasma': {
    type: 'area',
    method: 'class',
    qualifyingClasses: ['Plasma CNC Workshop'],
    message: 'Complete "Plasma CNC Workshop" to earn this certification.'
  },
  'Forge': {
    type: 'area',
    method: 'class',
    qualifyingClasses: ['Blacksmithing 101'],
    message: 'Complete "Blacksmithing 101" to earn this certification.'
  },
  'Fused Glass': {
    type: 'area',
    method: 'class',
    qualifyingClasses: ['Stained Glass 101', 'Flower Bouquets', 'Intro to Fused Glass', 'Fused Glass 102'],
    message: 'Complete any glass class (Stained Glass 101, Flower Bouquets, Intro to Fused Glass, or Fused Glass 102) to earn this certification.'
  },
  'Glass Studio': {
    type: 'area',
    method: 'class',
    qualifyingClasses: ['Stained Glass 101', 'Flower Bouquets', 'Intro to Fused Glass', 'Fused Glass 102'],
    message: 'Complete any glass class (Stained Glass 101, Flower Bouquets, Intro to Fused Glass, or Fused Glass 102) to earn this certification.'
  },
  'Glowforge': {
    type: 'area',
    method: 'self_directed',
    qualifyingClasses: [],
    message: 'Pass the self-directed Glowforge proficiency test to earn this certification.'
  },
  'Jewelry Bench': {
    type: 'area',
    method: 'class',
    qualifyingClasses: ['Metal Cuff or Bangle', 'Intro to Jewelry Soldering', 'Intro to Metalsmithing', 'Bezel Setting'],
    message: 'Complete any jewelry class (Metal Cuff or Bangle, Intro to Jewelry Soldering, Intro to Metalsmithing, or Bezel Setting) to earn this certification.'
  },
  'Metal Lathes - Grizzly Mill': {
    type: 'area',
    method: 'private_instruction',
    qualifyingClasses: [],
    message: 'Request private instruction to earn this certification.'
  },
  'Metal Lathes - Metal Lathe': {
    type: 'area',
    method: 'private_instruction',
    qualifyingClasses: [],
    message: 'Request private instruction to earn this certification.'
  },
  'Metal Lathes - Small Metal Lathe': {
    type: 'area',
    method: 'private_instruction',
    qualifyingClasses: [],
    message: 'Request private instruction to earn this certification.'
  },
  'Sewing Space': {
    type: 'area',
    method: 'private_instruction',
    qualifyingClasses: [],
    message: 'Request private instruction to earn this certification.'
  },
  'Wood Lathe - Mini Jet': {
    type: 'area',
    method: 'class',
    qualifyingClasses: ['Wood Turning 101'],
    message: 'Complete "Wood Turning 101" to earn this certification.'
  },
  'Wood Lathe - Non-Powermatic': {
    type: 'area',
    method: 'class',
    qualifyingClasses: ['Wood Turning 101'],
    message: 'Complete "Wood Turning 101" to earn this certification.'
  },
  'Wood Lathe - Powermatic': {
    type: 'area',
    method: 'class',
    qualifyingClasses: ['Wood Turning 202: Intermediate Bowl Techniques'],
    message: 'Complete "Wood Turning 202: Intermediate Bowl Techniques" to earn this certification.'
  },
  'Xcarve CNC': {
    type: 'area',
    method: 'class',
    qualifyingClasses: ['Intro to Wood Carving'],
    message: 'Complete "Intro to Wood Carving" to earn this certification.'
  },
  'Lapidary': {
    type: 'area',
    method: 'class',
    qualifyingClasses: ['Intro to Lapidary'],
    message: 'Complete "Intro to Lapidary" to earn this certification.'
  },

  // Tool-level certs (display only, no booking enforcement)
  'Router Table': {
    type: 'tool',
    method: 'self_directed',
    qualifyingClasses: [],
    message: 'Pass the self-directed Router Table proficiency test.'
  },
  'Table Saw': {
    type: 'tool',
    method: 'class',
    qualifyingClasses: ['Woodshop Basics One - Table Saw, Chop Saw, and Band Saw'],
    message: 'Complete "Woodshop Basics One - Table Saw, Chop Saw, and Band Saw" to earn this certification.'
  },
  'MIG Welder': {
    type: 'tool',
    method: 'class',
    qualifyingClasses: ['Intro to MIG Welding'],
    message: 'Complete "Intro to MIG Welding" to earn this certification.'
  },
  'TIG Welder': {
    type: 'tool',
    method: 'class',
    qualifyingClasses: ['Intro to TIG Welding: Steel', 'Intro to TIG Welding: Aluminum'],
    message: 'Complete "Intro to TIG Welding: Steel" or "Intro to TIG Welding: Aluminum" to earn this certification.'
  }
};

// Reverse map: class title -> array of cert area names it qualifies for
const CLASS_TO_CERTS = {};
for (const [area, config] of Object.entries(CERT_REQUIREMENTS)) {
  for (const className of config.qualifyingClasses) {
    if (!CLASS_TO_CERTS[className]) {
      CLASS_TO_CERTS[className] = [];
    }
    CLASS_TO_CERTS[className].push(area);
  }
}

// All certifiable area names (for admin dropdown, menu display, etc.)
const ALL_CERT_AREAS = Object.keys(CERT_REQUIREMENTS);

// Grouped certifications for display (admin dropdown, menu view)
const CERT_GROUPS = [
  { group: 'Woodshop', areas: ['Table Saw', 'Router Table', 'Xcarve CNC', 'Wood Lathe - Mini Jet', 'Wood Lathe - Non-Powermatic', 'Wood Lathe - Powermatic'] },
  { group: 'Metal Shop', areas: ['MIG Welder', 'TIG Welder', 'CNC Plasma', 'Metal Lathes - Grizzly Mill', 'Metal Lathes - Metal Lathe', 'Metal Lathes - Small Metal Lathe'] },
  { group: 'Forge', areas: ['Forge'] },
  { group: 'Glass', areas: ['Fused Glass', 'Glass Studio'] },
  { group: 'Lasers & 3D Printing', areas: ['Boss Laser', 'Glowforge', '3D Printer'] },
  { group: 'Jewelry', areas: ['Jewelry Bench'] },
  { group: 'Textiles', areas: ['Sewing Space'] },
  { group: 'Lapidary', areas: ['Lapidary'] }
];

module.exports = { CERT_REQUIREMENTS, CLASS_TO_CERTS, ALL_CERT_AREAS, CERT_GROUPS };
