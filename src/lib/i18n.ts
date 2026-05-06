export type Lang = "en" | "ar";

export const detectLang = (): Lang => {
  if (typeof window === "undefined") return "ar";
  const stored = localStorage.getItem("bz-lang") as Lang | null;
  if (stored === "en" || stored === "ar") return stored;
  return navigator.language?.toLowerCase().startsWith("ar") ? "ar" : "en";
};

export const t = {
  en: {
    brand: "Big Z Burger",
    tagline: "Smashed. Stacked. Signature.",
    location: "Madinah · Mudhainib",
    orderNow: "Order Now",
    menu: "Menu",
    cart: "Cart",
    addToCart: "Add",
    added: "Added to cart",
    soldOut: "Sold Out",
    cal: "cal",
    sar: "SAR",
    yourOrder: "Your Order",
    empty: "Your cart is empty",
    emptyHint: "Add something delicious from the menu",
    subtotal: "Subtotal",
    vat: "VAT (15%)",
    total: "Total",
    deliveryFee: "Delivery Fee",
    checkout: "Checkout",
    name: "Full Name",
    phone: "Phone Number",
    pickup: "Pickup",
    delivery: "Delivery",
    address: "Delivery Address",
    placeOrder: "Place Order via WhatsApp",
    addons: "Add-ons",
    qty: "Qty",
    remove: "Remove",
    categories: { burgers: "Burgers", fries: "Fries", sauces: "Sauces", drinks: "Drinks" },
    orderConfirmed: "Order Confirmed!",
    orderId: "Order ID",
    trackHint: "Save this ID to track your order",
    continueWA: "Continue to WhatsApp",
    waFallback: "If WhatsApp didn't open, tap the button.",
    track: "Track Order",
    status: { pending: "Pending", preparing: "Preparing", ready: "Ready", completed: "Completed", cancelled: "Cancelled" },
    admin: "Admin",
    signIn: "Sign In",
    signUp: "Create Admin Account",
    email: "Email",
    password: "Password",
    signOut: "Sign Out",
    orders: "Orders",
    inventory: "Inventory",
    analytics: "Analytics",
    today: "Orders Today",
    popular: "Most Popular",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    save: "Save",
    price: "Price",
    uploadImage: "Upload Image",
    requiredField: "Required",
    invalidPhone: "Invalid phone",
  },
  ar: {
    brand: "بيج زد برجر",
    tagline: "مسحوق. مكدس. مميز.",
    location: "المدينة · المضينب",
    orderNow: "اطلب الآن",
    menu: "القائمة",
    cart: "السلة",
    addToCart: "أضف",
    added: "تمت الإضافة",
    soldOut: "نفذ",
    cal: "سعرة",
    sar: "ر.س",
    yourOrder: "طلبك",
    empty: "السلة فارغة",
    emptyHint: "أضف شيئاً لذيذاً من القائمة",
    subtotal: "المجموع الفرعي",
    vat: "ضريبة (١٥٪)",
    total: "الإجمالي",
    deliveryFee: "رسوم التوصيل",
    checkout: "إتمام الطلب",
    name: "الاسم الكامل",
    phone: "رقم الجوال",
    pickup: "استلام",
    delivery: "توصيل",
    address: "عنوان التوصيل",
    placeOrder: "إرسال الطلب عبر واتساب",
    addons: "إضافات",
    qty: "الكمية",
    remove: "حذف",
    categories: { burgers: "برجر", fries: "بطاطس", sauces: "صوصات", drinks: "مشروبات" },
    orderConfirmed: "تم تأكيد الطلب!",
    orderId: "رقم الطلب",
    trackHint: "احفظ هذا الرقم لمتابعة طلبك",
    continueWA: "تابع إلى واتساب",
    waFallback: "إذا لم يفتح واتساب، اضغط على الزر.",
    track: "تتبع الطلب",
    status: { pending: "قيد الانتظار", preparing: "قيد التحضير", ready: "جاهز", completed: "مكتمل", cancelled: "ملغي" },
    admin: "الإدارة",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب إدارة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    signOut: "تسجيل الخروج",
    orders: "الطلبات",
    inventory: "المخزون",
    analytics: "التحليلات",
    today: "طلبات اليوم",
    popular: "الأكثر طلباً",
    inStock: "متوفر",
    outOfStock: "نفذ",
    save: "حفظ",
    price: "السعر",
    uploadImage: "رفع صورة",
    requiredField: "مطلوب",
    invalidPhone: "رقم غير صحيح",
  },
} as const;

export type Dict = typeof t.en;

export const VAT_RATE = 0.15;
export const DELIVERY_FEE = 10;
export const WHATSAPP_NUMBER = "966563569645";

export const splitVat = (totalIncl: number) => {
  const subtotal = totalIncl / (1 + VAT_RATE);
  const vat = totalIncl - subtotal;
  return { subtotal: round2(subtotal), vat: round2(vat) };
};
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const fmtSar = (n: number, lang: Lang) =>
  `${n.toFixed(2)} ${lang === "ar" ? "ر.س" : "SAR"}`;
