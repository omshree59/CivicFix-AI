// src/data/demoPresets.ts
// 12 Comprehensive Presets Designed For Hackathon Judges to Test Every AI Edge Case

export interface DemoPreset {
  id: string;
  badgeLabel: string;
  testPurpose: string;
  testBadge: string;
  citizenName: string;
  location: string;
  complaintText: string;
  title: string;
  category: 'Water Leakage' | 'Potholes' | 'Garbage' | 'Street Light' | 'Manhole' | 'Other';
  state: string;
  city: string;
  pincode: string;
  addressDetail: string;
  imageUrl: string;
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  department: 'Electrician' | 'Plumber' | 'Road Maintenance' | 'Garbage Collector' | 'All Rounder';
  color: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: "preset-live-wire",
    badgeLabel: "⚡ Exposed Live Wire",
    testPurpose: "Tests Critical Urgency & Safety Hazard",
    testBadge: "Critical Urgency & Safety",
    citizenName: "Aarav Sharma",
    location: "Outside Hostel Block B Main Gate",
    complaintText: "URGENT! A high-voltage overhead cable snapped after the windstorm and is sparking right on the wet pavement where students walk. Someone is going to get electrocuted if power isn't cut immediately!",
    title: "Snapped High-Voltage Wire Sparking on Wet Pavement",
    category: "Street Light",
    state: "Karnataka",
    city: "Bangalore",
    pincode: "560001",
    addressDetail: "Outside Hostel Block B Main Gate, Pedestrian Walkway",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    urgency: "Critical",
    department: "Electrician",
    color: "from-amber-500 to-red-600"
  },
  {
    id: "preset-burst-pipe-original",
    badgeLabel: "💧 Burst Pipe - Original",
    testPurpose: "Tests Primary Ticket Creation",
    testBadge: "Primary Ticket Creation",
    citizenName: "Priya Nair",
    location: "North Academic Quad, Near Library",
    complaintText: "The main underground water supply line next to the library entrance has ruptured. Clean drinking water is gushing out onto the walkway for the last 30 minutes.",
    title: "Main Underground Water Supply Line Rupture at Library",
    category: "Water Leakage",
    state: "Karnataka",
    city: "Bangalore",
    pincode: "560001",
    addressDetail: "North Academic Quad, Near Library Entrance",
    // NOTE: Presets 2 and 3 share the EXACT same image URL to trigger 100% duplicate visual hash detection!
    imageUrl: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80",
    urgency: "High",
    department: "Plumber",
    color: "from-blue-500 to-cyan-600"
  },
  {
    id: "preset-burst-pipe-duplicate",
    badgeLabel: "🔁 Burst Pipe - Duplicate Wording",
    testPurpose: "Tests Semantic Duplicate Detection",
    testBadge: "Semantic & Visual Duplicate Merge",
    citizenName: "Rohan Mehta",
    location: "Central Library Stairs / North Quad",
    complaintText: "Huge flooding outside the library! Looks like a water main broke underground and the whole path is ankle-deep in water. Please send a plumber fast.",
    title: "Flooding Outside Library from Broken Water Main",
    category: "Water Leakage",
    state: "Karnataka",
    city: "Bangalore",
    pincode: "560001",
    addressDetail: "Central Library Stairs / North Quad Pathway",
    // Matches Preset 2 image URL for 100% pHash visual duplicate match
    imageUrl: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80",
    urgency: "High",
    department: "Plumber",
    color: "from-cyan-500 to-indigo-600"
  },
  {
    id: "preset-low-water-pressure",
    badgeLabel: "🔗 Low Water Pressure - Related Symptom",
    testPurpose: "Tests Root-Cause Clustering",
    testBadge: "Root-Cause Clustering",
    citizenName: "Sneha Patil",
    location: "Canteen & Lab Complex (Adjacent to Library)",
    complaintText: "There is zero water coming out of the taps in the North Canteen and Chemistry Lab washrooms since morning. We cannot run lab experiments or wash dishes.",
    title: "Zero Water Pressure in Taps at Canteen & Chem Lab",
    category: "Water Leakage",
    state: "Karnataka",
    city: "Bangalore",
    pincode: "560001",
    addressDetail: "Canteen & Lab Complex, Ground Floor Washrooms",
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    urgency: "Medium",
    department: "Plumber",
    color: "from-sky-500 to-blue-700"
  },
  {
    id: "preset-angry-hinglish-rant",
    badgeLabel: "🌐 Angry Hinglish Rant",
    testPurpose: "Tests Multilingual NLP & Sentiment Extraction",
    testBadge: "Multilingual NLP & Sentiment",
    citizenName: "Vikram Singh",
    location: "Hostel Block D, 3rd Floor",
    complaintText: "Bhai pichle 3 din se 3rd floor ka water cooler kharab pada hai aur garmi mein bura haal hai! Kitni baar complain karein? Koi sunta hi nahi hai, jaldi mechanic bhejo yaar!",
    title: "Broken Water Cooler on 3rd Floor - 3 Days Unresolved",
    category: "Other",
    state: "Delhi",
    city: "New Delhi",
    pincode: "110001",
    addressDetail: "Hostel Block D, 3rd Floor Water Cooler Station",
    imageUrl: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80",
    urgency: "Medium",
    department: "Plumber",
    color: "from-violet-500 to-purple-700"
  },
  {
    id: "preset-pii-heavy",
    badgeLabel: "🔒 PII-Heavy Complaint",
    testPurpose: "Tests Auto-Anonymization / Privacy Redaction",
    testBadge: "PII Privacy Auto-Redaction",
    citizenName: "Rajesh Verma",
    location: "Staff Quarters, Flat 402",
    complaintText: "My name is Rajesh Verma (Employee ID: EMP-99281) and my phone number is 9876543210, email rajesh.v@campus.edu. Raw sewage is backing up into the ground floor courtyard behind my flat.",
    title: "Raw Sewage Backing Up into Ground Floor Courtyard",
    category: "Manhole",
    state: "Maharashtra",
    city: "Mumbai",
    pincode: "400001",
    addressDetail: "Staff Quarters, Flat 402 Rear Courtyard",
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
    urgency: "High",
    department: "Plumber",
    color: "from-rose-500 to-pink-700"
  },
  {
    id: "preset-fallen-tree",
    badgeLabel: "🌪️ Fallen Tree on Road",
    testPurpose: "Tests Multi-Department Routing & Domino Effect",
    testBadge: "Multi-Dept Domino Routing",
    citizenName: "Kavita Rao",
    location: "Main Campus Ring Road near Gate 2",
    complaintText: "A massive neem tree just collapsed across the main ring road, crushing a streetlight pole and completely blocking the ambulance and bus lane during peak rush hour.",
    title: "Massive Fallen Tree Crushing Streetlight & Blocking Ring Road",
    category: "Other",
    state: "Karnataka",
    city: "Bangalore",
    pincode: "560002",
    addressDetail: "Main Campus Ring Road near Gate 2 Inbound Lane",
    imageUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
    urgency: "Critical",
    department: "Road Maintenance",
    color: "from-emerald-500 to-teal-700"
  },
  {
    id: "preset-chemical-fume-leak",
    badgeLabel: "🧪 Chemical Fume Leak",
    testPurpose: "Tests Hazmat Escalation & Immediate Safety SOP",
    testBadge: "Hazmat Escalation & Safety SOP",
    citizenName: "Dr. Ananya Sen",
    location: "Science Building, Basement Storage Room 04",
    complaintText: "Strong pungent ammonia-like chemical fumes are leaking from the basement ventilated storage cabinet. Two lab assistants are feeling dizzy and we have evacuated the hallway.",
    title: "Ammonia Chemical Fume Leak in Science Basement Storage",
    category: "Other",
    state: "Maharashtra",
    city: "Pune",
    pincode: "411001",
    addressDetail: "Science Building, Basement Storage Room 04 Corridor",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80",
    urgency: "Critical",
    department: "All Rounder",
    color: "from-yellow-500 to-red-600"
  },
  {
    id: "preset-wifi-outage-exams",
    badgeLabel: "📡 Campus Wi-Fi Outage during Exams",
    testPurpose: "Tests Context-Aware Priority Boost",
    testBadge: "Context-Aware Exam Priority",
    citizenName: "Karthik Sundaram",
    location: "Examination Hall 3 & Computer Center",
    complaintText: "The entire campus Wi-Fi and LAN network dropped in Exam Hall 3 right in the middle of our online coding assessment. 120 students are stuck on the submission screen!",
    title: "Total Network & Wi-Fi Blackout in Exam Hall 3 During Assessment",
    category: "Other",
    state: "Delhi",
    city: "New Delhi",
    pincode: "110011",
    addressDetail: "Examination Hall 3 & Computer Center, 2nd Floor",
    imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80",
    urgency: "Critical",
    department: "All Rounder",
    color: "from-blue-600 to-indigo-800"
  },
  {
    id: "preset-routine-overflowing-bin",
    badgeLabel: "🗑️ Routine Overflowing Bin",
    testPurpose: "Tests Low/Standard Priority Baseline",
    testBadge: "Low Priority Baseline",
    citizenName: "Deepak Joshi",
    location: "South Sports Ground Bleachers",
    complaintText: "The dry waste dustbins near the football ground seating area haven't been emptied since the weekend match and plastic bottles are scattered on the grass.",
    title: "Overflowing Dry Waste Dustbins at Sports Ground Bleachers",
    category: "Garbage",
    state: "Karnataka",
    city: "Bangalore",
    pincode: "560025",
    addressDetail: "South Sports Ground Bleachers, East Stand",
    imageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80",
    urgency: "Low",
    department: "Garbage Collector",
    color: "from-green-600 to-emerald-800"
  },
  {
    id: "preset-vague-frustrated-rant",
    badgeLabel: "❓ Vague / Frustrated Rant",
    testPurpose: "Tests Low AI Confidence & 'Needs Clarification' Guardrail",
    testBadge: "Low Confidence Guardrail",
    citizenName: "Anonymous Citizen",
    location: "Unknown / Not Specified",
    complaintText: "Everything in this place is completely broken and nobody cares!! Fix it right now or we are going to protest outside the office tomorrow morning!!",
    title: "Campus Facilities Maintenance Complaint",
    category: "Other",
    state: "Karnataka",
    city: "Bangalore",
    pincode: "560001",
    addressDetail: "Campus Central Zone - Location Unspecified",
    imageUrl: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
    urgency: "Low",
    department: "All Rounder",
    color: "from-slate-500 to-zinc-700"
  },
  {
    id: "preset-elevator-trap-emergency",
    badgeLabel: "🏥 Elevator Trap Emergency",
    testPurpose: "Tests Life-Safety SLA & Instant Human Alert",
    testBadge: "Life-Safety Instant Human Alert",
    citizenName: "Meera Nambiar",
    location: "Admin Tower, Lift #2",
    complaintText: "Lift #2 is stuck between the 4th and 5th floor! Two students are trapped inside, the exhaust fan stopped working, and the emergency alarm bell is ringing continuously.",
    title: "EMERGENCY: Two Students Trapped in Stalled Lift #2",
    category: "Other",
    state: "Maharashtra",
    city: "Mumbai",
    pincode: "400050",
    addressDetail: "Admin Tower, Lift #2 Shaft Between Floors 4 & 5",
    imageUrl: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=800&q=80",
    urgency: "Critical",
    department: "Electrician",
    color: "from-red-600 to-rose-800"
  }
];

/**
 * Returns a random demo preset from the 12 available edge cases.
 */
export const getRandomDemoPreset = (): DemoPreset => {
  const index = Math.floor(Math.random() * DEMO_PRESETS.length);
  return DEMO_PRESETS[index];
};

/**
 * Curates a balanced 5-ticket synthetic wave designed for hackathon judges:
 * - 1 Critical Emergency (Live Wire or Elevator)
 * - 2 Water Leakage tickets (Original + Duplicate pair) for 100% duplicate verification
 * - 1 Multi-department or PII or Hinglish NLP ticket
 * - 1 Routine/Low priority baseline ticket
 */
export const getCuratedDemoWave = (): DemoPreset[] => {
  const wave: DemoPreset[] = [];
  
  // 1. Critical Urgency ticket
  const critical = DEMO_PRESETS.find(p => p.id === 'preset-live-wire') || DEMO_PRESETS[0];
  wave.push(critical);
  
  // 2 & 3. Duplicate pair (Original + Duplicate)
  const orig = DEMO_PRESETS.find(p => p.id === 'preset-burst-pipe-original') || DEMO_PRESETS[1];
  const dupe = DEMO_PRESETS.find(p => p.id === 'preset-burst-pipe-duplicate') || DEMO_PRESETS[2];
  wave.push(orig, dupe);
  
  // 4. Multilingual Hinglish or PII
  const nlp = DEMO_PRESETS.find(p => p.id === 'preset-angry-hinglish-rant') || DEMO_PRESETS[4];
  wave.push(nlp);
  
  // 5. Routine Baseline
  const baseline = DEMO_PRESETS.find(p => p.id === 'preset-routine-overflowing-bin') || DEMO_PRESETS[9];
  wave.push(baseline);
  
  // Shuffle order slightly so duplicates aren't strictly adjacent
  return wave.sort(() => Math.random() - 0.5);
};
