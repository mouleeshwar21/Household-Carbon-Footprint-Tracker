export type SupportedLanguage = 'en' | 'es' | 'fr' | 'hi' | 'ar' | 'pt' | 'zh';

export interface LanguageMeta {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  locale: string;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English', nativeName: 'English', dir: 'ltr', locale: 'en-US' },
  { code: 'es', label: 'Spanish', nativeName: 'Español', dir: 'ltr', locale: 'es-ES' },
  { code: 'fr', label: 'French', nativeName: 'Français', dir: 'ltr', locale: 'fr-FR' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', locale: 'hi-IN' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية', dir: 'rtl', locale: 'ar-SA' },
  { code: 'pt', label: 'Portuguese', nativeName: 'Português', dir: 'ltr', locale: 'pt-BR' },
  { code: 'zh', label: 'Mandarin', nativeName: '中文', dir: 'ltr', locale: 'zh-CN' },
];

type TranslationKeys = {
  brandName: string;
  navDashboard: string;
  navCalculator: string;
  navRecommendations: string;
  navHistory: string;
  navCompare: string;
  navReports: string;
  navMethodology: string;
  ctaInstantCalc: string;
  ctaDemoLogin: string;
  heroTitle: string;
  heroSubtitle: string;
  parisTargetLabel: string;
  currentMonthTotal: string;
  perPersonFootprint: string;
  previousBillingCycle: string;
  peakCategoryDriver: string;
  easyVisualMode: string;
  technicalMode: string;
  saveMonthlyAudit: string;
  quickWinsTitle: string;
  historyTitle: string;
  compareTitle: string;
  reportsTitle: string;
  guestModeActive: string;
  signIn: string;
  registerHousehold: string;
};

export const TRANSLATIONS: Record<SupportedLanguage, TranslationKeys> = {
  en: {
    brandName: 'EcoTrack',
    navDashboard: 'Dashboard',
    navCalculator: 'Calculator',
    navRecommendations: 'Quick Wins',
    navHistory: 'History',
    navCompare: 'Compare',
    navReports: 'Audit Reports',
    navMethodology: 'Methodology',
    ctaInstantCalc: 'Calculate Now — No Sign Up',
    ctaDemoLogin: '1-Click Demo Login',
    heroTitle: 'Know Your Carbon. Cut Your Carbon. Save the Planet.',
    heroSubtitle:
      'Track 8 daily household activities. See your real CO₂ footprint. Get personalized actions to cut it — in under 60 seconds.',
    parisTargetLabel: 'Paris 1.5°C Target (167 kg / person / mo)',
    currentMonthTotal: 'Current Month Total',
    perPersonFootprint: 'Per-Person Footprint',
    previousBillingCycle: 'Previous Billing Period',
    peakCategoryDriver: 'Peak Category Driver',
    easyVisualMode: 'Easy Visual Mode',
    technicalMode: 'Standard Billing Mode',
    saveMonthlyAudit: 'Record Monthly Audit',
    quickWinsTitle: 'Regionally Tailored Decarbonization Quick Wins',
    historyTitle: 'Historical Monthly Carbon Audits',
    compareTitle: 'Month-over-Month Variance Analysis',
    reportsTitle: 'Certified Household Carbon Audit Certificate',
    guestModeActive: 'Guest Mode (Local Offline Storage)',
    signIn: 'Sign In',
    registerHousehold: 'Register Household',
  },
  es: {
    brandName: 'TerraLedger',
    navDashboard: 'Panel',
    navCalculator: 'Calculadora',
    navRecommendations: 'Acciones',
    navHistory: 'Historial',
    navCompare: 'Comparar',
    navReports: 'Certificados',
    navMethodology: 'Metodología',
    ctaInstantCalc: 'Calculadora Instantánea (Sin Registro)',
    ctaDemoLogin: 'Hogar Demo en 1 Clic',
    heroTitle: 'Plataforma Universal de Huella de Carbono y Descarbonización Doméstica',
    heroSubtitle:
      'Factores científicos deterministas del IPCC, AIE y EPA calibrados para redes eléctricas globales, combustibles domésticos, movilidad y agua.',
    parisTargetLabel: 'Meta París 1.5°C (170 kg / persona / mes)',
    currentMonthTotal: 'Total del Mes Actual',
    perPersonFootprint: 'Huella por Persona',
    previousBillingCycle: 'Periodo Anterior',
    peakCategoryDriver: 'Categoría Principal',
    easyVisualMode: 'Modo Visual Fácil',
    technicalMode: 'Modo Técnico',
    saveMonthlyAudit: 'Guardar Auditoría Mensual',
    quickWinsTitle: 'Acciones Rápidas de Descarbonización Regional',
    historyTitle: 'Historial de Auditorías Mensuales',
    compareTitle: 'Comparación Mes a Mes',
    reportsTitle: 'Certificado de Auditoría de Carbono del Hogar',
    guestModeActive: 'Modo Invitado (Almacenamiento Local)',
    signIn: 'Iniciar Sesión',
    registerHousehold: 'Registrar Hogar',
  },
  fr: {
    brandName: 'TerraLedger',
    navDashboard: 'Tableau de bord',
    navCalculator: 'Calculateur',
    navRecommendations: 'Actions',
    navHistory: 'Historique',
    navCompare: 'Comparer',
    navReports: 'Certificats',
    navMethodology: 'Méthodologie',
    ctaInstantCalc: 'Calculateur Instantané (Sans Compte)',
    ctaDemoLogin: 'Foyer Démo en 1 Clic',
    heroTitle: 'Plateforme Universelle de Bilan Carbone et Décarbonation des Ménages',
    heroSubtitle:
      'Facteurs déterministes GIEC, AIE et DEFRA calibrés pour les réseaux électriques mondiaux, le chauffage, la mobilité et l’eau.',
    parisTargetLabel: 'Cible Paris 1,5°C (170 kg / pers. / mois)',
    currentMonthTotal: 'Total du Mois',
    perPersonFootprint: 'Empreinte par Personne',
    previousBillingCycle: 'Cycle Précédent',
    peakCategoryDriver: 'Poste Principal',
    easyVisualMode: 'Mode Visuel Simplifié',
    technicalMode: 'Mode Facturation',
    saveMonthlyAudit: 'Enregistrer le Bilan',
    quickWinsTitle: 'Actions de Décarbonation Régionales',
    historyTitle: 'Historique des Bilans Mensuels',
    compareTitle: 'Analyse Comparative Mensuelle',
    reportsTitle: 'Certificat Officiel d’Audit Carbone',
    guestModeActive: 'Mode Invité (Hors-ligne)',
    signIn: 'Connexion',
    registerHousehold: 'Créer un Foyer',
  },
  hi: {
    brandName: 'TerraLedger',
    navDashboard: 'डैशबोर्ड',
    navCalculator: 'कैलकुलेटर',
    navRecommendations: 'त्वरित उपाय',
    navHistory: 'इतिहास',
    navCompare: 'तुलना',
    navReports: 'प्रमाणपत्र',
    navMethodology: 'कार्यप्रणाली',
    ctaInstantCalc: 'तत्काल कैलकुलेटर (बिना लॉगिन)',
    ctaDemoLogin: '1-क्लिक डेमो परिवार',
    heroTitle: 'वैश्विक घरेलू कार्बन फुटप्रिंट और डीकार्बोनाइजेशन प्लेटफॉर्म',
    heroSubtitle:
      'IPCC, IEA और CEA वैज्ञानिक उत्सर्जन कारकों पर आधारित बिजली, रसोई ईंधन, परिवहन और जल उपयोग की सटीक गणना।',
    parisTargetLabel: 'पेरिस 1.5°C लक्ष्य (170 किग्रा / व्यक्ति / माह)',
    currentMonthTotal: 'वर्तमान माह कुल',
    perPersonFootprint: 'प्रति व्यक्ति फुटप्रिंट',
    previousBillingCycle: 'पिछला बिलिंग चक्र',
    peakCategoryDriver: 'प्रमुख उत्सर्जन स्रोत',
    easyVisualMode: 'सरल विज़ुअल मोड',
    technicalMode: 'मानक बिलिंग मोड',
    saveMonthlyAudit: 'मासिक ऑडिट सहेजें',
    quickWinsTitle: 'क्षेत्रीय डीकार्बोनाइजेशन उपाय',
    historyTitle: 'मासिक कार्बन ऑडिट इतिहास',
    compareTitle: 'माह-दर-माह तुलनात्मक विश्लेषण',
    reportsTitle: 'प्रमाणित घरेलू कार्बन ऑडिट रिपोर्ट',
    guestModeActive: 'अतिथि मोड (लोकल स्टोरेज)',
    signIn: 'लॉग इन',
    registerHousehold: 'परिवार पंजीकृत करें',
  },
  ar: {
    brandName: 'TerraLedger',
    navDashboard: 'لوحة التحكم',
    navCalculator: 'الحاسبة',
    navRecommendations: 'حلول سريعة',
    navHistory: 'السجل',
    navCompare: 'مقارنة',
    navReports: 'التقارير',
    navMethodology: 'المنهجية',
    ctaInstantCalc: 'حاسبة فورية (بدون تسجيل)',
    ctaDemoLogin: 'حساب تجريبي بنقرة واحدة',
    heroTitle: 'المنصة العالمية لحساب البصمة الكربونية المنزلية وإزالة الكربون',
    heroSubtitle:
      'معاملات الانبعاثات العلمية المعتمدة من IPCC و IEA لشبكات الكهرباء العالمية والوقود المنزلي والنقل والمياه.',
    parisTargetLabel: 'هدف باريس 1.5 درجة (170 كجم / فرد / شهر)',
    currentMonthTotal: 'إجمالي الشهر الحالي',
    perPersonFootprint: 'البصمة لكل فرد',
    previousBillingCycle: 'الفترة السابقة',
    peakCategoryDriver: 'المصدر الأعلى للانبعاثات',
    easyVisualMode: 'الوضع البصري المبسط',
    technicalMode: 'الوضع القياسي',
    saveMonthlyAudit: 'حفظ التدقيق الشهري',
    quickWinsTitle: 'حلول خفض الكربون المخصصة لمنطقتك',
    historyTitle: 'سجل التدقيقات الشهرية',
    compareTitle: 'تحليل المقارنة الشهرية',
    reportsTitle: 'شهادة تدقيق الكربون المنزلي المعتمدة',
    guestModeActive: 'وضع الضيف (تخزين محلي)',
    signIn: 'تسجيل الدخول',
    registerHousehold: 'تسجيل منزل جديد',
  },
  pt: {
    brandName: 'TerraLedger',
    navDashboard: 'Painel',
    navCalculator: 'Calculadora',
    navRecommendations: 'Ações Rápidas',
    navHistory: 'Histórico',
    navCompare: 'Comparar',
    navReports: 'Relatórios',
    navMethodology: 'Metodologia',
    ctaInstantCalc: 'Calculadora Instantânea (Sem Cadastro)',
    ctaDemoLogin: 'Residência Demo em 1 Clique',
    heroTitle: 'Plataforma Universal de Pegada de Carbono e Descarbonização Residencial',
    heroSubtitle:
      'Fatores científicos determinísticos do IPCC, AIE e redes nacionais para eletricidade, combustíveis, mobilidade e água.',
    parisTargetLabel: 'Meta Paris 1,5°C (170 kg / pessoa / mês)',
    currentMonthTotal: 'Total do Mês Atual',
    perPersonFootprint: 'Pegada por Pessoa',
    previousBillingCycle: 'Período Anterior',
    peakCategoryDriver: 'Maior Fonte de Emissão',
    easyVisualMode: 'Modo Visual Fácil',
    technicalMode: 'Modo Técnico',
    saveMonthlyAudit: 'Salvar Auditoria Mensal',
    quickWinsTitle: 'Ações Rápidas de Descarbonização',
    historyTitle: 'Histórico de Auditorias Mensais',
    compareTitle: 'Comparação Mês a Mês',
    reportsTitle: 'Certificado de Auditoria de Carbono Residencial',
    guestModeActive: 'Modo Visitante (Offline Local)',
    signIn: 'Entrar',
    registerHousehold: 'Cadastrar Residência',
  },
  zh: {
    brandName: 'TerraLedger',
    navDashboard: '仪表盘',
    navCalculator: '碳计算器',
    navRecommendations: '减排速赢',
    navHistory: '历史记录',
    navCompare: '月度对比',
    navReports: '认证报告',
    navMethodology: '科学方法论',
    ctaInstantCalc: '即刻计算（无需注册）',
    ctaDemoLogin: '一键体验示范家庭',
    heroTitle: '全球家庭碳足迹核算与深度脱碳平台',
    heroSubtitle:
      '基于 IPCC、IEA、DEFRA 与各国电网排放因子，精准核算家庭电力、清洁炊事供暖、交通出行与水废碳排放。',
    parisTargetLabel: '巴黎协定 1.5°C 目标 (170 kg / 人 / 月)',
    currentMonthTotal: '本月总排放量',
    perPersonFootprint: '人均月碳足迹',
    previousBillingCycle: '上个账单周期',
    peakCategoryDriver: '首要排放源',
    easyVisualMode: '简易直观模式',
    technicalMode: '标准账单模式',
    saveMonthlyAudit: '保存月度碳核算',
    quickWinsTitle: '区域定制化家庭脱碳速赢方案',
    historyTitle: '历史月度碳核算档案',
    compareTitle: '月度环比偏差分析',
    reportsTitle: '家庭碳核算官方认证证书',
    guestModeActive: '访客模式（本地离线存储）',
    signIn: '登录',
    registerHousehold: '注册家庭账户',
  },
};
