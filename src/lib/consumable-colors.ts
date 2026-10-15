export const CONSUMABLE_COLORS = [
   { name: "Negro", code: "K", background: "#18181b" },
   { name: "Cian", code: "C", background: "#06b6d4" },
   { name: "Magenta", code: "M", background: "#d946ef" },
   { name: "Amarillo", code: "Y", background: "#facc15" },
   { name: "Tricolor", code: "CMY", background: "conic-gradient(#06b6d4 0 120deg, #d946ef 120deg 240deg, #facc15 240deg)" },
   { name: "Otro", code: "", background: "linear-gradient(135deg, #94a3b8 50%, #cbd5e1 50%)" },
] as const;

export type ConsumableColor = typeof CONSUMABLE_COLORS[number]["name"];
