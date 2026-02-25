// Моковые данные для платформы руководства

export interface FinancialMetrics {
  revenue: { value: number; change: number; period: string };
  ebitda: { value: number; change: number; period: string };
  npv: { value: number; change: number; period: string };
  roi: { value: number; change: number; period: string };
  roe: { value: number; change: number; period: string };
  irr: { value: number; change: number; period: string };
}

export interface NPVData {
  month: string;
  value: number;
  plan: number;
}

export interface ProjectCard {
  id: string;
  name: string;
  image: string;
  area: string;
  startDate: string;
  endDate: string;
  realization: number;
  currentStatus: string[];
  ebitda: string;
}

export interface BalanceData {
  assets: {
    total: { forecast: number; plan: number; vsPlan: number; delta: number };
    nonCurrent: { forecast: number; plan: number; vsPlan: number; delta: number };
    current: { forecast: number; plan: number; vsPlan: number; delta: number };
  };
  liabilities: {
    total: { forecast: number; plan: number; vsPlan: number; delta: number };
    longTerm: { forecast: number; plan: number; vsPlan: number; delta: number };
    shortTerm: { forecast: number; plan: number; vsPlan: number; delta: number };
  };
  equity: {
    total: { forecast: number; plan: number; vsPlan: number; delta: number };
    authorized: { forecast: number; plan: number };
    additional: { forecast: number; plan: number };
    retained: { forecast: number; plan: number; vsPlan: number; delta: number };
    reserve: { forecast: number; plan: number };
  };
}

export interface BalanceCards {
  cash: { value: number; vsPlan: number; delta: number };
  receivables: { value: number; vsPlan: number; delta: number };
  payables: { value: number; vsPlan: number; delta: number };
  equity: { value: number; vsPlan: number; delta: number };
}

export interface AssetsChartData {
  month: string;
  plan: number;
  forecast: number;
  fact: number;
  growth: number;
}

export interface CashFlowData {
  operational: {
    total: { forecast: number; plan: number; vsPlan: number; delta: number };
    receipts: { forecast: number; plan: number; vsPlan: number; delta: number };
    expenses: { forecast: number; plan: number; vsPlan: number; delta: number };
    taxes: { forecast: number; plan: number; vsPlan: number; delta: number };
  };
  investment: {
    total: { forecast: number; plan: number; vsPlan: number; delta: number };
    assetSales: { forecast: number; plan: number; vsPlan: number; delta: number };
    assetPurchases: { forecast: number; plan: number; vsPlan: number; delta: number };
    otherInvestments: { forecast: number; plan: number; vsPlan: number; delta: number };
  };
  financial: {
    total: { forecast: number; plan: number; vsPlan: number; delta: number };
  };
  cashBalance: {
    value: number;
    vsPlan: number;
    delta: number;
  };
}

export interface AdvancePaymentsData {
  month: string;
  plan: number;
  forecast: number;
  fact: number;
  growth: number;
}

export interface PLData {
  revenue: { forecast: number; plan: number; vsPlan: number; delta: number };
  revenueMain: { forecast: number; plan: number; vsPlan: number; delta: number };
  revenueOther: { forecast: number; plan: number; vsPlan: number; delta: number };
  costOfSales: { forecast: number; plan: number; vsPlan: number; delta: number };
  grossProfit: { forecast: number; plan: number; vsPlan: number; delta: number };
  operatingExpenses: { forecast: number; plan: number; vsPlan: number; delta: number };
  adminExpenses: { forecast: number; plan: number; vsPlan: number; delta: number };
  marketingExpenses: { forecast: number; plan: number; vsPlan: number; delta: number };
  depreciation: { forecast: number; plan: number; vsPlan: number; delta: number };
  ebitda: { forecast: number; plan: number; vsPlan: number; delta: number };
  interest: { forecast: number; plan: number; vsPlan: number; delta: number };
  taxes: { forecast: number; plan: number; vsPlan: number; delta: number };
}

export interface PLCards {
  revenue: { value: number; vsPlan: number; delta: number };
  costOfSales: { value: number; vsPlan: number; delta: number };
  operatingExpenses: { value: number; vsPlan: number; delta: number };
  netProfit: { value: number; vsPlan: number; delta: number };
}

export interface EBITData {
  month: string;
  plan: number;
  forecast: number;
  fact: number;
  growth: number;
}

export interface ProjectDetail {
  id: string;
  name: string;
  budgetUtilized: { percent: number; used: number; total: number };
  sales: {
    apartments: { sold: number; total: number };
    parking: { sold: number; total: number };
    commercial: { sold: number; total: number };
    storage: { sold: number; total: number };
  };
  realization: { percent: number; change: number; period: string };
  ebitda: { month: string; value: number }[];
  contracts: { total: number; inProgress: number; signed: number; cancelled: number };
  cashFlow: { month: string; value: number }[];
  documents: { name: string; type: string }[];
}

export interface ContractStatus {
  new: number;
  approval: number;
  revision: number;
  revised: number;
  approved: number;
  signed: number;
  cancelled: number;
}

export interface ContractsData {
  all: { total: number; statuses: ContractStatus };
  internal: { total: number; statuses: Partial<ContractStatus> };
  external: { total: number; statuses: Partial<ContractStatus> };
  dynamics: { month: string; statuses: ContractStatus }[];
}

export interface PurchaseStructure {
  materials: { percent: number; value: number };
  systems: { percent: number; value: number };
  landscaping: { percent: number; value: number };
}

export interface SupplierRating {
  name: string;
  avgAmount: number;
  quantity: number;
}

export interface OverduePurchase {
  supplier: string;
  purchase: string;
  plannedDate: string;
  daysOverdue: number;
}

export interface UpcomingPurchase {
  supplier: string;
  type: string;
  purchase: string;
  date: string;
}

export interface PurchasesData {
  structure: PurchaseStructure;
  active: number;
  overdue: number;
  chart: { month: string; value: number }[];
  suppliers: SupplierRating[];
  overdueList: OverduePurchase[];
  upcomingList: UpcomingPurchase[];
}

export interface RDCDStatus {
  agreed: number;
  agreedExpert: number;
  approved: number;
  exported: number;
  missing: number;
}

export interface RDCDData {
  working: { total: number; statuses: RDCDStatus };
  estimated: { total: number; statuses: RDCDStatus };
  dynamics: { month: string; statuses: RDCDStatus }[];
}

export interface ControlSystemData {
  workersOnSite: { fact: number; plan: number; shortfall: number };
  avgTimeOnSite: { fact: number; plan: number; shortfall: number };
  brigadeDistribution: { brigade: string; fact: number; plan: number }[];
  brigadeTime: { brigade: string; fact: number; plan: number }[];
  absent: { name: string; role: string }[];
  deficiencies: { name: string; hours: number }[];
  roles: { role: string; count: number }[];
  passes: { date: string; fact: number; plan: number }[];
  avgTime: { date: string; fact: number; plan: number }[];
}

// API функции

export const getFinancialMetrics = (): FinancialMetrics => ({
  revenue: { value: 406.32, change: 62.80, period: '7M\'24' },
  ebitda: { value: 401.63, change: 64.18, period: '7M\'24' },
  npv: { value: 1.58, change: 45.00, period: '7M\'24' },
  roi: { value: 20.9, change: 0.30, period: '7M\'24' },
  roe: { value: 19.2, change: 1.00, period: '7M\'24' },
  irr: { value: 16.10, change: 0.10, period: '7M\'24' },
});

export const getNPVData = (): NPVData[] => [
  { month: 'Янв', value: 1.62, plan: 1.55 },
  { month: 'Фев', value: 1.67, plan: 1.60 },
  { month: 'Мар', value: 1.63, plan: 1.58 },
  { month: 'Апр', value: 1.57, plan: 1.56 },
  { month: 'Май', value: 1.53, plan: 1.52 },
  { month: 'Июн', value: 1.49, plan: 1.50 },
  { month: 'Июл', value: 1.54, plan: 1.48 },
  { month: 'Авг', value: 1.58, plan: 1.51 },
];

export const getProjectsData = (): ProjectCard[] => [
  {
    id: '1',
    name: 'ЖК 1',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
    area: '100 тыс. м²',
    startDate: '01.01.2023',
    endDate: '01.01.2027',
    realization: 32.0,
    currentStatus: ['Вторая очередь', 'Первая очередь'],
    ebitda: '159.76 млн р.',
  },
  {
    id: '2',
    name: 'ЖК 2',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
    area: '50 тыс. м²',
    startDate: '01.01.2022',
    endDate: '01.03.2025',
    realization: 51.0,
    currentStatus: ['Вторая очередь'],
    ebitda: '184.61 млн р.',
  },
  {
    id: '3',
    name: 'ЖК 3',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
    area: '10 тыс. м²',
    startDate: '01.01.2024',
    endDate: '01.10.2026',
    realization: 47.0,
    currentStatus: ['Первая очередь'],
    ebitda: '57.25 млн р.',
  },
];

export const getBalanceData = (): BalanceData => ({
  assets: {
    total: { forecast: 4422.1, plan: 4621.9, vsPlan: -199.8, delta: -4.3 },
    nonCurrent: { forecast: 3203.6, plan: 3409.6, vsPlan: -206.0, delta: -6.0 },
    current: { forecast: 1218.5, plan: 1212.3, vsPlan: 6.2, delta: 0.5 },
  },
  liabilities: {
    total: { forecast: 3217.6, plan: 3716.6, vsPlan: -499.0, delta: -13.4 },
    longTerm: { forecast: 1364.6, plan: 1624.6, vsPlan: -260.0, delta: -16.0 },
    shortTerm: { forecast: 1853.0, plan: 2092.0, vsPlan: -239.0, delta: -11.4 },
  },
  equity: {
    total: { forecast: 1204.5, plan: 1250.0, vsPlan: -45.5, delta: -3.6 },
    authorized: { forecast: 500.0, plan: 500.0 },
    additional: { forecast: 250.0, plan: 250.0 },
    retained: { forecast: 354.5, plan: 400.0, vsPlan: -45.5, delta: -11.4 },
    reserve: { forecast: 100.0, plan: 100.0 },
  },
});

export const getBalanceCards = (): BalanceCards => ({
  cash: { value: 334.5, vsPlan: -45.82, delta: -12.05 },
  receivables: { value: 690.7, vsPlan: 39.07, delta: 6.00 },
  payables: { value: 664.3, vsPlan: -290.86, delta: -30.45 },
  equity: { value: 1204.5, vsPlan: -45.49, delta: -3.64 },
});

export const getAssetsChartData = (): AssetsChartData[] => [
  { month: 'Июн', plan: 6159, forecast: 6360, fact: 6360, growth: 5.0 },
  { month: 'Июл', plan: 5723, forecast: 7045, fact: 7045, growth: 23.1 },
  { month: 'Авг', plan: 5710, forecast: 5420, fact: 5420, growth: -5.1 },
  { month: 'Сен', plan: 5943, forecast: 6987, fact: 6987, growth: 17.6 },
  { month: 'Окт', plan: 4959, forecast: 5136, fact: 5136, growth: 3.6 },
  { month: 'Ноя', plan: 4980, forecast: 5054, fact: 5054, growth: 1.5 },
  { month: 'Дек', plan: 4622, forecast: 4422, fact: 4422, growth: -4.3 },
];

export const getCashFlowData = (): CashFlowData => ({
  operational: {
    total: { forecast: -16.5, plan: -15.9, vsPlan: -0.6, delta: 3.5 },
    receipts: { forecast: 6.2, plan: 4.3, vsPlan: 1.9, delta: 44.0 },
    expenses: { forecast: -21.2, plan: -18.5, vsPlan: -2.7, delta: 14.6 },
    taxes: { forecast: -1.5, plan: -1.7, vsPlan: 0.2, delta: -14.2 },
  },
  investment: {
    total: { forecast: -527.3, plan: -1013.6, vsPlan: 486.2, delta: -48.0 },
    assetSales: { forecast: 214.6, plan: 272.8, vsPlan: -58.2, delta: -21.3 },
    assetPurchases: { forecast: -739.0, plan: -1285.1, vsPlan: 546.1, delta: -42.5 },
    otherInvestments: { forecast: -3.0, plan: -1.3, vsPlan: -1.7, delta: 132.2 },
  },
  financial: {
    total: { forecast: -21.2, plan: -18.5, vsPlan: -2.7, delta: 14.6 },
  },
  cashBalance: {
    value: 25300.0,
    vsPlan: -1304.04,
    delta: -4.90,
  },
});

export const getAdvancePaymentsData = (): AdvancePaymentsData[] => [
  { month: 'Июл', plan: 447, forecast: 447, fact: 3662, growth: -17.7 },
  { month: 'Авг', plan: 5091, forecast: 5091, fact: 3850, growth: -24.4 },
  { month: 'Сен', plan: 4127, forecast: 4127, fact: 4471, growth: 8.4 },
  { month: 'Окт', plan: 1008, forecast: 1008, fact: 1314, growth: 30.3 },
  { month: 'Ноя', plan: 8698, forecast: 8698, fact: 11205, growth: 28.8 },
  { month: 'Дек', plan: 1349, forecast: 1349, fact: 2087, growth: 54.8 },
];

export const getPLData = (): PLData => ({
  revenue: { forecast: 232.6, plan: 315.8, vsPlan: -83.2, delta: -26.4 },
  revenueMain: { forecast: 232.5, plan: 315.8, vsPlan: -83.3, delta: -26.4 },
  revenueOther: { forecast: 0.1, plan: 0.1, vsPlan: 0.0, delta: 45.0 },
  costOfSales: { forecast: 10.8, plan: 39.0, vsPlan: -28.2, delta: -72.4 },
  grossProfit: { forecast: 221.8, plan: 276.9, vsPlan: -55.1, delta: -19.9 },
  operatingExpenses: { forecast: 2.4, plan: 1.2, vsPlan: 1.3, delta: 107.6 },
  adminExpenses: { forecast: 2.1, plan: 0.4, vsPlan: 1.7, delta: 422.6 },
  marketingExpenses: { forecast: 0.1, plan: 0.4, vsPlan: -0.3, delta: -80.7 },
  depreciation: { forecast: 0.2, plan: 0.4, vsPlan: -0.1, delta: -33.3 },
  ebitda: { forecast: 219.6, plan: 276.1, vsPlan: -56.4, delta: -20.4 },
  interest: { forecast: 1.3, plan: 0.3, vsPlan: 1.1, delta: 396.3 },
  taxes: { forecast: 2.7, plan: 0.4, vsPlan: 2.3, delta: 599.9 },
});

export const getPLCards = (): PLCards => ({
  revenue: { value: 232.6, vsPlan: -83.25, delta: -26.36 },
  costOfSales: { value: 10.8, vsPlan: -28.20, delta: -72.35 },
  operatingExpenses: { value: 2.4426, vsPlan: 1.26611, delta: 107.62 },
  netProfit: { value: 215.3, vsPlan: -59.72, delta: -21.71 },
});

export const getEBITData = (): EBITData[] => [
  { month: 'Апр', plan: 236, forecast: 236, fact: 182, growth: -22.7 },
  { month: 'Май', plan: 314, forecast: 314, fact: 227, growth: -27.6 },
  { month: 'Июн', plan: 358, forecast: 358, fact: 258, growth: -28.0 },
  { month: 'Июл', plan: 258, forecast: 258, fact: 337, growth: 30.5 },
  { month: 'Авг', plan: 402, forecast: 402, fact: 166, growth: 142.1 },
  { month: 'Сен', plan: 456, forecast: 456, fact: 162, growth: 180.8 },
  { month: 'Окт', plan: 221, forecast: 221, fact: 254, growth: 14.6 },
  { month: 'Ноя', plan: 305, forecast: 305, fact: 182, growth: -40.4 },
  { month: 'Дек', plan: 276, forecast: 276, fact: 219, growth: -20.4 },
];

export const getProjectDetail = (id: string): ProjectDetail => ({
  id,
  name: `ЖК ${id}`,
  budgetUtilized: { percent: 5.80, used: 226, total: 3889 },
  sales: {
    apartments: { sold: 162, total: 350 },
    parking: { sold: 251, total: 750 },
    commercial: { sold: 26, total: 55 },
    storage: { sold: 82, total: 100 },
  },
  realization: { percent: 32.0, change: 2.0, period: '7M\'24' },
  ebitda: [
    { month: 'Фев', value: 65.70 },
    { month: 'Мар', value: 48.32 },
    { month: 'Апр', value: 60.90 },
    { month: 'Май', value: 75.96 },
    { month: 'Июн', value: 85.93 },
    { month: 'Июл', value: 112.51 },
    { month: 'Авг', value: 133.95 },
  ],
  contracts: { total: 16, inProgress: 9, signed: 6, cancelled: 1 },
  cashFlow: [
    { month: 'Авг 2024', value: 690.31 },
    { month: 'Сен', value: 461.46 },
    { month: 'Окт', value: 876.36 },
    { month: 'Ноя', value: 474.64 },
    { month: 'Дек', value: 575.14 },
  ],
  documents: [
    { name: 'Обзор многоквартирного жилищного строительства в Российской Федерации.pdf', type: 'pdf' },
    { name: 'Итоги I полугодия 2024 года в жилищной сфере.pdf', type: 'pdf' },
  ],
});

export const getContractsData = (): ContractsData => ({
  all: {
    total: 39,
    statuses: {
      new: 5,
      approval: 10,
      revision: 3,
      revised: 2,
      approved: 3,
      signed: 13,
      cancelled: 3,
    },
  },
  internal: {
    total: 11,
    statuses: {
      revised: 2,
      approval: 2,
      signed: 4,
      new: 3,
    },
  },
  external: {
    total: 28,
    statuses: {
      new: 3,
      approval: 8,
      revision: 3,
      revised: 2,
      approved: 3,
      signed: 9,
    },
  },
  dynamics: [
    {
      month: 'Апр 2024',
      statuses: { new: 5, approval: 11, revision: 7, revised: 14, approved: 3, signed: 2, cancelled: 2 },
    },
    {
      month: 'Май',
      statuses: { new: 11, approval: 19, revised: 11, signed: 7 },
    },
    {
      month: 'Июн',
      statuses: { new: 3, approval: 18, revised: 9, signed: 11, approved: 9 },
    },
    {
      month: 'Июл',
      statuses: { new: 8, approval: 16, revised: 2, signed: 9, approved: 16, cancelled: 9 },
    },
    {
      month: 'Авг',
      statuses: { new: 5, approval: 10, revision: 3, revised: 2, approved: 3, signed: 13, cancelled: 3 },
    },
  ],
});

export const getPurchasesData = (): PurchasesData => ({
  structure: {
    materials: { percent: 87.2, value: 76.7 },
    systems: { percent: 7.5, value: 7.5 },
    landscaping: { percent: 6.7, value: 6.7 },
  },
  active: 5,
  overdue: 2,
  chart: [
    { month: 'Июн', value: 8.5 },
    { month: 'Июл', value: 9.2 },
    { month: 'Авг', value: 10.0 },
    { month: 'Сен', value: 9.8 },
    { month: 'Окт', value: 10.5 },
  ],
  suppliers: [
    { name: 'КирпичСтро', avgAmount: 18000, quantity: 15 },
    { name: 'СтройМатер', avgAmount: 10000, quantity: 12 },
    { name: 'ЭлектроСна', avgAmount: 7500, quantity: 8 },
    { name: 'БлокСтрой', avgAmount: 6000, quantity: 10 },
    { name: 'ПроектСтро', avgAmount: 4000, quantity: 5 },
    { name: 'ГравийСтро', avgAmount: 4000, quantity: 7 },
    { name: 'СиликатСтр', avgAmount: 3000, quantity: 4 },
    { name: 'ДорСтрой', avgAmount: 3000, quantity: 3 },
    { name: 'ОхранаСист', avgAmount: 3000, quantity: 2 },
  ],
  overdueList: [
    { supplier: 'СистемыКомфорт', purchase: 'Услуги по настройке систем', plannedDate: '12.06.2024', daysOverdue: 81 },
    { supplier: 'ОхранаСистемы', purchase: 'Системы охраны', plannedDate: '23.07.2024', daysOverdue: 40 },
  ],
  upcomingList: [
    { supplier: 'ОтделкаСтрой', type: 'Отделка', purchase: 'Шпаклевка', date: '21.09.24' },
    { supplier: 'Трубострой', type: 'Инженерные системы', purchase: 'Водопроводные трубы', date: '04.10.24' },
    { supplier: 'ОтделкаСтрой', type: 'Отделка', purchase: 'Услуги по покраске', date: '20.10.24' },
  ],
});

export const getRDCDData = (): RDCDData => ({
  working: {
    total: 72,
    statuses: {
      agreed: 11,
      agreedExpert: 15,
      approved: 14,
      exported: 21,
      missing: 11,
    },
  },
  estimated: {
    total: 91,
    statuses: {
      agreed: 14,
      agreedExpert: 15,
      approved: 25,
      exported: 16,
      missing: 21,
    },
  },
  dynamics: [
    {
      month: 'Июн 2024',
      statuses: { agreed: 17, agreedExpert: 18, approved: 22, exported: 20, missing: 15 },
    },
    {
      month: 'Июл',
      statuses: { agreed: 21, agreedExpert: 18, approved: 20, exported: 15, missing: 11 },
    },
    {
      month: 'Авг',
      statuses: { agreed: 11, agreedExpert: 15, approved: 14, exported: 21, missing: 11 },
    },
  ],
});

export const getControlSystemData = (): ControlSystemData => ({
  workersOnSite: { fact: 54, plan: 61, shortfall: 7 },
  avgTimeOnSite: { fact: 6.6, plan: 8.0, shortfall: 1.4 },
  brigadeDistribution: [
    { brigade: 'Бригада 1', fact: 13, plan: 13 },
    { brigade: 'Бригада 2', fact: 7, plan: 8 },
    { brigade: 'Бригада 3', fact: 7, plan: 8 },
    { brigade: 'Бригада 4', fact: 8, plan: 9 },
    { brigade: 'Бригада 5', fact: 4, plan: 6 },
    { brigade: 'Бригада 6', fact: 7, plan: 8 },
    { brigade: 'Бригада 7', fact: 8, plan: 9 },
  ],
  brigadeTime: [
    { brigade: 'Бригада 1', fact: 12.6, plan: 8.0 },
    { brigade: 'Бригада 2', fact: 4.5, plan: 8.0 },
    { brigade: 'Бригада 3', fact: 4.6, plan: 8.0 },
    { brigade: 'Бригада 4', fact: 4.4, plan: 8.0 },
    { brigade: 'Бригада 5', fact: 5.5, plan: 8.0 },
    { brigade: 'Бригада 6', fact: 4.5, plan: 8.0 },
    { brigade: 'Бригада 7', fact: 4.7, plan: 8.0 },
  ],
  absent: [
    { name: 'Иванов Алексей Петрович', role: 'Прораб' },
    { name: 'Кириллова Татьяна Михайловна', role: 'Инженер-строитель' },
  ],
  deficiencies: [
    { name: 'Панов Алексей Петрович', hours: 7.33 },
    { name: 'Шестаков Николай Владимирович', hours: 7.72 },
  ],
  roles: [
    { role: 'Маляр', count: 5 },
    { role: 'Электрик', count: 4 },
    { role: 'Прораб', count: 3 },
    { role: 'Каменщик', count: 2 },
    { role: 'Инженер-строитель', count: 1 },
  ],
  passes: [
    { date: '03', fact: 12, plan: 10 },
    { date: '04', fact: 14, plan: 12 },
    { date: '05', fact: 15, plan: 13 },
    { date: '06', fact: 13, plan: 14 },
    { date: '07', fact: 11, plan: 12 },
    { date: '08', fact: 10, plan: 11 },
    { date: '30', fact: 9, plan: 10 },
    { date: '01', fact: 12, plan: 11 },
    { date: '02', fact: 14, plan: 12 },
    { date: '03', fact: 15, plan: 13 },
    { date: '04', fact: 13, plan: 14 },
    { date: '05', fact: 11, plan: 12 },
    { date: '06', fact: 10, plan: 11 },
    { date: '12', fact: 12, plan: 10 },
  ],
  avgTime: [
    { date: '15', fact: 16.2, plan: 12.0 },
    { date: '16', fact: 15.5, plan: 12.5 },
    { date: '17', fact: 14.2, plan: 13.0 },
    { date: '18', fact: 15.1, plan: 13.5 },
    { date: '19', fact: 15.9, plan: 14.0 },
    { date: '20', fact: 16.8, plan: 14.3 },
    { date: '01', fact: 14.5, plan: 11.8 },
    { date: '02', fact: 13.2, plan: 12.0 },
    { date: '03', fact: 12.8, plan: 12.5 },
    { date: '04', fact: 11.5, plan: 13.0 },
    { date: '05', fact: 10.2, plan: 13.5 },
    { date: '12', fact: 9.8, plan: 14.0 },
  ],
});


