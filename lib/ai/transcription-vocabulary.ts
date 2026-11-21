/**
 * Words generic speech-to-text tends to mishear in this app's domain.
 * Sent as Voxtral `contextBias`, which nudges recognition towards them.
 * Grow this list whenever a dictated word comes back wrong.
 */
export const GUT_HEALTH_VOCABULARY = [
  // Conditions
  "IBS",
  "IBS-C",
  "IBS-D",
  "SIBO",
  "GERD",
  "Crohn's",
  "colitis",
  "coeliac",
  "gastritis",
  "leaky gut",
  // Diets and food terms
  "FODMAP",
  "low-FODMAP",
  "carnivore",
  "keto",
  "gluten",
  "lactose",
  "kefir",
  "sauerkraut",
  "kimchi",
  "bone broth",
  "psyllium",
  "inulin",
  // Symptoms and tracking
  "bloating",
  "constipation",
  "diarrhoea",
  "reflux",
  "flatulence",
  "Bristol",
  "bowel movement",
  // Supplements and medication
  "probiotic",
  "prebiotic",
  "L-glutamine",
  "omeprazole",
  "rifaximin",
];
