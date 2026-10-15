/**
 * Canonical Financial Calculations & Number-to-Words Engine
 * Strictly follows the School Management PRD specification:
 * - feeNetPayable = Amount - Discount + LateFee
 * - feeDue = feeNetPayable - PaidAmount
 * - salaryNet = basic + allowances + bonus - deductions (or amount - deductions if components are 0)
 * - numToWords: Indian Numbering System (Thousand, Lakh, Crore)
 */

export interface FeeCalculationInput {
  amount: number;
  discount?: number;
  lateFee?: number;
  paidAmount?: number;
}

export interface FeeCalculationResult {
  amount: number;
  discount: number;
  lateFee: number;
  netPayable: number;
  paidAmount: number;
  dueAmount: number;
  status: "Due" | "Partial" | "Paid";
}

export function calculateFee(input: FeeCalculationInput): FeeCalculationResult {
  const amount = Math.max(0, Number(input.amount) || 0);
  const discount = Math.max(0, Number(input.discount) || 0);
  const lateFee = Math.max(0, Number(input.lateFee) || 0);
  const paidAmount = Math.max(0, Number(input.paidAmount) || 0);

  // feeNetPayable = Amount - Discount + LateFee
  const netPayable = Math.max(0, Math.round((amount - discount + lateFee) * 100) / 100);

  // feeDue = feeNetPayable - PaidAmount
  const dueAmount = Math.max(0, Math.round((netPayable - paidAmount) * 100) / 100);

  let status: "Due" | "Partial" | "Paid" = "Due";
  if (paidAmount >= netPayable && netPayable > 0) {
    status = "Paid";
  } else if (paidAmount > 0) {
    status = "Partial";
  } else {
    status = "Due";
  }

  return {
    amount,
    discount,
    lateFee,
    netPayable,
    paidAmount,
    dueAmount,
    status,
  };
}

export interface SalaryCalculationInput {
  amount?: number; // Gross / flat
  basic?: number;
  allowances?: number;
  deductions?: number;
  bonus?: number;
  paidAmount?: number;
}

export interface SalaryCalculationResult {
  amount: number;
  basic: number;
  allowances: number;
  deductions: number;
  bonus: number;
  netPay: number;
  paidAmount: number;
  dueAmount: number;
  status: "Unpaid" | "Partial" | "Paid";
}

export function calculateSalary(input: SalaryCalculationInput): SalaryCalculationResult {
  const amount = Math.max(0, Number(input.amount) || 0);
  const basic = Math.max(0, Number(input.basic) || 0);
  const allowances = Math.max(0, Number(input.allowances) || 0);
  const deductions = Math.max(0, Number(input.deductions) || 0);
  const bonus = Math.max(0, Number(input.bonus) || 0);
  const paidAmount = Math.max(0, Number(input.paidAmount) || 0);

  // An earnings breakdown takes precedence over flat gross salary
  const hasBreakdown = basic > 0 || allowances > 0 || bonus > 0;
  const grossEarnings = hasBreakdown ? (basic + allowances + bonus) : amount;

  const netPay = Math.max(0, Math.round((grossEarnings - deductions) * 100) / 100);
  const dueAmount = Math.max(0, Math.round((netPay - paidAmount) * 100) / 100);

  let status: "Unpaid" | "Partial" | "Paid" = "Unpaid";
  if (paidAmount >= netPay && netPay > 0) {
    status = "Paid";
  } else if (paidAmount > 0) {
    status = "Partial";
  } else {
    status = "Unpaid";
  }

  return {
    amount: grossEarnings,
    basic,
    allowances,
    deductions,
    bonus,
    netPay,
    paidAmount,
    dueAmount,
    status,
  };
}

/**
 * Converts a numeric amount to English words using the Indian Numbering System
 * e.g., 125000 -> "One Lakh Twenty Five Thousand Rupees Only"
 */
const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function convertTwoDigits(n: number): string {
  if (n < 20) return ones[n];
  const t = tens[Math.floor(n / 10)];
  const o = ones[n % 10];
  return o ? `${t} ${o}` : t;
}

function convertThreeDigits(n: number): string {
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  let res = "";
  if (hundred > 0) {
    res += `${ones[hundred]} Hundred`;
    if (remainder > 0) res += " and ";
  }
  if (remainder > 0) {
    res += convertTwoDigits(remainder);
  }
  return res.trim();
}

export function numToWords(amount: number): string {
  if (amount === 0) return "Zero Rupees Only";

  const num = Math.abs(amount);
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  if (integerPart === 0 && decimalPart > 0) {
    return `${convertTwoDigits(decimalPart)} Paise Only`;
  }

  let crore = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;

  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  let hundredPart = remainder;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(`${convertThreeDigits(crore)} Crore`);
  }
  if (lakh > 0) {
    parts.push(`${convertTwoDigits(lakh)} Lakh`);
  }
  if (thousand > 0) {
    parts.push(`${convertTwoDigits(thousand)} Thousand`);
  }
  if (hundredPart > 0) {
    parts.push(convertThreeDigits(hundredPart));
  }

  let words = parts.join(" ") + " Rupees";
  if (decimalPart > 0) {
    words += ` and ${convertTwoDigits(decimalPart)} Paise`;
  }
  words += " Only";

  return words.replace(/\s+/g, " ").trim();
}
