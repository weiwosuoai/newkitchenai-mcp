import { readFileSync } from 'node:fs';

// 只导出官网公开选项；不包含生图提示词、密钥或用户数据。
export const catalog = JSON.parse(readFileSync(new URL('../data/catalog.json', import.meta.url), 'utf8'));
export const website = 'https://newkitchenai.com';
export const version = '1.0.1';
export const product = {
  name: 'NewKitchenAI',
  website,
  description: 'Photo-based AI kitchen design concepts for existing and unfinished kitchens. Choose a preset style or one reference photo, explore finishes, compare before and after, and refine a generated design.',
  generationAvailableThroughMcp: false,
  // 免费仅指新账号的一次性预览额度，不能解释为无限免费。
  ownPhotoGenerationIsFree: catalog.generationPolicy.freePreviewDesigns > 0,
  ...catalog.generationPolicy,
  outputResolution: '1K watermarked free previews; 2K watermark-free new designs after a purchase',
  creditsPerSuccessfulGenerationOrEdit: catalog.creditsPerDesign,
  billing: 'One-time purchased credits; no subscription. Purchased credits do not expire. Confirmed failed tasks are not charged.',
  websiteRequirements: 'Google sign-in is required. New accounts receive 4 signup credits, enough for 2 free 1K watermarked previews on their own photo, with no card required. Each successful design or edit costs 2 credits. Buy credits to continue after the signup allowance; new designs after a purchase use 2K without a watermark. There is no daily free allowance.',
  limits: 'AI concepts are visual inspiration, not measured plans, exact paint samples, construction drawings or renovation quotes. Layout and other details can change. One reference photo replaces the preset style selection.',
  photos: 'This MCP does not accept photos or access account data. Website photo handling is described in the privacy policy.',
  catalogAsOf: catalog.updatedAt,
  links: {
    source: 'https://github.com/weiwosuoai/newkitchenai-mcp',
    design: `${website}/kitchen-design`,
    pricing: `${website}/pricing`,
    cabinetColors: `${website}/kitchen-cabinet-color-visualizer`,
    examples: `${website}/kitchen-remodel-before-after`,
    privacy: `${website}/privacy-policy`,
    terms: `${website}/terms-of-service`,
    support: 'mailto:support@newkitchenai.com',
  },
};
export const examples = {
  note: 'After images are AI concepts, not completed renovation photographs or customer testimonials. The refinement sequence starts with an AI-generated design. These examples do not guarantee identical preservation for other inputs.',
  examples: [
    {
      name: 'Existing kitchen remodel',
      url: `${website}/kitchen-remodel-before-after`,
      startingImage: `${website}/demo/marketing/curtis-before-v1.webp`,
      resultImage: `${website}/demo/marketing/curtis-after-v4.webp`,
      description: 'A dated oak kitchen explored with ivory and walnut cabinets, light stone and warm floor tile.',
    },
    {
      name: 'Unfinished kitchen concept',
      url: `${website}/kitchen-remodel-before-after`,
      startingImage: `${website}/demo/marketing/unfinished-kitchen-before-v2.webp`,
      resultImage: `${website}/demo/marketing/coastal-white-kitchen-after-v4.webp`,
      description: 'An unfinished room explored as a warm-white kitchen with brass accents.',
    },
    {
      name: 'Cabinet color and countertop refinements',
      url: `${website}/kitchen-remodel-before-after#cabinet-colors`,
      startingImage: `${website}/demo/marketing/coastal-white-kitchen-after-v4.webp`,
      intermediateImage: `${website}/demo/marketing/refine-sage-cabinets-v1.webp`,
      resultImage: `${website}/demo/marketing/refine-soapstone-counter-v1.webp`,
      description: 'Starting from the AI concept, change lower cabinets to sage green, then explore a dark countertop in a second edit.',
    },
  ],
};
