import { InjectionToken } from '@angular/core';

export interface Messages {
  common: {
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    loading: string;
    noData: string;
    search: string;
    filter: string;
    create: string;
    edit: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    reset: string;
    close: string;
    yes: string;
    no: string;
    actions: string;
    details: string;
    status: string;
    date: string;
    amount: string;
    total: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    description: string;
    type: string;
    category: string;
    all: string;
    id: string;
  };
  errors: {
    unauthorized: string;
    forbidden: string;
    notFound: string;
    conflict: string;
    rateLimit: string;
    serverError: string;
    required: string;
    invalidEmail: string;
    minLength: string;
    maxLength: string;
    invalidFormat: string;
    networkError: string;
  };
  auth: {
    login: string;
    logout: string;
    username: string;
    password: string;
    forgotPassword: string;
    signIn: string;
    signOut: string;
    sessionExpired: string;
    accessDenied: string;
  };
  tenant: {
    selectTenant: string;
    noTenantSelected: string;
    tenantName: string;
    tenantSlug: string;
    tenantPlan: string;
    tenantRegion: string;
    tenantStatus: string;
    createTenant: string;
    editTenant: string;
    listTitle: string;
    newTenant: string;
    searchByName: string;
    statusActive: string;
    statusSuspended: string;
    statusPending: string;
    planStarter: string;
    planProfessional: string;
    planEnterprise: string;
    createdAt: string;
    noTenantsFound: string;
    noTenantsFoundSubtitle: string;
  };
  orders: {
    orderList: string;
    orderDetail: string;
    createOrder: string;
    orderId: string;
    orderStatus: string;
    orderDate: string;
    orderTotal: string;
    orderItems: string;
    customer: string;
    customerId: string;
    draft: string;
    reserved: string;
    confirmed: string;
    cancelled: string;
    paid: string;
    noOrdersFound: string;
  };
  inventory: {
    adjustments: string;
    createAdjustment: string;
    sku: string;
    quantity: string;
    reason: string;
  };
  payments: {
    paymentList: string;
    paymentDetail: string;
    paymentStatus: string;
    pending: string;
    confirmed: string;
    failed: string;
    amount: string;
    currency: string;
  };
  ledger: {
    entries: string;
    balances: string;
    debit: string;
    credit: string;
    balance: string;
  };
  checkout: {
    cart: string;
    shipping: string;
    payment: string;
    confirmation: string;
    placeOrder: string;
    orderPlaced: string;
    emptyCart: string;
    continueShopping: string;
    shippingAddress: string;
    paymentMethod: string;
  };
  dashboard: {
    title: string;
    totalOrders: string;
    totalRevenue: string;
    activeInventory: string;
    pendingPayments: string;
    recentOrders: string;
    inventoryAlerts: string;
    revenueOverTime: string;
    ordersByStatus: string;
  };
  onboarding: {
    title: string;
    orgInfo: string;
    planSelection: string;
    configuration: string;
    review: string;
    success: string;
    createTenant: string;
    welcomeMessage: string;
  };
  notifications: {
    title: string;
    markAllRead: string;
    noNotifications: string;
    orderCreated: string;
    paymentReceived: string;
    inventoryLow: string;
  };
  accessibility: {
    skipToContent: string;
    mainNavigation: string;
    toggleDarkMode: string;
    increaseFont: string;
    decreaseFont: string;
  };
  app: {
    menuTooltip: string;
    userMenuLabel: string;
  };
  errorPage: {
    backToHome: string;
    defaultTitle: string;
    defaultMessage: string;
    correlationIdLabel: string;
  };
}

export type Locale = 'pt-BR' | 'en-US';

export const MESSAGES = new InjectionToken<Messages>('MESSAGES');
