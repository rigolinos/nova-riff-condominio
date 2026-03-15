// Sport colors mapping for event cover generation - Neutral tones
const sportColors: Record<string, { bg: string }> = {
  futebol: { bg: "#6b7280" }, // Neutral Gray
  basquete: { bg: "#78716c" }, // Warm Stone
  volei: { bg: "#64748b" }, // Cool Slate
  vôlei: { bg: "#64748b" }, // Cool Slate (alternative spelling)
  tenis: { bg: "#71717a" }, // Neutral Zinc
  tênis: { bg: "#71717a" }, // Neutral Zinc (alternative spelling)
  natacao: { bg: "#6b7280" }, // Neutral Gray
  natação: { bg: "#6b7280" }, // Neutral Gray (alternative spelling)
  corrida: { bg: "#737373" }, // Stone Gray
  ciclismo: { bg: "#78716c" }, // Warm Stone
  padel: { bg: "#71717a" }, // Neutral Zinc
  pádel: { bg: "#71717a" }, // Neutral Zinc (alternative spelling)
  xadrez: { bg: "#64748b" }, // Slate
  poker: { bg: "#6b7280" }, // Gray
  videogame: { bg: "#737373" }, // Neutral
  "video game": { bg: "#737373" }, // Neutral (alternative)
  skate: { bg: "#78716c" }, // Stone
  surf: { bg: "#64748b" }, // Slate
  yoga: { bg: "#71717a" }, // Zinc
  musculacao: { bg: "#6b7280" }, // Gray
  musculação: { bg: "#6b7280" }, // Gray (alternative spelling)
  pilates: { bg: "#737373" }, // Neutral
  danca: { bg: "#71717a" }, // Zinc
  dança: { bg: "#71717a" }, // Zinc (alternative spelling)
  artes: { bg: "#64748b" }, // Slate
  cafe: { bg: "#78716c" }, // Warm Stone
  café: { bg: "#78716c" }, // Warm Stone
  outros: { bg: "#6b7280" }, // Neutral Gray
};

const defaultColors = [
  { bg: "#6b7280" }, // Gray
  { bg: "#64748b" }, // Slate
  { bg: "#78716c" }, // Stone
  { bg: "#71717a" }, // Zinc
  { bg: "#737373" }, // Neutral
  { bg: "#6b7280" }, // Gray
  { bg: "#64748b" }, // Slate
  { bg: "#78716c" }, // Stone
];

export const generateEventCover = (sportName?: string, customSportName?: string): React.ReactElement => {
  // Determine sport key for color selection
  let sportKey = "outros";
  
  if (customSportName) {
    // If there's a custom sport name, use "outros" category
    sportKey = "outros";
  } else if (sportName) {
    // Check if sport exists in our color mapping
    const normalizedSport = sportName.toLowerCase().trim();
    sportKey = Object.keys(sportColors).find(key => 
      key === normalizedSport || normalizedSport.includes(key)
    ) || "outros";
  }

  // Get color configuration
  let colorConfig = sportColors[sportKey];
  
  // If sport not found, use hash-based color selection for consistency
  if (!colorConfig) {
    const hash = (sportName || customSportName || "default").split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colorIndex = Math.abs(hash) % defaultColors.length;
    colorConfig = defaultColors[colorIndex];
  }

  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      style={{ backgroundColor: colorConfig.bg }}
    >
      {/* Gradient overlay for visual depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
        }}
      />
    </div>
  );
};

export const getEventCoverUrl = (coverImageUrl?: string | null, sportName?: string, customSportName?: string): string | null => {
  if (coverImageUrl) {
    return coverImageUrl;
  }
  
  // Return null to indicate we should use the generated cover component
  return null;
};