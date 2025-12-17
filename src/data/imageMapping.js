// This file maps backend "Image Trigger Tags" to actual image URLs.
// Example: "Here is the chart [Image: MagicCompound]" -> Renders the MagicCompound chart.

export const IMAGE_MAP = {
    // 1. Wealth / Compounding
    "MagicCompound": "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80",

    // 2. Risk / Stability
    "SafeHaven": "https://images.unsplash.com/photo-1565514020176-6c2235c2927d?auto=format&fit=crop&w=800&q=80",

    // 3. Growth / Stocks
    "MarketRocket": "https://images.unsplash.com/photo-1611974765270-ca12588265b6?auto=format&fit=crop&w=800&q=80",

    // 4. Home Loan / Real Estate
    "DreamHome": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",

    // 5. Car Loan
    "VelocityCar": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"
};

export const getImageUrl = (tagKey) => {
    return IMAGE_MAP[tagKey] || null;
};
