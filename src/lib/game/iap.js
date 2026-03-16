export const IAP_PRODUCTS = [
  { id: "remove_ads", name: "Remove Ads", price: "$2.99", type: "permanent" },
  {
    id: "starter_pack",
    name: "Starter Pack",
    price: "$4.99",
    type: "one_time",
    reward: { cores: 50, boost_2x_minutes: 60 },
  },
  {
    id: "core_bundle_s",
    name: "Core Bundle (S)",
    price: "$0.99",
    type: "consumable",
    reward: { cores: 10 },
  },
  {
    id: "core_bundle_m",
    name: "Core Bundle (M)",
    price: "$2.99",
    type: "consumable",
    reward: { cores: 35 },
  },
  {
    id: "core_bundle_l",
    name: "Core Bundle (L)",
    price: "$4.99",
    type: "consumable",
    reward: { cores: 80 },
  },
];

export function getRespecCost(respecCount) {
  if (respecCount === 0) return 0;
  return 5 * Math.pow(2, respecCount - 1);
}

export function canWatchAd(gameState) {
  return !gameState.removeAds;
}

export function applyAdBoost(gameState, boostType) {
  if (boostType === "double_offline") {
    return { doubled: true };
  }
  if (boostType === "production_2x") {
    return { boostUntil: Date.now() + 30 * 60 * 1000 };
  }
  return null;
}

export function purchaseProduct(productId) {
  console.log(`[IAP STUB] Purchase requested: ${productId}`);
  return false;
}
