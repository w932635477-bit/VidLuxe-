// 案例生成器配置
// 使用 Nano Banana API 生成演示案例图片

export type CaseCategory =
  | 'fashion'      // 穿搭 OOTD
  | 'beauty'       // 美妆护肤
  | 'cafe'         // 咖啡探店
  | 'food'         // 美食
  | 'lifestyle'    // 生活方式
  | 'tech';        // 数码产品

export interface CaseConfig {
  id: string;
  category: CaseCategory;
  categoryLabel: string;
  // 原片 Prompt（普通风格）
  beforePrompt: string;
  // 升级后 Prompt（高级感风格）
  afterPrompt: string;
  // 风格推荐
  recommendedStyle: 'magazine' | 'soft' | 'urban' | 'vintage';
}

// 案例配置库
export const CASE_CONFIGS: CaseConfig[] = [
  // 穿搭 OOTD
  {
    id: 'fashion-1',
    category: 'fashion',
    categoryLabel: '穿搭 OOTD',
    beforePrompt: `
      A woman taking a casual selfie in a messy bedroom,
      wearing casual everyday clothes,
      poor lighting from overhead fluorescent,
      cluttered background with clothes and items,
      phone camera quality, unflattering angle,
      amateur photography, no styling
    `,
    afterPrompt: `
      Professional fashion photography of an elegant woman,
      wearing stylish minimalist outfit,
      soft natural lighting from large window,
      clean neutral background with subtle texture,
      high-end magazine editorial style,
      professional model pose, premium quality,
      fashion week street style, sophisticated
    `,
    recommendedStyle: 'magazine',
  },
  {
    id: 'fashion-2',
    category: 'fashion',
    categoryLabel: '穿搭 OOTD',
    beforePrompt: `
      Casual photo of someone in a coffee shop,
      wearing basic outfit, ordinary appearance,
      harsh overhead lighting, busy background with other customers,
      iPhone snapshot, unposed, cluttered composition
    `,
    afterPrompt: `
      Stunning street fashion portrait,
      model wearing designer minimalist clothing,
      golden hour natural lighting,
      elegant urban background with bokeh,
      Vogue magazine cover quality,
      confident pose, luxury brand aesthetic,
      high fashion editorial photography
    `,
    recommendedStyle: 'soft',
  },
  {
    id: 'fashion-3',
    category: 'fashion',
    categoryLabel: '穿搭 OOTD',
    beforePrompt: `
      Amateur photo of outfit in a dressing room mirror,
      fluorescent lighting, messy room visible,
      phone camera with flash, unflattering colors,
      casual snapshot quality
    `,
    afterPrompt: `
      High-end fashion campaign photograph,
      elegant model in designer clothing,
      professional studio lighting setup,
      clean seamless background,
      Harper's Bazaar editorial style,
      refined pose, luxury fashion aesthetic
    `,
    recommendedStyle: 'magazine',
  },

  // 美妆护肤
  {
    id: 'beauty-1',
    category: 'beauty',
    categoryLabel: '美妆护肤',
    beforePrompt: `
      Basic product photo of skincare bottle,
      taken on white desk with harsh flash,
      cluttered background with other items,
      amateur product photography,
      unflattering reflections
    `,
    afterPrompt: `
      Luxury skincare product photography,
      elegant glass bottle with soft golden lighting,
      marble surface with rose petals,
      Chanel beauty campaign aesthetic,
      professional studio setup,
      soft shadows and highlights,
      premium cosmetics advertising
    `,
    recommendedStyle: 'magazine',
  },
  {
    id: 'beauty-2',
    category: 'beauty',
    categoryLabel: '美妆护肤',
    beforePrompt: `
      Snapshot of makeup products on messy vanity,
      poor lighting, unorganized items visible,
      phone camera quality, no styling
    `,
    afterPrompt: `
      Elegant beauty flat lay photography,
      premium makeup products arranged artistically,
      soft diffused lighting, clean marble surface,
      Instagram beauty influencer aesthetic,
      professional product styling,
      luxury cosmetics editorial
    `,
    recommendedStyle: 'soft',
  },
  {
    id: 'beauty-3',
    category: 'beauty',
    categoryLabel: '美妆护肤',
    beforePrompt: `
      Basic photo of perfume bottle,
      harsh direct flash, plain background,
      amateur snapshot quality
    `,
    afterPrompt: `
      Stunning luxury perfume photography,
      elegant crystal bottle with light refractions,
      moody dramatic lighting,
      black reflective surface,
      Dior perfume campaign style,
      cinematic quality, premium brand aesthetic
    `,
    recommendedStyle: 'urban',
  },

  // 咖啡探店
  {
    id: 'cafe-1',
    category: 'cafe',
    categoryLabel: '咖啡探店',
    beforePrompt: `
      Casual photo of latte art in a cup,
      taken at a crowded coffee shop,
      harsh overhead lighting, busy background,
      phone snapshot, ordinary appearance
    `,
    afterPrompt: `
      Beautiful latte art photography,
      perfect rosetta pattern in ceramic cup,
      soft natural window light,
      minimalist cafe interior background,
      Kinfolk magazine aesthetic,
      professional food photography,
      warm cozy atmosphere
    `,
    recommendedStyle: 'magazine',
  },
  {
    id: 'cafe-2',
    category: 'cafe',
    categoryLabel: '咖啡探店',
    beforePrompt: `
      Quick snapshot of coffee shop interior,
      poor lighting, empty chairs visible,
      unflattering angle, amateur photography
    `,
    afterPrompt: `
      Stunning cafe interior photography,
      beautiful minimalist design,
      soft golden hour light streaming through windows,
      elegant furniture and decor,
      architectural digest quality,
      professional interior photography,
      inviting sophisticated atmosphere
    `,
    recommendedStyle: 'vintage',
  },
  {
    id: 'cafe-3',
    category: 'cafe',
    categoryLabel: '咖啡探店',
    beforePrompt: `
      Basic photo of coffee and pastry,
      messy table, harsh lighting,
      unstyled snapshot quality
    `,
    afterPrompt: `
      Artisan coffee and pastry flat lay,
      beautifully styled breakfast scene,
      soft diffused morning light,
      rustic wooden table with linen napkin,
      lifestyle magazine aesthetic,
      professional food styling,
      warm inviting mood
    `,
    recommendedStyle: 'magazine',
  },

  // 美食
  {
    id: 'food-1',
    category: 'food',
    categoryLabel: '探店美食',
    beforePrompt: `
      Casual photo of restaurant dish,
      taken at dinner with poor lighting,
      phone flash creating harsh reflections,
      unappetizing appearance
    `,
    afterPrompt: `
      Michelin star quality food photography,
      beautifully plated gourmet dish,
      professional studio lighting,
      elegant ceramic plate on dark surface,
      Bon Appetit magazine style,
      chef-level presentation,
      appetizing and artistic
    `,
    recommendedStyle: 'magazine',
  },
  {
    id: 'food-2',
    category: 'food',
    categoryLabel: '探店美食',
    beforePrompt: `
      Snapshot of dessert on table,
      cluttered background, harsh overhead light,
      amateur food photography
    `,
    afterPrompt: `
      Stunning dessert photography,
      elegant pastry with artistic plating,
      soft dramatic lighting,
      dark moody background,
      fine dining restaurant quality,
      professional food photography,
      Instagram-worthy presentation
    `,
    recommendedStyle: 'soft',
  },

  // 生活方式
  {
    id: 'lifestyle-1',
    category: 'lifestyle',
    categoryLabel: '生活方式',
    beforePrompt: `
      Messy desk photo with laptop and items,
      poor lighting, unorganized workspace,
      casual snapshot quality
    `,
    afterPrompt: `
      Beautiful minimalist workspace photography,
      clean organized desk with premium items,
      soft natural light from large window,
      neutral color palette,
      productivity influencer aesthetic,
      professional interior photography,
      inspiring and organized
    `,
    recommendedStyle: 'soft',
  },
  {
    id: 'lifestyle-2',
    category: 'lifestyle',
    categoryLabel: '生活方式',
    beforePrompt: `
      Snapshot of home corner with plants,
      ordinary appearance, harsh lighting,
      clutter visible in background
    `,
    afterPrompt: `
      Stunning interior design photography,
      curated plant corner with beautiful pots,
      soft filtered natural light,
      neutral Scandi-style interior,
      Architectural Digest aesthetic,
      professional real estate photography,
      calm and sophisticated
    `,
    recommendedStyle: 'vintage',
  },

  // 数码产品
  {
    id: 'tech-1',
    category: 'tech',
    categoryLabel: '数码产品',
    beforePrompt: `
      Basic product photo of headphones,
      taken on messy desk with phone,
      harsh flash, unflattering background,
      amateur photography
    `,
    afterPrompt: `
      Premium tech product photography,
      sleek wireless headphones,
      minimalist studio lighting,
      clean white or dark background,
      Apple product photography style,
      professional commercial quality,
      high-end consumer electronics
    `,
    recommendedStyle: 'soft',
  },
  {
    id: 'tech-2',
    category: 'tech',
    categoryLabel: '数码产品',
    beforePrompt: `
      Snapshot of laptop on desk,
      cluttered workspace, poor lighting,
      unflattering angle
    `,
    afterPrompt: `
      Professional tech workspace photography,
      premium laptop on clean desk,
      soft dramatic studio lighting,
      minimalist dark background,
      tech reviewer aesthetic,
      commercial product photography,
      sleek and modern
    `,
    recommendedStyle: 'urban',
  },
];

// 获取指定分类的案例配置
export function getCasesByCategory(category: CaseCategory): CaseConfig[] {
  return CASE_CONFIGS.filter((c) => c.category === category);
}

// 获取所有分类
export const CATEGORIES: { id: CaseCategory; label: string; icon: string }[] = [
  { id: 'fashion', label: '穿搭 OOTD', icon: '👗' },
  { id: 'beauty', label: '美妆护肤', icon: '💄' },
  { id: 'cafe', label: '咖啡探店', icon: '☕' },
  { id: 'food', label: '探店美食', icon: '🍽️' },
  { id: 'lifestyle', label: '生活方式', icon: '🌿' },
  { id: 'tech', label: '数码产品', icon: '📱' },
];
