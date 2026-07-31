// src/services/aiService.js
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// --- EXPANDED LOCAL KNOWLEDGE BASE ---
const KNOWLEDGE_BASE = [
  {
    id: "waterlogging",
    category: "Water Leakage / Waterlogging",
    textPattern: /(water|leak|pipe|burst|flood|drainage|sewage|overflow|gutter|clogged|river|lake|submerged|pond|puddle)/i,
    visionPattern: /(water|lake|sea|fountain|pool|stream|river|dam|ocean|geyser|drain|gutter|puddle|bathtub|whirlpool|faucet)/i,
    response: {
      category: "Water Leakage / Waterlogging",
      severity: "High",
      estimatedTime: "4-6 Hours",
      impactScope: 80,
      summary: "Detected water accumulation or flooding on the roadway, posing safety hazards to commuters.",
      precautions: [
        "Avoid driving through deep stagnant water.",
        "Watch out for submerged potholes or open drains underneath the water.",
        "Keep a safe distance from power lines or street poles near water."
      ],
      diyFixes: [
        "Clear surface leaves or debris blocking nearby storm drain grates.",
        "Divert water away from building entrances using sandbags if available.",
        "Report exact GPS location to municipal water & drainage board."
      ]
    }
  },
  {
    id: "potholes",
    category: "Potholes",
    textPattern: /(pothole|pit|crater|broken road|damaged asphalt|sinkhole|asphalt damage|trench|crack)/i,
    visionPattern: /(asphalt|pavement|dirt|mud|soil|crack|trench|gravel|wheelbarrow|cliff)/i,
    response: {
      category: "Potholes",
      severity: "Medium",
      estimatedTime: "24-48 Hours",
      impactScope: 60,
      summary: "Detected surface degradation and road cavity hazardous to vehicles.",
      precautions: [
        "Place a visible marker or reflective cone near the hole.",
        "Slow down when approaching the damaged section.",
        "Do not fill with loose uncompacted soil."
      ],
      diyFixes: [
        "Fill temporarily with cold-mix asphalt or gravel if safe.",
        "Mark the perimeter with bright chalk or safety tape.",
        "Notify local road maintenance authorities."
      ]
    }
  },
  {
    id: "electrical",
    category: "Electrical Hazard",
    textPattern: /(electric|wire|spark|shock|short\s?circuit|current|pole|street\s?light|lamp|voltage|transformer|power|cable)/i,
    visionPattern: /(lamp|light|lantern|pole|wire|electric|spotlight|street sign|traffic light|power line)/i,
    response: {
      category: "Electrical Hazard",
      severity: "Critical",
      estimatedTime: "2-4 Hours",
      impactScope: 95,
      summary: "High-voltage electrical hazard detected. Immediate intervention required.",
      precautions: [
        "STAY AWAY at least 10 meters (30 feet).",
        "Do not touch any nearby metal fences or damp ground.",
        "Keep children and pets away from the area."
      ],
      diyFixes: [
        "Do NOT attempt to touch or move wires.",
        "Call emergency electrical services immediately.",
        "Cordon off the area with caution tape or cones from a safe distance."
      ]
    }
  },
  {
    id: "garbage",
    category: "Garbage",
    textPattern: /(garbage|trash|waste|dump|smell|stink|rubbish|dustbin|litter|plastic|refuse|debris)/i,
    visionPattern: /(garbage|trash|waste|dustbin|ashcan|carton|bag|plastic|bottle|junk|litter|recycling)/i,
    response: {
      category: "Garbage",
      severity: "Low",
      estimatedTime: "1-2 Days",
      impactScope: 30,
      summary: "Accumulated waste posing hygiene, pest, and odor issues.",
      precautions: [
        "Wear a face mask when near the site.",
        "Do not burn plastic or municipal waste.",
        "Keep the surrounding area dry to prevent pest breeding."
      ],
      diyFixes: [
        "Ensure waste bins are covered securely.",
        "Sprinkle bleaching powder around the perimeter to neutralize odor.",
        "Coordinate with municipal sanitation workers for clearance."
      ]
    }
  },
  {
    id: "manhole",
    category: "Manhole",
    textPattern: /(manhole|sewer|drain cover|open drain|chamber|broken lid)/i,
    visionPattern: /(manhole|sewer|disk|hatch|lid|drain|iron cover)/i,
    response: {
      category: "Manhole",
      severity: "Critical",
      estimatedTime: "4-8 Hours",
      impactScope: 90,
      summary: "Open or damaged manhole posing severe fall and injury risk.",
      precautions: [
        "Do not walk near the opening during rain or low visibility.",
        "Keep children away from the open chamber.",
        "Avoid driving over cracked or misaligned covers."
      ],
      diyFixes: [
        "Insert a tall, visible warning branch or reflective stick into the hole.",
        "Surround the opening with heavy stones or cones.",
        "Barricade with bright warning tape."
      ]
    }
  },
  {
    id: "tree",
    category: "Fallen Tree",
    textPattern: /(tree|branch|fallen|uprooted|blocking|wood|timber)/i,
    visionPattern: /(tree|branch|wood|log|forest|park|plant|shrub)/i,
    response: {
      category: "Fallen Tree",
      severity: "High",
      estimatedTime: "12-24 Hours",
      impactScope: 70,
      summary: "Fallen tree or large branch obstructing traffic or public pathways.",
      precautions: [
        "Do not stand under unstable or hanging branches.",
        "Check for power lines tangled in the branches before moving.",
        "Divert oncoming traffic safely around the tree."
      ],
      diyFixes: [
        "Clear small, loose twigs and leaves from pathways.",
        "Mark the obstacle with reflective tape for night visibility.",
        "Contact local forestry or municipal authorities for heavy removal."
      ]
    }
  }
];

// --- AI MODEL CACHE ---
let aiModel = null;

const loadModel = async () => {
  if (!aiModel) {
    console.log("📥 Loading TensorFlow.js MobileNet model...");
    aiModel = await mobilenet.load();
    console.log("✅ MobileNet Model Ready.");
  }
  return aiModel;
};

const loadImageForAI = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      resolve(img);
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = (err) => reject(err);
  });
};

// --- SMART MATCHING & SCORING ALGORITHM ---
function evaluateBestMatch(userText, visionPredictions) {
  let highestScore = 0;
  let bestMatch = null;

  // Flatten vision predictions into a single string
  const visionText = visionPredictions.map(p => p.className).join(" ");
  console.log("👁️ Visual AI Predictions:", visionText);

  KNOWLEDGE_BASE.forEach((entry) => {
    let currentScore = 0;

    // 1. Check Vision Predictions (Weight: High)
    visionPredictions.forEach((pred) => {
      if (entry.visionPattern.test(pred.className)) {
        // Boost score based on prediction probability (e.g., 80% confidence = +4 points)
        currentScore += Math.round(pred.probability * 5);
      }
    });

    // 2. Check User Text Input (Title & Description)
    if (entry.textPattern.test(userText)) {
      currentScore += 3;
    }

    // 3. Special Disambiguation Rule:
    // If vision strongly detects water/flooding, give extra weight to Waterlogging
    // even if user typed generic words like "road fix" or "bad street".
    if (entry.id === "waterlogging" && /(water|lake|fountain|pool|stream|sea|gutter|drain)/i.test(visionText)) {
      currentScore += 4;
    }

    console.log(`📊 Category [${entry.category}] Score: ${currentScore}`);

    if (currentScore > highestScore) {
      highestScore = currentScore;
      bestMatch = entry.response;
    }
  });

  return bestMatch;
}

// --- FALLBACK RESPONSE ---
const getOfflineFallback = () => ({
  severity: "Medium",
  category: "General Civic Issue",
  estimatedTime: "24-48 Hours",
  impactScope: 50,
  precautions: ["Ensure personal safety around the site.", "Maintain a safe distance.", "Inform neighbors if needed."],
  diyFixes: ["Provide accurate landmark details.", "Take clear photos from multiple angles.", "Await municipal inspection."],
  summary: "Issue registered. Flagged for manual municipal review."
});

// --- MAIN FUNCTION ---
export const getAiAdvice = async (imageFile, title, description) => {
  console.log("🚀 Running Multi-Modal Smart Analysis...");
  const combinedUserText = `${title || ""} ${description || ""}`;
  let predictions = [];

  // 1. Run Visual Classification if image exists
  if (imageFile) {
    try {
      const model = await loadModel();
      const imgElement = await loadImageForAI(imageFile);
      predictions = await model.classify(imgElement);
    } catch (error) {
      console.error("⚠️ Image classification skipped:", error);
    }
  }

  // 2. Calculate best category match using Vision + Text Scoring
  const match = evaluateBestMatch(combinedUserText, predictions);

  if (match) {
    console.log("🎯 Selected Category:", match.category);
    return match;
  }

  // 3. Return Fallback if no category score was above 0
  console.warn("⚠️ No confident match found. Returning fallback.");
  return getOfflineFallback();
};