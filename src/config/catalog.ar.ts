import type {
  AssetKey,
  BudgetKey,
  ContactMethodKey,
  FeatureKey,
  GoalKey,
  LanguageKey,
  ProjectTypeKey,
  ScaleKey,
  ServiceKey,
  TimelineKey,
} from "./catalog";

/**
 * Arabic labels for the client-facing Project Builder (and its live blueprint).
 *
 * Deliberately separate from `catalog.ts`: that file is also the AI prompt's
 * rate card and the admin dashboard's data source, both of which stay in
 * English. This file only covers the short picker labels a client actually
 * sees while building a brief — not AI-generated proposal content (phase
 * write-ups, deliverables, executive summaries), which is produced per-lead
 * by the AI/heuristic engine and isn't statically translatable here.
 */

export const SERVICE_NAMES_AR: Record<ServiceKey, string> = {
  "brand-identity": "الهوية البصرية",
  "web-design": "تصميم وتطوير المواقع",
  ecommerce: "المتاجر الإلكترونية",
  "ui-ux": "تصميم واجهة وتجربة المستخدم",
  "mobile-app": "تطبيقات الجوال",
  "ai-automation": "الذكاء الاصطناعي والأتمتة",
  "seo-content": "السيو والمحتوى",
  "social-media": "السوشيال ميديا والأداء",
  "motion-3d": "الموشن والثري دي",
};

export const SERVICE_TAGLINES_AR: Record<ServiceKey, string> = {
  "brand-identity": "استراتيجية، تسمية، أنظمة شعارات وأدلة استخدام",
  "web-design": "مواقع تسويقية مخصصة وعالية الأداء",
  ecommerce: "متاجر Shopify والحلول المخصصة والـ headless",
  "ui-ux": "أبحاث، نماذج أولية، وأنظمة تصميم",
  "mobile-app": "تطبيقات iOS وAndroid، بتقنية متعددة المنصات",
  "ai-automation": "وكلاء ذكاء اصطناعي، مسارات n8n، وتكاملات",
  "seo-content": "سيو تقني، استراتيجية محتوى، وكتابة",
  "social-media": "أنظمة محتوى اجتماعي وحملات مدفوعة",
  "motion-3d": "أفلام العلامة، عروض المنتج، والرسوم المتحركة",
};

export const FEATURE_NAMES_AR: Record<FeatureKey, string> = {
  cms: "إدارة المحتوى",
  multilingual: "متعدد اللغات (EN · AR · FR)",
  booking: "الحجوزات والمواعيد",
  payments: "الدفع الإلكتروني",
  accounts: "حسابات المستخدمين",
  blog: "المدونة",
  crm: "ربط أنظمة العملاء والتسويق",
  "ai-assistant": "مساعد ذكاء اصطناعي",
  analytics: "التحليلات والتتبع",
  dashboard: "لوحة تحكم مخصصة",
  integrations: "تكاملات واجهات برمجية",
  copywriting: "كتابة المحتوى",
  "content-production": "إنتاج الصور والفيديو",
  "care-plan": "خطة الصيانة",
};

export const FEATURE_DESCRIPTIONS_AR: Record<FeatureKey, string> = {
  cms: "تعديل الصفحات والمحتوى دون الحاجة لمطوّر",
  multilingual: "محتوى محلي يشمل دعم العربية من اليمين لليسار",
  booking: "جدولة، إتاحة، وتذكيرات",
  payments: "بطاقات، محافظ رقمية، وبوابات محلية",
  accounts: "تسجيل، دخول، ومساحات للأعضاء",
  blog: "قوالب تحريرية وتصنيفات",
  crm: "HubSpot، Airtable، Notion، Mailchimp…",
  "ai-assistant": "مساعد محادثة مدرَّب على محتواكم",
  analytics: "GA4، البكسل، وأحداث التحويل",
  dashboard: "أدوات داخلية وواجهات تقارير",
  integrations: "أنظمة ERP، نقاط البيع، اللوجستيات، وواجهات خارجية",
  copywriting: "نصوص تحويلية بأسلوبكم الخاص",
  "content-production": "تصوير وتحرير موجّه فنيًا",
  "care-plan": "استضافة، تحديثات، نسخ احتياطي، ودعم",
};

export const SCALE_NAMES_AR: Record<ScaleKey, string> = {
  starter: "أساسي",
  standard: "قياسي",
  advanced: "متقدم",
  enterprise: "مؤسسي",
};

export const SCALE_DESCRIPTIONS_AR: Record<ScaleKey, string> = {
  starter: "نطاق مبسّط — الأساسيات بإتقان",
  standard: "إطلاق متكامل ومصقول",
  advanced: "تفاعلات وتكاملات مخصصة وعمق في المحتوى",
  enterprise: "أسواق متعددة، أنظمة معقدة، وحوكمة",
};

export const BUDGET_LABELS_AR: Record<BudgetKey, string> = {
  "under-300": "أقل من 300$",
  "300-700": "300$ – 700$",
  "700-1.5k": "700$ – 1,500$",
  "1.5k-3k": "1,500$ – 3,000$",
  "3k-plus": "+3,000$",
  "not-sure": "لست متأكدًا بعد",
};

export const TIMELINE_LABELS_AR: Record<TimelineKey, string> = {
  asap: "بأسرع وقت",
  "1-2-months": "1–2 شهر",
  "2-4-months": "2–4 أشهر",
  "4-plus-months": "+4 أشهر",
  flexible: "مرن",
};

export const TIMELINE_DESCRIPTIONS_AR: Record<TimelineKey, string> = {
  asap: "تسليم سريع خلال نحو 4 أسابيع",
  "1-2-months": "جدول زمني معجّل",
  "2-4-months": "الوتيرة الموصى بها",
  "4-plus-months": "برنامج مرحلي أو واسع النطاق",
  flexible: "سنخطط وفق طاقتنا الاستيعابية",
};

export const PROJECT_TYPE_LABELS_AR: Record<ProjectTypeKey, string> = {
  new: "شيء جديد",
  redesign: "إعادة تصميم",
  extend: "توسيع منتج قائم",
};

export const PROJECT_TYPE_DESCRIPTIONS_AR: Record<ProjectTypeKey, string> = {
  new: "علامة أو منتج أو منصة جديدة",
  redesign: "تطوير ما هو قائم بالفعل",
  extend: "ميزات أو أسواق أو قنوات جديدة",
};

export const GOAL_LABELS_AR: Record<GoalKey, string> = {
  "generate-leads": "توليد عملاء محتملين",
  "sell-online": "البيع أونلاين",
  "elevate-brand": "الارتقاء بالعلامة",
  "launch-product": "إطلاق منتج جديد",
  "automate-operations": "أتمتة العمليات",
  "improve-conversion": "تحسين التحويل",
  "enter-new-market": "دخول سوق جديد",
  "support-fundraising": "دعم جمع التمويل",
};

export const ASSET_LABELS_AR: Record<AssetKey, string> = {
  logo: "شعار",
  "brand-guidelines": "دليل الهوية",
  copy: "محتوى مكتوب",
  photography: "تصوير / فيديو",
  website: "موقع حالي",
  "domain-hosting": "نطاق واستضافة",
};

export const LANGUAGE_LABELS_AR: Record<LanguageKey, string> = {
  en: "الإنجليزية",
  ar: "العربية",
  fr: "الفرنسية",
  other: "أخرى",
};

export const CONTACT_METHOD_LABELS_AR: Record<ContactMethodKey, string> = {
  email: "البريد الإلكتروني",
  whatsapp: "واتساب",
  phone: "مكالمة هاتفية",
  "video-call": "مكالمة فيديو",
};

export const INDUSTRIES_AR: string[] = [
  "العمارة والتصميم الداخلي",
  "التعليم",
  "الأزياء والتجزئة",
  "المال والتكنولوجيا المالية",
  "الأغذية والمشروبات",
  "الرعاية الصحية والعافية",
  "الضيافة والسياحة",
  "المنظمات غير الربحية",
  "العقارات",
  "التكنولوجيا والبرمجيات",
  "أخرى",
];

/** Delivery phase names for the builder's live blueprint sidebar (keyed like `DELIVERY_PHASES`). */
export const DELIVERY_PHASE_NAMES_AR: Record<string, string> = {
  discovery: "الاكتشاف والاستراتيجية",
  design: "التصميم",
  build: "البناء والإنتاج",
  launch: "ضمان الجودة والإطلاق",
};
