/**
 * @gicm/money-engine - Smoke Tests
 *
 * Quick tests to verify core money engine functionality:
 * - Expense management
 * - Budget tracking
 * - Basic calculations
 *
 * Note: Blockchain-dependent tests (treasury, trading) require integration tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Decimal from "decimal.js";
import { ExpenseManager } from "../expenses/index.js";
import { Logger } from "../utils/logger.js";

// Suppress console output during tests
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ExpenseManager smoke", () => {
  let expenseManager: ExpenseManager;

  beforeEach(() => {
    expenseManager = new ExpenseManager();
  });

  afterEach(() => {
    expenseManager.stop();
  });

  it("creates expense manager", () => {
    expect(expenseManager).toBeInstanceOf(ExpenseManager);
  });

  it("adds expense and retrieves it", () => {
    const expense = expenseManager.addExpense({
      category: "api_subscriptions",
      subcategory: "llm",
      name: "Test API",
      description: "Test expense",
      amount: new Decimal(100),
      currency: "USD",
      type: "recurring",
      frequency: "monthly",
      nextDueDate: Date.now() + 1000000,
      autoPay: false,
      paymentMethod: "card",
    });

    expect(expense).toHaveProperty("id");
    expect(expense.name).toBe("Test API");
    expect(expense.status).toBe("pending");

    const expenses = expenseManager.getExpenses();
    expect(expenses.length).toBe(1);
    expect(expenses[0].id).toBe(expense.id);
  });

  it("adds default gICM expenses", () => {
    expenseManager.addDefaultExpenses();

    const expenses = expenseManager.getExpenses();
    expect(expenses.length).toBeGreaterThan(0);

    // Should include Claude API
    const claudeExpense = expenses.find((e) => e.name.includes("Claude"));
    expect(claudeExpense).toBeDefined();
    expect(claudeExpense?.amount.toNumber()).toBeGreaterThan(0);
  });

  it("calculates monthly total correctly", () => {
    // Add monthly expense
    expenseManager.addExpense({
      category: "api_subscriptions",
      subcategory: "llm",
      name: "Monthly Service",
      description: "Monthly",
      amount: new Decimal(100),
      currency: "USD",
      type: "recurring",
      frequency: "monthly",
      nextDueDate: Date.now() + 1000000,
      autoPay: false,
      paymentMethod: "card",
    });

    // Add yearly expense (should contribute 1/12 to monthly)
    expenseManager.addExpense({
      category: "infrastructure",
      subcategory: "domain",
      name: "Yearly Service",
      description: "Yearly",
      amount: new Decimal(120),
      currency: "USD",
      type: "recurring",
      frequency: "yearly",
      nextDueDate: Date.now() + 1000000,
      autoPay: false,
      paymentMethod: "card",
    });

    const monthlyTotal = expenseManager.getMonthlyTotal();

    // 100 + (120/12) = 110
    expect(monthlyTotal.toNumber()).toBe(110);
  });

  it("returns budget status", () => {
    const status = expenseManager.getBudgetStatus();

    expect(status).toHaveProperty("total");
    expect(status).toHaveProperty("byCategory");
    expect(status).toHaveProperty("alerts");
    expect(status.total).toHaveProperty("limit");
    expect(status.total).toHaveProperty("spent");
    expect(status.total).toHaveProperty("remaining");
  });

  it("checks budget limits", () => {
    // Small amount should pass
    const canPaySmall = expenseManager.checkBudget("api_subscriptions", new Decimal(50));
    expect(canPaySmall).toBe(true);

    // Huge amount should fail
    const canPayHuge = expenseManager.checkBudget("api_subscriptions", new Decimal(1000000));
    expect(canPayHuge).toBe(false);
  });

  it("returns upcoming expenses", () => {
    // Add expense due soon
    expenseManager.addExpense({
      category: "api_subscriptions",
      subcategory: "test",
      name: "Due Soon",
      description: "Test",
      amount: new Decimal(50),
      currency: "USD",
      type: "recurring",
      frequency: "monthly",
      nextDueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      autoPay: false,
      paymentMethod: "card",
    });

    // Add expense due later
    expenseManager.addExpense({
      category: "api_subscriptions",
      subcategory: "test",
      name: "Due Later",
      description: "Test",
      amount: new Decimal(50),
      currency: "USD",
      type: "recurring",
      frequency: "monthly",
      nextDueDate: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
      autoPay: false,
      paymentMethod: "card",
    });

    const upcoming = expenseManager.getUpcoming(30);

    expect(upcoming.length).toBe(1);
    expect(upcoming[0].name).toBe("Due Soon");
  });

  it("handles cancelled expenses", () => {
    const expense = expenseManager.addExpense({
      category: "api_subscriptions",
      subcategory: "test",
      name: "Test Expense",
      description: "Test",
      amount: new Decimal(100),
      currency: "USD",
      type: "recurring",
      frequency: "monthly",
      nextDueDate: Date.now() + 1000000,
      autoPay: false,
      paymentMethod: "card",
    });

    // Manually cancel (would be done via method in real implementation)
    const expenses = expenseManager.getExpenses();
    const found = expenses.find((e) => e.id === expense.id);
    if (found) found.status = "cancelled";

    // Cancelled expense shouldn't count in monthly total
    const monthlyTotal = expenseManager.getMonthlyTotal();
    expect(monthlyTotal.toNumber()).toBe(0);
  });

  it("starts and stops without error", () => {
    const mockHandler = vi.fn().mockResolvedValue(true);

    // Should not throw
    expect(() => expenseManager.start(mockHandler)).not.toThrow();
    expect(() => expenseManager.stop()).not.toThrow();
  });
});

describe("Logger smoke", () => {
  it("creates logger with namespace", () => {
    const logger = new Logger("TestNamespace");

    expect(logger).toBeDefined();
  });

  it("logs at different levels without error", () => {
    const logger = new Logger("Test");

    // These should not throw
    expect(() => logger.info("Info message")).not.toThrow();
    expect(() => logger.warn("Warn message")).not.toThrow();
    expect(() => logger.debug("Debug message")).not.toThrow();
    expect(() => logger.error("Error message")).not.toThrow();
  });

  it("logs with metadata", () => {
    const logger = new Logger("Test");

    expect(() =>
      logger.info("Message with data", { key: "value", number: 42 })
    ).not.toThrow();
  });
});

describe("Decimal calculations smoke", () => {
  it("handles currency calculations precisely", () => {
    // Classic floating point issue: 0.1 + 0.2 !== 0.3
    const a = new Decimal("0.1");
    const b = new Decimal("0.2");
    const sum = a.add(b);

    expect(sum.eq(new Decimal("0.3"))).toBe(true);
  });

  it("handles large SOL amounts", () => {
    const solAmount = new Decimal("1000000000"); // 1 billion lamports = 1 SOL
    const lamportsPerSol = new Decimal("1000000000");

    const sol = solAmount.div(lamportsPerSol);
    expect(sol.toNumber()).toBe(1);
  });

  it("calculates percentages correctly", () => {
    const total = new Decimal(1000);
    const part = new Decimal(250);
    const percent = part.div(total).mul(100);

    expect(percent.toNumber()).toBe(25);
  });

  it("handles division with precision", () => {
    const yearlyAmount = new Decimal(100);
    const monthlyAmount = yearlyAmount.div(12);

    // Should be ~8.333...
    expect(monthlyAmount.toNumber()).toBeCloseTo(8.33, 2);
  });
});
