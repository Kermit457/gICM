"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, AlertTriangle, Bell, DollarSign } from "lucide-react";
import { BudgetCard, BudgetStats } from "@/components/budgets/BudgetCard";

// Budget type
interface Budget {
  id: string;
  name: string;
  description: string;
  limitAmount: number;
  currentSpend: number;
  period: "daily" | "weekly" | "monthly";
  status: "active" | "paused" | "exceeded";
  daysRemaining: number;
  trend: "increasing" | "decreasing" | "stable";
  projectedEndOfPeriod: number;
  unacknowledgedAlerts: number;
}

// Mock data
const mockBudgets: Budget[] = [
  {
    id: "1",
    name: "Production Pipelines",
    description: "Budget for all production pipeline executions",
    limitAmount: 500,
    currentSpend: 387.52,
    period: "monthly" as const,
    status: "active" as const,
    daysRemaining: 12,
    trend: "increasing" as const,
    projectedEndOfPeriod: 580,
    unacknowledgedAlerts: 1,
  },
  {
    id: "2",
    name: "Development Testing",
    description: "Budget for dev and testing environments",
    limitAmount: 100,
    currentSpend: 45.30,
    period: "weekly" as const,
    status: "active" as const,
    daysRemaining: 3,
    trend: "stable" as const,
    projectedEndOfPeriod: 85,
    unacknowledgedAlerts: 0,
  },
  {
    id: "3",
    name: "AI Analysis Jobs",
    description: "Heavy compute jobs for AI analysis",
    limitAmount: 1000,
    currentSpend: 1050.75,
    period: "monthly" as const,
    status: "exceeded" as const,
    daysRemaining: 12,
    trend: "increasing" as const,
    projectedEndOfPeriod: 1500,
    unacknowledgedAlerts: 3,
  },
  {
    id: "4",
    name: "Data Processing",
    description: "ETL and data transformation pipelines",
    limitAmount: 200,
    currentSpend: 0,
    period: "daily" as const,
    status: "paused" as const,
    daysRemaining: 0,
    trend: "stable" as const,
    projectedEndOfPeriod: 0,
    unacknowledgedAlerts: 0,
  },
];

const mockAlerts = [
  {
    id: "a1",
    budgetId: "3",
    budgetName: "AI Analysis Jobs",
    type: "threshold_exceeded",
    severity: "critical",
    title: "Budget exceeded!",
    message: "Spending of $1,050.75 has exceeded the monthly budget limit of $1,000.00",
    percentageUsed: 105.08,
    createdAt: new Date(Date.now() - 3600000),
    acknowledged: false,
  },
  {
    id: "a2",
    budgetId: "1",
    budgetName: "Production Pipelines",
    type: "threshold_warning",
    severity: "warning",
    title: "Budget at 77%",
    message: "Spending has reached 77% of the monthly budget",
    percentageUsed: 77.5,
    createdAt: new Date(Date.now() - 7200000),
    acknowledged: false,
  },
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState(mockBudgets);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("budgets");

  // Form state
  const [newBudget, setNewBudget] = useState<{
    name: string;
    description: string;
    limitAmount: number;
    period: "daily" | "weekly" | "monthly";
    scopeType: string;
    autoPausePipelines: boolean;
    notifyOnExceed: boolean;
    rolloverUnused: boolean;
  }>({
    name: "",
    description: "",
    limitAmount: 100,
    period: "monthly",
    scopeType: "global",
    autoPausePipelines: true,
    notifyOnExceed: true,
    rolloverUnused: false,
  });

  // Stats
  const stats = {
    totalBudgets: budgets.length,
    activeBudgets: budgets.filter((b) => b.status === "active").length,
    totalSpend: budgets.reduce((sum, b) => sum + b.currentSpend, 0),
    totalLimit: budgets.filter((b) => b.status === "active").reduce((sum, b) => sum + b.limitAmount, 0),
    alertCount: alerts.filter((a) => !a.acknowledged).length,
  };

  const handleCreateBudget = () => {
    const budget = {
      id: Date.now().toString(),
      ...newBudget,
      currentSpend: 0,
      status: "active" as const,
      daysRemaining: newBudget.period === "daily" ? 1 : newBudget.period === "weekly" ? 7 : 30,
      trend: "stable" as const,
      projectedEndOfPeriod: 0,
      unacknowledgedAlerts: 0,
    };
    setBudgets([...budgets, budget]);
    setShowCreateModal(false);
    setNewBudget({
      name: "",
      description: "",
      limitAmount: 100,
      period: "monthly",
      scopeType: "global",
      autoPausePipelines: true,
      notifyOnExceed: true,
      rolloverUnused: false,
    });
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map((a) =>
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-500 bg-red-50 dark:bg-red-950";
      case "warning": return "text-yellow-500 bg-yellow-50 dark:bg-yellow-950";
      default: return "text-blue-500 bg-blue-50 dark:bg-blue-950";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Cost Budgets
          </h1>
          <p className="text-muted-foreground">
            Track spending, set limits, and receive alerts
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>

      {/* Stats */}
      <BudgetStats {...stats} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="budgets">
            Budgets ({budgets.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="relative">
            Alerts
            {stats.alertCount > 0 && (
              <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                {stats.alertCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onPause={(id) => {
                  setBudgets(budgets.map((b) =>
                    b.id === id ? { ...b, status: "paused" as const } : b
                  ));
                }}
                onResume={(id) => {
                  setBudgets(budgets.map((b) =>
                    b.id === id ? { ...b, status: "active" as const } : b
                  ));
                }}
                onDelete={(id) => {
                  setBudgets(budgets.filter((b) => b.id !== id));
                }}
              />
            ))}
          </div>

          {budgets.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No budgets configured</p>
              <p className="text-sm">Create your first budget to start tracking costs</p>
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-6">
          <div className="space-y-4">
            {alerts.filter((a) => !a.acknowledged).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active alerts</p>
                <p className="text-sm">All budgets are within limits</p>
              </div>
            ) : (
              alerts
                .filter((a) => !a.acknowledged)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 mt-0.5" />
                        <div>
                          <h4 className="font-semibold">{alert.title}</h4>
                          <p className="text-sm opacity-80">{alert.message}</p>
                          <p className="text-xs mt-1 opacity-60">
                            Budget: {alert.budgetName} • {alert.createdAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                ))
            )}

            {/* Acknowledged alerts */}
            {alerts.filter((a) => a.acknowledged).length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Acknowledged Alerts
                </h3>
                {alerts
                  .filter((a) => a.acknowledged)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-lg border opacity-50 mb-2"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{alert.title}</span>
                        <span className="text-muted-foreground">
                          — {alert.budgetName}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Budget Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Budget</DialogTitle>
            <DialogDescription>
              Set up spending limits and alerts for your pipelines
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Budget Name</Label>
              <Input
                id="name"
                value={newBudget.name}
                onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
                placeholder="e.g., Production Pipelines"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newBudget.description}
                onChange={(e) => setNewBudget({ ...newBudget, description: e.target.value })}
                placeholder="What is this budget for?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="limit">Limit Amount ($)</Label>
                <Input
                  id="limit"
                  type="number"
                  min={1}
                  value={newBudget.limitAmount}
                  onChange={(e) => setNewBudget({ ...newBudget, limitAmount: Number(e.target.value) })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="period">Period</Label>
                <Select
                  value={newBudget.period}
                  onValueChange={(v) => setNewBudget({ ...newBudget, period: v as "daily" | "weekly" | "monthly" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="scope">Scope</Label>
              <Select
                value={newBudget.scopeType}
                onValueChange={(v) => setNewBudget({ ...newBudget, scopeType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">All Pipelines (Global)</SelectItem>
                  <SelectItem value="pipeline">Specific Pipeline</SelectItem>
                  <SelectItem value="tag">By Tag</SelectItem>
                  <SelectItem value="user">By User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-pause pipelines</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically pause when budget exceeded
                  </p>
                </div>
                <Switch
                  checked={newBudget.autoPausePipelines}
                  onCheckedChange={(v) => setNewBudget({ ...newBudget, autoPausePipelines: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notify on exceed</Label>
                  <p className="text-xs text-muted-foreground">
                    Send notifications when thresholds reached
                  </p>
                </div>
                <Switch
                  checked={newBudget.notifyOnExceed}
                  onCheckedChange={(v) => setNewBudget({ ...newBudget, notifyOnExceed: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Rollover unused</Label>
                  <p className="text-xs text-muted-foreground">
                    Carry unused budget to next period
                  </p>
                </div>
                <Switch
                  checked={newBudget.rolloverUnused}
                  onCheckedChange={(v) => setNewBudget({ ...newBudget, rolloverUnused: v })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBudget} disabled={!newBudget.name}>
              Create Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
