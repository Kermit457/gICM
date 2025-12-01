"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  MoreVertical,
  Pause,
  Play,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface Budget {
  id: string;
  name: string;
  description?: string;
  limitAmount: number;
  currentSpend: number;
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  status: "active" | "paused" | "exceeded" | "archived";
  daysRemaining: number;
  trend: "increasing" | "stable" | "decreasing";
  projectedEndOfPeriod: number;
  unacknowledgedAlerts: number;
}

interface BudgetCardProps {
  budget: Budget;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export function BudgetCard({
  budget,
  onPause,
  onResume,
  onEdit,
  onDelete,
  onViewDetails,
}: BudgetCardProps) {
  const percentageUsed = Math.min(100, (budget.currentSpend / budget.limitAmount) * 100);
  const remaining = Math.max(0, budget.limitAmount - budget.currentSpend);
  const isOverBudget = budget.currentSpend > budget.limitAmount;
  const willExceed = budget.projectedEndOfPeriod > budget.limitAmount;

  const getStatusColor = () => {
    if (budget.status === "exceeded" || isOverBudget) return "destructive";
    if (budget.status === "paused") return "secondary";
    if (percentageUsed >= 80) return "warning";
    return "default";
  };

  const getProgressColor = () => {
    if (isOverBudget) return "bg-red-500";
    if (percentageUsed >= 80) return "bg-yellow-500";
    if (percentageUsed >= 50) return "bg-blue-500";
    return "bg-green-500";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPeriod = (period: string) => {
    const labels: Record<string, string> = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly",
    };
    return labels[period] || period;
  };

  return (
    <Card className={`relative ${budget.status === "paused" ? "opacity-60" : ""}`}>
      {/* Alert indicator */}
      {budget.unacknowledgedAlerts > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {budget.unacknowledgedAlerts}
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {budget.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {formatPeriod(budget.period)}
              </Badge>
              <Badge variant={getStatusColor() as "default"} className="text-xs">
                {budget.status}
              </Badge>
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails?.(budget.id)}>
                <Settings className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(budget.id)}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Budget
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {budget.status === "paused" ? (
                <DropdownMenuItem onClick={() => onResume?.(budget.id)}>
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onPause?.(budget.id)}>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(budget.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Spending progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(budget.currentSpend)} / {formatCurrency(budget.limitAmount)}
            </span>
            <span className={`font-medium ${isOverBudget ? "text-red-500" : ""}`}>
              {percentageUsed.toFixed(1)}%
            </span>
          </div>
          <div className="relative">
            <Progress value={Math.min(percentageUsed, 100)} className="h-3" />
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className={`font-semibold text-sm ${isOverBudget ? "text-red-500" : "text-green-500"}`}>
              {isOverBudget ? "-" : ""}
              {formatCurrency(Math.abs(remaining))}
            </p>
          </div>
          <div className="p-2 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">Days Left</p>
            <p className="font-semibold text-sm">{budget.daysRemaining}</p>
          </div>
          <div className="p-2 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">Trend</p>
            <div className="flex items-center justify-center gap-1">
              {budget.trend === "increasing" && (
                <TrendingUp className="h-4 w-4 text-red-500" />
              )}
              {budget.trend === "decreasing" && (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              {budget.trend === "stable" && (
                <span className="text-sm">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Projection warning */}
        {willExceed && budget.status === "active" && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md text-yellow-700 dark:text-yellow-300 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Projected to reach {formatCurrency(budget.projectedEndOfPeriod)} by end of period
            </span>
          </div>
        )}

        {/* Exceeded warning */}
        {isOverBudget && (
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded-md text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Over budget by {formatCurrency(budget.currentSpend - budget.limitAmount)}
            </span>
          </div>
        )}

        {/* Description */}
        {budget.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {budget.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Summary stats component
export function BudgetStats({
  totalBudgets,
  activeBudgets,
  totalSpend,
  totalLimit,
  alertCount,
}: {
  totalBudgets: number;
  activeBudgets: number;
  totalSpend: number;
  totalLimit: number;
  alertCount: number;
}) {
  const overallPercentage = totalLimit > 0 ? (totalSpend / totalLimit) * 100 : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{totalBudgets}</p>
              <p className="text-xs text-muted-foreground">Total Budgets</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{activeBudgets}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">
                ${totalSpend.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Total Spend</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-5 w-5 rounded-full ${
                overallPercentage >= 80 ? "bg-yellow-500" : "bg-green-500"
              }`}
            />
            <div>
              <p className="text-2xl font-bold">{overallPercentage.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Overall Usage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`h-5 w-5 ${alertCount > 0 ? "text-red-500" : "text-muted-foreground"}`}
            />
            <div>
              <p className="text-2xl font-bold">{alertCount}</p>
              <p className="text-xs text-muted-foreground">Active Alerts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
