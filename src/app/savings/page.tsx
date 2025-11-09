import { TokenSavingsCalculator } from "@/components/organisms/token-savings-calculator";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingDown, Zap, DollarSign, Clock, Check } from "lucide-react";

export const metadata = {
  title: "Token Savings Calculator | gICM",
  description:
    "Calculate how much you save in tokens, costs, and time with Progressive Disclosure technology. 88-92% token reduction guaranteed.",
};

export default function SavingsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="Token Savings Calculator"
        description="Discover how much you save with Progressive Disclosure technology"
        icon={<TrendingDown className="w-6 h-6 text-lime-300" />}
      />

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-300/20 border border-lime-300/50 mb-4">
            <Sparkles className="w-5 h-5 text-lime-600" />
            <span className="text-lime-600 font-bold">
              88-92% Token Reduction
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">
            Stop Paying for{" "}
            <span className="text-red-600 line-through">Wasted Tokens</span>
          </h1>

          <p className="text-xl text-zinc-600 max-w-3xl mx-auto mb-8">
            Progressive Disclosure technology loads only the context you need, when you need it.
            The result? Massive savings in tokens, costs, and time.
          </p>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <Card className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-lime-100 flex items-center justify-center mx-auto mb-3">
                <TrendingDown className="w-7 h-7 text-lime-600" />
              </div>
              <h3 className="font-bold text-black mb-2">88-92% Less Tokens</h3>
              <p className="text-sm text-zinc-600">
                Dramatically reduce token usage without sacrificing quality
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-black mb-2">Massive Cost Savings</h3>
              <p className="text-sm text-zinc-600">
                Save hundreds to thousands per month on AI costs
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-bold text-black mb-2">Faster Responses</h3>
              <p className="text-sm text-zinc-600">
                Smaller prompts mean quicker AI responses and more productivity
              </p>
            </Card>
          </div>
        </div>

        {/* Calculator */}
        <TokenSavingsCalculator />

        {/* ROI Examples */}
        <div className="mt-16">
          <h2 className="text-3xl font-black text-black text-center mb-8">
            Real-World ROI Examples
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h3 className="font-bold text-black">Solo Developer</h3>
                  <p className="text-sm text-zinc-500">Building a SaaS product</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-lime-600" />
                  <span className="text-zinc-700">10 skill uses per day</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-lime-600" />
                  <span className="text-zinc-700">Claude Sonnet 3.5</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-lime-600" />
                  <span className="text-zinc-700">Mix of development & security skills</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-lime-50 to-emerald-50 border border-lime-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-600">Monthly Savings</span>
                  <span className="text-2xl font-black text-lime-600">$87</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Yearly Savings</span>
                  <span className="text-3xl font-black text-lime-600">$1,044</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <h3 className="font-bold text-black">5-Person Team</h3>
                  <p className="text-sm text-zinc-500">Web3 startup</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-lime-600" />
                  <span className="text-zinc-700">25 skill uses per day (team total)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-lime-600" />
                  <span className="text-zinc-700">Mix of Sonnet & Opus</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-lime-600" />
                  <span className="text-zinc-700">Solana development focus</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-600">Monthly Savings</span>
                  <span className="text-2xl font-black text-purple-600">$478</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Yearly Savings</span>
                  <span className="text-3xl font-black text-purple-600">$5,736</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
                  🏢
                </div>
                <div>
                  <h3 className="font-bold text-black">20-Person Agency</h3>
                  <p className="text-sm text-zinc-500">Full-service development</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-lime-600" />
                  <span className="text-zinc-700">100 skill uses per day (team total)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-lime-600" />
                  <span className="text-zinc-700">Heavy Claude Opus usage</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-lime-600" />
                  <span className="text-zinc-700">Multiple client projects</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-600">Monthly Savings</span>
                  <span className="text-2xl font-black text-amber-600">$2,340</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Yearly Savings</span>
                  <span className="text-3xl font-black text-amber-600">$28,080</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">
                  🏗️
                </div>
                <div>
                  <h3 className="font-bold text-black">Enterprise Team</h3>
                  <p className="text-sm text-zinc-500">Large-scale platform</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-lime-600" />
                  <span className="text-zinc-700">500 skill uses per day (organization)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-lime-600" />
                  <span className="text-zinc-700">Opus for complex workflows</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-lime-600" />
                  <span className="text-zinc-700">Security, compliance, & development</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-600">Monthly Savings</span>
                  <span className="text-2xl font-black text-red-600">$14,200</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Yearly Savings</span>
                  <span className="text-3xl font-black text-red-600">$170,400</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-16 mb-12">
          <h2 className="text-3xl font-black text-black text-center mb-8">
            How It Works
          </h2>

          <Card className="p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="destructive" className="text-lg px-3 py-1">Traditional</Badge>
                </div>
                <p className="text-sm text-zinc-600 mb-4">
                  Traditional prompts send entire codebases, documentation, and context in every
                  request, even when most of it isn't needed.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <code className="text-xs text-red-900">
                    // Sends 12,500 tokens<br />
                    - Full codebase (8,000 tokens)<br />
                    - All documentation (3,200 tokens)<br />
                    - Examples (800 tokens)<br />
                    - Your question (500 tokens)
                  </code>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="text-lg px-3 py-1 bg-lime-600">Progressive</Badge>
                </div>
                <p className="text-sm text-zinc-600 mb-4">
                  Progressive Disclosure intelligently loads only relevant context for each step,
                  dramatically reducing token usage while maintaining quality.
                </p>
                <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
                  <code className="text-xs text-lime-900">
                    // Sends 980 tokens<br />
                    - Relevant code snippet (400 tokens)<br />
                    - Key docs section (350 tokens)<br />
                    - Focused example (130 tokens)<br />
                    - Your question (100 tokens)
                  </code>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-200">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-lime-600" />
                <h3 className="font-bold text-black text-lg">The Result</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-lime-50 rounded-lg p-4">
                  <p className="text-3xl font-black text-lime-600">92%</p>
                  <p className="text-sm text-zinc-600 mt-1">Token Reduction</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-3xl font-black text-blue-600">4.7x</p>
                  <p className="text-sm text-zinc-600 mt-1">Faster Builds</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-3xl font-black text-purple-600">Same</p>
                  <p className="text-sm text-zinc-600 mt-1">Quality Output</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
