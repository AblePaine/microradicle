export type CropCategory =
  | "leafy-greens"
  | "brassicas"
  | "root-crops"
  | "alliums"
  | "solanaceous"
  | "cucurbits"
  | "legumes"
  | "herbs"
  | "cut-flowers";

/** Gateway / engine deep-link. `vegetables` = every category except cut-flowers. */
export type EngineTradeFilter = CropCategory | "vegetables";

export type PropagationMethod = "direct-seed" | "transplant" | "both";

export type CellSize = 72 | 128 | 200 | 288;

export type FrostHardiness = "tender" | "moderate" | "hardy" | "extreme";

export type SalesUnit = "head" | "bunch" | "pound" | "pint" | "quart" | "stem";

export type FertilityDemand = "light" | "moderate" | "heavy";

export type FlowerUse = "focal" | "spike" | "filler" | "foliage" | "airy-texture";

export type FlowerHarvestStage =
  | "tight-bud"
  | "cracked-bud"
  | "marshmallow"
  | "one-half-open"
  | "fully-open";

export type PostHarvestPulse =
  | "plain-cold-water"
  | "citric-acid-hydration"
  | "bleach-chlorine-shock"
  | "chrysal-holding-soln"
  | "hot-water-sear";

export interface CutFlowerSpecifics {
  primaryUse: FlowerUse;
  targetStemLengthIn: number;
  supportNetting: {
    required: boolean;
    layers: 1 | 2;
    meshSizeIn: 6 | 8;
    firstLayerHeightIn: number;
    secondLayerHeightIn: number | null;
  };
  pinching: {
    required: boolean;
    pinchAtHeightIn: number;
    leaveNodeCount: number;
    dtmPenaltyDays: number;
  };
  harvestProtocol: {
    stage: FlowerHarvestStage;
    cutFrequencyDays: number;
    stemsPerPlant: number;
    stemsPerLinearBedFoot: number;
    recommendedPulse: PostHarvestPulse;
    vaseLifeDays: number;
  };
}

/** Operating spec for a cultivar on a 30-inch biointensive bed. */
export interface CropSpecification {
  id: string;
  commonName: string;
  cultivar: string;
  botanicalName: string;
  category: CropCategory;
  /** Present only on cut-flower records. Vegetables omit this key. */
  flowerSpecifics?: CutFlowerSpecifics;
  propagation: {
    method: PropagationMethod;
    recommendedCellSize: CellSize | null;
    nurseryLeadDays: number;
    germinationDays: number;
    minGermTempF: number;
    optimumGermTempF: number;
    maxGermTempF: number;
  };
  fieldGeometry: {
    standardBedWidthIn: 30;
    rowsPerBed: 1 | 2 | 3 | 4 | 5 | 6;
    inRowSpacingIn: number;
    seedSpacingIn: number;
    plantsPerLinearFoot: number;
  };
  timeline: {
    dtmFromField: number;
    fieldHoldingDays: number;
    isMulticut: boolean;
    regrowthDays: number | null;
    maxHarvests: number;
    fallPhotoperiodMultiplier: number;
    frostHardiness: FrostHardiness;
  };
  yieldAndRevenue: {
    salesUnit: SalesUnit;
    unitsPerBedFoot: number;
    avgWeightPerUnitLbs: number;
    targetYieldLbsPerBedFoot: number;
    standardCullRate: number;
    targetWholesalePriceUsd: number;
    targetDirectPriceUsd: number;
  };
  irrigationProfile: {
    linesPerBed: 1 | 2 | 3 | 4;
    emitterSpacingIn: 4 | 8 | 12;
    emitterGph: 0.25 | 0.42 | 0.5 | 0.65;
    weeklyWaterRequirementIn: number;
  };
  soilExtractionProfile: {
    fertilityDemand: FertilityDemand;
    nRemovalLbsPer100BedFt: number;
    pRemovalLbsPer100BedFt: number;
    kRemovalLbsPer100BedFt: number;
  };
}

/** Catalog record: operating spec plus display / succession extras. */
export interface Crop extends CropSpecification {
  family: string;
  swatch: string;
  notes: string;
  companions: string[];
  avoid: string[];
  successionIntervalDays: number;
  maxSuccessions: number;
}

export const CROP_CATEGORIES: CropCategory[] = [
  "leafy-greens",
  "brassicas",
  "root-crops",
  "alliums",
  "solanaceous",
  "cucurbits",
  "legumes",
  "herbs",
  "cut-flowers",
];

export const FROST_BANDS: FrostHardiness[] = ["tender", "moderate", "hardy", "extreme"];

export const CATEGORY_LABEL: Record<CropCategory, string> = {
  "leafy-greens": "Leafy greens",
  brassicas: "Brassicas",
  "root-crops": "Root crops",
  alliums: "Alliums",
  solanaceous: "Solanaceous",
  cucurbits: "Cucurbits",
  legumes: "Legumes",
  herbs: "Herbs",
  "cut-flowers": "Cut flowers",
};

export const TRADE_LABEL: Record<EngineTradeFilter, string> = {
  ...CATEGORY_LABEL,
  vegetables: "Market vegetables",
};

export const FROST_LABEL: Record<FrostHardiness, string> = {
  tender: "Tender",
  moderate: "Moderate",
  hardy: "Hardy",
  extreme: "Extreme",
};

export const PROP_LABEL: Record<PropagationMethod, string> = {
  "direct-seed": "Direct seed",
  transplant: "Transplant",
  both: "Direct or transplant",
};

export const FERTILITY_LABEL: Record<FertilityDemand, string> = {
  light: "Light",
  moderate: "Moderate",
  heavy: "Heavy",
};

export const FLOWER_USE_LABEL: Record<FlowerUse, string> = {
  focal: "Focal",
  spike: "Spike",
  filler: "Filler",
  foliage: "Foliage",
  "airy-texture": "Airy texture",
};

export const FLOWER_STAGE_LABEL: Record<FlowerHarvestStage, string> = {
  "tight-bud": "Tight bud",
  "cracked-bud": "Cracked bud",
  marshmallow: "Marshmallow",
  "one-half-open": "½ open",
  "fully-open": "Fully open",
};

export const PULSE_LABEL: Record<PostHarvestPulse, string> = {
  "plain-cold-water": "Plain cold water",
  "citric-acid-hydration": "Citric-acid hydration",
  "bleach-chlorine-shock": "Chlorine shock",
  "chrysal-holding-soln": "Chrysal holding",
  "hot-water-sear": "Hot-water sear",
};

export function salesUnitLabel(unit: SalesUnit, count = 2): string {
  if (unit === "pound") return "lb";
  if (count === 1) return unit;
  if (unit === "bunch") return "bunches";
  if (unit === "stem") return "stems";
  return `${unit}s`;
}

export function isFrostHardy(crop: CropSpecification): boolean {
  return crop.timeline.frostHardiness === "hardy" || crop.timeline.frostHardiness === "extreme";
}

export function isEngineTradeFilter(value: string): value is EngineTradeFilter {
  return value === "vegetables" || (CROP_CATEGORIES as readonly string[]).includes(value);
}

export function isCutFlower(
  crop: CropSpecification,
): crop is CropSpecification & { flowerSpecifics: CutFlowerSpecifics } {
  return crop.category === "cut-flowers" && crop.flowerSpecifics != null;
}

export function glyphKind(category: CropCategory): "leaf" | "root" | "fruit" | "allium" | "flower" {
  if (category === "root-crops") return "root";
  if (category === "alliums") return "allium";
  if (category === "solanaceous" || category === "cucurbits") return "fruit";
  if (category === "cut-flowers") return "flower";
  return "leaf";
}
