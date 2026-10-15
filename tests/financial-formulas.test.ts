import { describe, it, expect } from "vitest";
import { calculateFee, calculateSalary, numToWords } from "../lib/financial-formulas";

describe("Financial Calculations — School Management PRD", () => {
  describe("calculateFee", () => {
    it("correctly computes net payable with discount and late fee", () => {
      // Amount 700, Discount 70 (10%), Late fee 50 -> net = 680
      const res = calculateFee({ amount: 700, discount: 70, lateFee: 50, paidAmount: 0 });
      expect(res.netPayable).toBe(680);
      expect(res.dueAmount).toBe(680);
      expect(res.status).toBe("Due");
    });

    it("correctly identifies Paid status when paid >= netPayable", () => {
      const res = calculateFee({ amount: 650, discount: 0, lateFee: 0, paidAmount: 650 });
      expect(res.netPayable).toBe(650);
      expect(res.dueAmount).toBe(0);
      expect(res.status).toBe("Paid");
    });

    it("correctly identifies Partial status when 0 < paid < netPayable", () => {
      const res = calculateFee({ amount: 700, discount: 0, lateFee: 0, paidAmount: 350 });
      expect(res.netPayable).toBe(700);
      expect(res.dueAmount).toBe(350);
      expect(res.status).toBe("Partial");
    });
  });

  describe("calculateSalary", () => {
    it("prioritizes component breakdown over gross amount", () => {
      // Basic 25000 + Allowances 10000 + Bonus 1500 - Deductions 1500 = 35000
      const res = calculateSalary({
        amount: 30000,
        basic: 25000,
        allowances: 10000,
        bonus: 1500,
        deductions: 1500,
        paidAmount: 35000,
      });
      expect(res.netPay).toBe(35000);
      expect(res.dueAmount).toBe(0);
      expect(res.status).toBe("Paid");
    });

    it("falls back to flat gross - deductions when breakdown is 0", () => {
      const res = calculateSalary({
        amount: 28000,
        basic: 0,
        allowances: 0,
        bonus: 0,
        deductions: 2000,
        paidAmount: 0,
      });
      expect(res.netPay).toBe(26000);
      expect(res.dueAmount).toBe(26000);
      expect(res.status).toBe("Unpaid");
    });
  });

  describe("numToWords (Indian Numbering System)", () => {
    it("converts 0 correctly", () => {
      expect(numToWords(0)).toBe("Zero Rupees Only");
    });

    it("converts simple hundreds and thousands", () => {
      expect(numToWords(650)).toBe("Six Hundred and Fifty Rupees Only");
      expect(numToWords(700)).toBe("Seven Hundred Rupees Only");
      expect(numToWords(25000)).toBe("Twenty Five Thousand Rupees Only");
    });

    it("converts Lakhs and Crores", () => {
      expect(numToWords(125000)).toBe("One Lakh Twenty Five Thousand Rupees Only");
      expect(numToWords(3500000)).toBe("Thirty Five Lakh Rupees Only");
      expect(numToWords(10500000)).toBe("One Crore Five Lakh Rupees Only");
    });

    it("handles paise decimals", () => {
      expect(numToWords(750.50)).toBe("Seven Hundred and Fifty Rupees and Fifty Paise Only");
    });
  });
});
