# Desktop Context

> **ID:** `desktop-context`
> **Tier:** 3
> **Token Cost:** 5000
> **MCP Connections:** screenpipe

## 🎯 What This Skill Does

This skill transforms you into a desktop context awareness expert using ScreenPipe MCP integration for activity history, screen recording analysis, and work session tracking. It enables you to understand "what was I working on" queries, track productivity patterns, and provide contextual recommendations based on actual desktop activity.

**Core Functions:**
- ScreenPipe desktop activity recording and playback
- Activity history search with semantic queries
- Context-aware recommendations based on past work
- Work session analysis and productivity insights
- Cross-application activity correlation
- Time-based context reconstruction

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** desktop, what was I doing, history, find when, screenpipe, activity, context, yesterday, last week
- **File Types:** N/A (works with screen recordings and activity logs)
- **Directories:** N/A

**Manual Activation:**
```bash
opus67 load desktop-context
```

## 🚀 Core Capabilities

### 1. ScreenPipe Desktop Recording Integration

ScreenPipe MCP provides continuous desktop recording with OCR, window tracking, and application monitoring. This capability enables perfect recall of past activities.

**Implementation Pattern:**

```typescript
// MCP Tool: screenpipe_search
interface ScreenPipeSearchOptions {
  query: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  applications?: string[];
  contentType?: 'text' | 'visual' | 'both';
  limit?: number;
}

async function searchDesktopActivity(options: ScreenPipeSearchOptions) {
  // Step 1: Search ScreenPipe for relevant activity
  const results = await mcp.call('screenpipe_search', {
    query: options.query,
    start_time: options.timeRange?.start.toISOString(),
    end_time: options.timeRange?.end.toISOString(),
    app_filter: options.applications,
    content_types: options.contentType || 'both',
    limit: options.limit || 20
  });

  // Step 2: Process and structure results
  const activities = results.frames.map(frame => ({
    timestamp: new Date(frame.timestamp),
    application: frame.app_name,
    windowTitle: frame.window_title,
    text: frame.ocr_text,
    screenshot: frame.screenshot_path,
    confidence: frame.ocr_confidence,
    tags: extractTags(frame)
  }));

  // Step 3: Group related activities
  return {
    query: options.query,
    matchCount: activities.length,
    activities: groupBySession(activities),
    summary: summarizeActivities(activities),
    timeSpent: calculateTimeSpent(activities),
    applications: extractApplications(activities)
  };
}

function groupBySession(activities: Activity[], gapMinutes = 15): Session[] {
  const sessions: Session[] = [];
  let currentSession: Activity[] = [];

  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i];

    if (currentSession.length === 0) {
      currentSession.push(activity);
      continue;
    }

    const lastActivity = currentSession[currentSession.length - 1];
    const gap = (activity.timestamp.getTime() - lastActivity.timestamp.getTime()) / 1000 / 60;

    if (gap > gapMinutes) {
      // Start new session
      sessions.push({
        start: currentSession[0].timestamp,
        end: lastActivity.timestamp,
        activities: currentSession,
        duration: calculateDuration(currentSession)
      });
      currentSession = [activity];
    } else {
      currentSession.push(activity);
    }
  }

  // Add final session
  if (currentSession.length > 0) {
    sessions.push({
      start: currentSession[0].timestamp,
      end: currentSession[currentSession.length - 1].timestamp,
      activities: currentSession,
      duration: calculateDuration(currentSession)
    });
  }

  return sessions;
}
```

**Best Practices:**
- Set reasonable time ranges to avoid overwhelming results
- Use application filters to narrow search scope
- Specify content type (text vs visual) based on needs
- Group activities into meaningful sessions
- Respect privacy - don't record sensitive information
- Cache recent searches for faster access

**Common Patterns:**

```typescript
// Pattern 1: "What was I working on yesterday?"
async function getYesterdayContext() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  const activities = await searchDesktopActivity({
    query: '*', // All activities
    timeRange: {
      start: yesterday,
      end: endOfYesterday
    },
    contentType: 'both'
  });

  return {
    date: yesterday.toDateString(),
    summary: activities.summary,
    topApplications: activities.applications.slice(0, 5),
    sessions: activities.activities,
    productiveTime: calculateProductiveTime(activities),
    highlights: extractHighlights(activities)
  };
}

// Pattern 2: Find when you worked on a specific project
async function findProjectWork(projectName: string, days = 7) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await searchDesktopActivity({
    query: projectName,
    timeRange: { start: startDate, end: endDate },
    contentType: 'text'
  });

  return {
    project: projectName,
    totalSessions: results.activities.length,
    totalTime: results.timeSpent,
    firstSeen: results.activities[0]?.start,
    lastSeen: results.activities[results.activities.length - 1]?.end,
    relatedFiles: extractFiles(results.activities),
    codeReviews: extractCodeReviews(results.activities),
    commits: extractCommits(results.activities)
  };
}

// Pattern 3: Activity pattern analysis
async function analyzeActivityPatterns(days = 30) {
  const activities = await searchDesktopActivity({
    query: '*',
    timeRange: {
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  });

  return {
    dailyPatterns: groupByHour(activities.activities),
    mostProductiveHours: findPeakHours(activities.activities),
    averageSessionDuration: calculateAverageSessionDuration(activities.activities),
    appUsageBreakdown: calculateAppUsage(activities.applications),
    contextSwitches: countContextSwitches(activities.activities),
    focusScore: calculateFocusScore(activities.activities)
  };
}
```

**Gotchas:**
- ScreenPipe requires explicit user permission and setup
- OCR accuracy varies based on screen content and resolution
- Large time ranges can be slow to process
- Privacy concerns with sensitive information recording
- Storage requirements for continuous recording
- May miss activities in full-screen apps or games

### 2. Activity History Search with Semantic Queries

Advanced search capabilities that understand natural language queries about past desktop activities.

**Implementation Pattern:**

```typescript
interface SemanticSearchOptions {
  query: string;
  fuzzy?: boolean;
  synonyms?: boolean;
  contextWindow?: number; // minutes before/after
}

async function semanticActivitySearch(options: SemanticSearchOptions) {
  // Step 1: Expand query with synonyms if requested
  const expandedQuery = options.synonyms
    ? await expandQueryWithSynonyms(options.query)
    : options.query;

  // Step 2: Perform fuzzy search if requested
  const searchResults = await searchDesktopActivity({
    query: expandedQuery,
    contentType: 'both'
  });

  // Step 3: Apply semantic filtering
  const semanticMatches = searchResults.activities.filter(activity =>
    semanticMatch(activity, options.query, options.fuzzy)
  );

  // Step 4: Add context window if requested
  if (options.contextWindow) {
    return addContextWindow(semanticMatches, options.contextWindow);
  }

  return {
    query: options.query,
    matches: semanticMatches,
    confidence: calculateAverageConfidence(semanticMatches),
    relatedTopics: extractRelatedTopics(semanticMatches)
  };
}

async function expandQueryWithSynonyms(query: string): Promise<string> {
  const synonymMap = {
    'coding': ['programming', 'development', 'code'],
    'meeting': ['call', 'conference', 'zoom', 'teams'],
    'email': ['mail', 'outlook', 'gmail', 'inbox'],
    'design': ['figma', 'sketch', 'photoshop', 'illustrator']
  };

  const words = query.toLowerCase().split(' ');
  const expandedWords: string[] = [];

  for (const word of words) {
    expandedWords.push(word);
    if (synonymMap[word]) {
      expandedWords.push(...synonymMap[word]);
    }
  }

  return expandedWords.join(' OR ');
}

function semanticMatch(activity: Activity, query: string, fuzzy = false): boolean {
  const searchText = `${activity.windowTitle} ${activity.text}`.toLowerCase();
  const queryLower = query.toLowerCase();

  if (fuzzy) {
    return levenshteinDistance(searchText, queryLower) < 3;
  }

  return searchText.includes(queryLower);
}
```

**Best Practices:**
- Use natural language queries ("when did I review the PR?")
- Enable fuzzy matching for partial recalls
- Add synonym expansion for broader results
- Include context windows to see surrounding activities
- Filter by application for precision
- Combine with time estimates ("about 3 days ago")

**Common Patterns:**

```typescript
// Pattern 1: Natural language time-based search
async function naturalLanguageSearch(userQuery: string) {
  // Parse temporal expressions
  const timeInfo = parseTimeExpression(userQuery);
  // "last Tuesday" -> { start: Date, end: Date }

  // Extract activity keywords
  const keywords = extractKeywords(userQuery);
  // "when did I review the dashboard PR?" -> ["review", "dashboard", "PR"]

  const results = await semanticActivitySearch({
    query: keywords.join(' '),
    fuzzy: true,
    synonyms: true,
    contextWindow: 5 // 5 minutes before/after
  });

  // Filter by time if specified
  if (timeInfo) {
    return {
      ...results,
      matches: results.matches.filter(m =>
        m.timestamp >= timeInfo.start && m.timestamp <= timeInfo.end
      )
    };
  }

  return results;
}

function parseTimeExpression(query: string): TimeRange | null {
  const patterns = {
    'yesterday': () => ({
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(Date.now())
    }),
    'last week': () => ({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date()
    }),
    'this morning': () => ({
      start: new Date(new Date().setHours(6, 0, 0, 0)),
      end: new Date(new Date().setHours(12, 0, 0, 0))
    })
  };

  for (const [pattern, generator] of Object.entries(patterns)) {
    if (query.toLowerCase().includes(pattern)) {
      return generator();
    }
  }

  return null;
}

// Pattern 2: Multi-application activity correlation
async function findCrossAppActivity(activity: string) {
  const results = await semanticActivitySearch({
    query: activity,
    synonyms: true
  });

  // Group by application to see workflow
  const appSequence = results.matches.map(m => ({
    app: m.application,
    time: m.timestamp,
    action: summarizeAction(m)
  }));

  // Identify common workflows
  const workflows = identifyWorkflows(appSequence);

  return {
    activity,
    applications: [...new Set(appSequence.map(a => a.app))],
    commonWorkflows: workflows,
    timeline: appSequence,
    insights: generateInsights(appSequence)
  };
}

function identifyWorkflows(sequence: AppAction[]): Workflow[] {
  const workflows: Workflow[] = [];
  const windowSize = 5;

  for (let i = 0; i < sequence.length - windowSize; i++) {
    const window = sequence.slice(i, i + windowSize);
    const pattern = window.map(a => a.app).join(' -> ');

    const existing = workflows.find(w => w.pattern === pattern);
    if (existing) {
      existing.count++;
    } else {
      workflows.push({
        pattern,
        count: 1,
        avgDuration: calculateDuration(window)
      });
    }
  }

  return workflows.sort((a, b) => b.count - a.count);
}
```

**Gotchas:**
- Natural language parsing is imperfect
- Time expressions can be ambiguous ("last Friday" during week transition)
- Fuzzy matching can return false positives
- Large result sets need pagination
- Context windows increase data volume significantly

### 3. Context-Aware Recommendations

Provide intelligent recommendations based on historical desktop context and current activity patterns.

**Implementation Pattern:**

```typescript
interface ContextRecommendation {
  type: 'file' | 'application' | 'action' | 'person';
  item: string;
  confidence: number;
  reason: string;
  relatedActivities: Activity[];
}

async function getContextRecommendations(
  currentContext?: string
): Promise<ContextRecommendation[]> {
  // Step 1: Get recent activity (last 2 hours)
  const recentActivity = await searchDesktopActivity({
    query: '*',
    timeRange: {
      start: new Date(Date.now() - 2 * 60 * 60 * 1000),
      end: new Date()
    }
  });

  // Step 2: Identify current task context
  const context = currentContext || inferContext(recentActivity.activities);

  // Step 3: Find similar past sessions
  const similarSessions = await findSimilarSessions(context);

  // Step 4: Extract recommendations
  const recommendations: ContextRecommendation[] = [];

  // Recommend files often used in similar contexts
  const commonFiles = extractCommonFiles(similarSessions);
  recommendations.push(...commonFiles.map(file => ({
    type: 'file' as const,
    item: file.path,
    confidence: file.frequency,
    reason: `Often used when ${context}`,
    relatedActivities: file.activities
  })));

  // Recommend next likely application
  const nextApps = predictNextApplication(recentActivity.activities);
  recommendations.push(...nextApps.map(app => ({
    type: 'application' as const,
    item: app.name,
    confidence: app.probability,
    reason: `Usually opened after ${recentActivity.activities[0]?.application}`,
    relatedActivities: app.examples
  })));

  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

function inferContext(activities: Activity[]): string {
  // Analyze recent activities to determine current task
  const apps = activities.map(a => a.application);
  const texts = activities.map(a => a.text).join(' ');

  // Check for common patterns
  if (apps.includes('vscode') && apps.includes('Terminal')) {
    return 'coding';
  }
  if (apps.includes('Chrome') && texts.includes('PR') || texts.includes('review')) {
    return 'code review';
  }
  if (apps.includes('Figma') || apps.includes('Sketch')) {
    return 'design';
  }
  if (apps.includes('Zoom') || apps.includes('Teams')) {
    return 'meeting';
  }

  return 'general work';
}

async function findSimilarSessions(context: string, limit = 10): Promise<Session[]> {
  const allSessions = await searchDesktopActivity({
    query: context,
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  });

  return allSessions.activities.slice(0, limit);
}
```

**Best Practices:**
- Use sliding time windows for real-time recommendations
- Weight recent activities higher than old ones
- Consider time-of-day patterns (morning vs afternoon work)
- Respect user privacy in recommendations
- Provide explanations for recommendations
- Allow users to dismiss incorrect recommendations

**Common Patterns:**

```typescript
// Pattern 1: Smart file suggestions
async function suggestRelevantFiles() {
  const recentProjects = await searchDesktopActivity({
    query: '*',
    applications: ['vscode', 'vim', 'sublime'],
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  });

  const files = extractFiles(recentProjects.activities);
  const fileFrequency = files.reduce((acc, file) => {
    acc[file] = (acc[file] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(fileFrequency)
    .map(([file, count]) => ({
      file,
      accessCount: count,
      lastAccessed: findLastAccess(file, recentProjects.activities)
    }))
    .sort((a, b) => b.accessCount - a.accessCount)
    .slice(0, 10);
}

// Pattern 2: Productivity insights
async function generateProductivityInsights() {
  const activities = await searchDesktopActivity({
    query: '*',
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  });

  return {
    averageFocusTime: calculateAverageFocusTime(activities.activities),
    topDistractions: identifyDistractions(activities.activities),
    peakProductivityHours: findPeakHours(activities.activities),
    recommendedBreaks: suggestBreakTimes(activities.activities),
    appEfficiency: calculateAppEfficiency(activities.applications)
  };
}

function calculateAverageFocusTime(activities: Activity[]): number {
  let totalFocusTime = 0;
  let focusSessions = 0;

  for (const session of groupBySession(activities)) {
    if (isFocusedWork(session)) {
      totalFocusTime += session.duration;
      focusSessions++;
    }
  }

  return focusSessions > 0 ? totalFocusTime / focusSessions : 0;
}

function isFocusedWork(session: Session): boolean {
  // Focused work = < 3 app switches per hour, continuous activity
  const appSwitches = countAppSwitches(session.activities);
  const hourlyRate = (appSwitches / session.duration) * 60;

  return hourlyRate < 3 && session.duration >= 20; // at least 20 min
}
```

**Gotchas:**
- Recommendations can be wrong if context inference fails
- Privacy concerns with file path exposure
- Stale recommendations if patterns change
- Overfitting to recent unusual activity
- False positives from background apps

### 4. Work Session Tracking and Productivity Analysis

Comprehensive work session analysis with productivity metrics, time allocation, and pattern detection.

**Implementation Pattern:**

```typescript
interface ProductivityMetrics {
  date: Date;
  totalWorkTime: number; // minutes
  focusTime: number;
  distractionTime: number;
  sessions: WorkSession[];
  topActivities: ActivitySummary[];
  efficiency: number; // 0-100
}

async function analyzeProductivity(date: Date): Promise<ProductivityMetrics> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const dayActivities = await searchDesktopActivity({
    query: '*',
    timeRange: { start: startOfDay, end: endOfDay }
  });

  const sessions = dayActivities.activities;
  const focusSessions = sessions.filter(isFocusedWork);
  const distractionSessions = sessions.filter(s => !isFocusedWork(s));

  return {
    date,
    totalWorkTime: calculateTotalTime(sessions),
    focusTime: calculateTotalTime(focusSessions),
    distractionTime: calculateTotalTime(distractionSessions),
    sessions: sessions.map(sessionToWorkSession),
    topActivities: summarizeActivities(sessions),
    efficiency: calculateEfficiency(focusSessions, sessions)
  };
}

function calculateEfficiency(focusSessions: Session[], allSessions: Session[]): number {
  const focusTime = calculateTotalTime(focusSessions);
  const totalTime = calculateTotalTime(allSessions);

  return totalTime > 0 ? (focusTime / totalTime) * 100 : 0;
}

interface WorkSession {
  start: Date;
  end: Date;
  duration: number;
  primaryApplication: string;
  taskType: string;
  isFocused: boolean;
  interruptions: number;
}

function sessionToWorkSession(session: Session): WorkSession {
  const appCounts = session.activities.reduce((acc, act) => {
    acc[act.application] = (acc[act.application] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const primaryApp = Object.entries(appCounts)
    .sort(([, a], [, b]) => b - a)[0][0];

  return {
    start: session.start,
    end: session.end,
    duration: session.duration,
    primaryApplication: primaryApp,
    taskType: inferTaskType(session.activities),
    isFocused: isFocusedWork(session),
    interruptions: countAppSwitches(session.activities)
  };
}
```

**Best Practices:**
- Define clear focus vs distraction criteria
- Account for legitimate breaks
- Consider different work styles (deep focus vs multitasking)
- Provide actionable insights, not just metrics
- Respect work-life boundaries
- Allow manual session categorization

**Common Patterns:**

```typescript
// Pattern 1: Weekly productivity report
async function generateWeeklyReport() {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);

  const dailyMetrics: ProductivityMetrics[] = [];

  for (let d = new Date(weekStart); d <= today; d.setDate(d.getDate() + 1)) {
    dailyMetrics.push(await analyzeProductivity(new Date(d)));
  }

  return {
    period: `${weekStart.toDateString()} to ${today.toDateString()}`,
    totalWorkTime: dailyMetrics.reduce((sum, m) => sum + m.totalWorkTime, 0),
    averageFocusTime: dailyMetrics.reduce((sum, m) => sum + m.focusTime, 0) / 7,
    mostProductiveDay: dailyMetrics.sort((a, b) => b.efficiency - a.efficiency)[0],
    leastProductiveDay: dailyMetrics.sort((a, b) => a.efficiency - b.efficiency)[0],
    trends: analyzeTrends(dailyMetrics),
    recommendations: generateRecommendations(dailyMetrics)
  };
}

function analyzeTrends(metrics: ProductivityMetrics[]): Trend[] {
  const trends: Trend[] = [];

  // Focus time trend
  const focusTimes = metrics.map(m => m.focusTime);
  trends.push({
    metric: 'Focus Time',
    direction: isIncreasing(focusTimes) ? 'up' : 'down',
    change: calculatePercentageChange(focusTimes[0], focusTimes[focusTimes.length - 1])
  });

  // Efficiency trend
  const efficiencies = metrics.map(m => m.efficiency);
  trends.push({
    metric: 'Efficiency',
    direction: isIncreasing(efficiencies) ? 'up' : 'down',
    change: calculatePercentageChange(efficiencies[0], efficiencies[efficiencies.length - 1])
  });

  return trends;
}

// Pattern 2: Context reconstruction for forgotten tasks
async function reconstructContext(query: string, approximateTime: Date) {
  // Search +/- 1 hour from approximate time
  const start = new Date(approximateTime);
  start.setHours(start.getHours() - 1);

  const end = new Date(approximateTime);
  end.setHours(end.getHours() + 1);

  const activities = await searchDesktopActivity({
    query,
    timeRange: { start, end },
    contextWindow: 10 // 10 minutes context
  });

  return {
    query,
    approximateTime,
    findings: activities.matches,
    reconstruction: reconstructWorkflow(activities.matches),
    relatedFiles: extractFiles(activities.matches),
    peopleInvolved: extractPeople(activities.matches),
    nextSteps: suggestNextSteps(activities.matches)
  };
}

function reconstructWorkflow(activities: Activity[]): WorkflowStep[] {
  return activities
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map(act => ({
      time: act.timestamp,
      application: act.application,
      action: summarizeAction(act),
      artifacts: extractArtifacts(act)
    }));
}
```

**Gotchas:**
- Productivity metrics can be demotivating if presented poorly
- Individual work styles vary significantly
- Breaks and meetings are not "unproductive"
- Background apps skew metrics
- Privacy concerns with detailed tracking
- Timezone issues with multi-day analysis

## 💡 Real-World Examples

### Example 1: "What was I doing yesterday afternoon?"

```typescript
// Scenario: User asks about yesterday's work at 2-5 PM
// Goal: Provide detailed reconstruction of activities

async function whatWasIDoingYesterdayAfternoon() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(14, 0, 0, 0); // 2 PM

  const endTime = new Date(yesterday);
  endTime.setHours(17, 0, 0, 0); // 5 PM

  const activities = await searchDesktopActivity({
    query: '*',
    timeRange: { start: yesterday, end: endTime },
    contentType: 'both'
  });

  const sessions = activities.activities;

  return {
    timeframe: '2 PM - 5 PM yesterday',
    summary: generateNarrativeSummary(sessions),
    timeline: sessions.map(session => ({
      time: formatTime(session.start),
      duration: `${session.duration} min`,
      activity: describeSession(session),
      apps: session.activities.map(a => a.application),
      highlights: extractHighlights(session.activities)
    })),
    accomplishments: extractAccomplishments(sessions),
    filesWorkedOn: extractFiles(sessions.flatMap(s => s.activities)),
    peopleInteractedWith: extractPeople(sessions.flatMap(s => s.activities))
  };
}

function generateNarrativeSummary(sessions: Session[]): string {
  const parts: string[] = [];

  for (const session of sessions) {
    const mainApp = getMostUsedApp(session.activities);
    const taskType = inferTaskType(session.activities);
    const duration = Math.round(session.duration);

    parts.push(
      `Spent ${duration} minutes ${taskType} in ${mainApp}`
    );
  }

  return parts.join('. ') + '.';
}

// Output:
// {
//   timeframe: '2 PM - 5 PM yesterday',
//   summary: 'Spent 45 minutes coding in VSCode. Spent 30 minutes in code review on GitHub...',
//   timeline: [
//     {
//       time: '2:15 PM',
//       duration: '45 min',
//       activity: 'Working on user authentication feature',
//       apps: ['VSCode', 'Terminal', 'Chrome'],
//       highlights: ['Created LoginForm component', 'Fixed auth middleware bug']
//     },
//     // ...
//   ],
//   accomplishments: ['Completed user authentication', 'Reviewed 3 PRs'],
//   filesWorkedOn: ['src/components/LoginForm.tsx', 'src/middleware/auth.ts'],
//   peopleInteractedWith: ['alice@company.com', 'bob@company.com']
// }
```

### Example 2: Productivity Pattern Analysis

```typescript
// Scenario: Analyze 30-day productivity patterns
// Goal: Identify optimal work hours and habits

async function analyzeThirtyDayProductivity() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const allActivities = await searchDesktopActivity({
    query: '*',
    timeRange: { start: startDate, end: endDate }
  });

  // Group by hour of day
  const hourlyProductivity = analyzeByHour(allActivities.activities);

  // Group by day of week
  const weeklyPattern = analyzeByDayOfWeek(allActivities.activities);

  // Identify focus patterns
  const focusPatterns = analyzeFocusPatterns(allActivities.activities);

  // Calculate app efficiency
  const appEfficiency = calculateAppEfficiency(allActivities.applications);

  return {
    period: '30 days',
    insights: {
      bestWorkHours: hourlyProductivity.slice(0, 3).map(h => h.hour),
      worstWorkHours: hourlyProductivity.slice(-3).map(h => h.hour),
      mostProductiveDays: weeklyPattern.slice(0, 2).map(d => d.day),
      averageFocusSessionLength: focusPatterns.averageLength,
      topProductiveApps: appEfficiency.slice(0, 5),
      topDistractingApps: appEfficiency.slice(-5)
    },
    recommendations: [
      `Schedule deep work during ${hourlyProductivity[0].hour}:00`,
      `Avoid meetings during your peak hours (${hourlyProductivity.slice(0, 2).map(h => h.hour).join(', ')})`,
      `Consider app blockers for ${appEfficiency.slice(-1)[0].app} during focus time`,
      `Your focus sessions average ${focusPatterns.averageLength} minutes - aim for 90-minute blocks`
    ],
    charts: {
      hourlyHeatmap: generateHeatmapData(hourlyProductivity),
      weeklyPattern: generateWeeklyChart(weeklyPattern),
      appUsage: generateAppUsageChart(appEfficiency)
    }
  };
}

function analyzeByHour(activities: Activity[]): HourlyMetric[] {
  const hourlyData: Record<number, { focusTime: number; totalTime: number }> = {};

  for (let hour = 0; hour < 24; hour++) {
    hourlyData[hour] = { focusTime: 0, totalTime: 0 };
  }

  for (const session of groupBySession(activities)) {
    const hour = session.start.getHours();
    hourlyData[hour].totalTime += session.duration;
    if (isFocusedWork(session)) {
      hourlyData[hour].focusTime += session.duration;
    }
  }

  return Object.entries(hourlyData)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      productivity: data.totalTime > 0 ? (data.focusTime / data.totalTime) * 100 : 0,
      totalMinutes: data.totalTime
    }))
    .sort((a, b) => b.productivity - a.productivity);
}
```

### Example 3: Smart Context Switching Assistant

```typescript
// Scenario: Help user resume work after interruption
// Goal: Reconstruct context and suggest next actions

async function resumeWorkAfterInterruption() {
  // Step 1: Find last focused work session
  const recentActivities = await searchDesktopActivity({
    query: '*',
    timeRange: {
      start: new Date(Date.now() - 4 * 60 * 60 * 1000), // last 4 hours
      end: new Date()
    }
  });

  const sessions = recentActivities.activities;
  const focusedSessions = sessions.filter(isFocusedWork);

  if (focusedSessions.length === 0) {
    return {
      message: 'No recent focused work sessions found',
      suggestion: 'Start fresh with your todo list'
    };
  }

  const lastFocusSession = focusedSessions[focusedSessions.length - 1];

  // Step 2: Reconstruct what was being worked on
  const context = {
    task: inferTaskType(lastFocusSession.activities),
    primaryApp: getMostUsedApp(lastFocusSession.activities),
    files: extractFiles(lastFocusSession.activities),
    lastAction: lastFocusSession.activities[lastFocusSession.activities.length - 1],
    duration: lastFocusSession.duration,
    endedAt: lastFocusSession.end
  };

  // Step 3: Find similar past sessions to predict next steps
  const similarSessions = await findSimilarSessions(context.task);
  const nextSteps = predictNextActions(context, similarSessions);

  // Step 4: Prepare workspace
  return {
    context: {
      task: context.task,
      lastWorkingOn: describetLastAction(context.lastAction),
      timeAway: Math.round((Date.now() - context.endedAt.getTime()) / 1000 / 60),
      files: context.files
    },
    recommendations: {
      nextActions: nextSteps,
      filesToOpen: context.files.slice(0, 3),
      appsToLaunch: [context.primaryApp],
      estimatedResumeTime: '5-10 minutes to get back into flow'
    },
    quickActions: [
      { label: 'Open last files', action: () => openFiles(context.files) },
      { label: 'Show related PRs', action: () => findRelatedPRs(context) },
      { label: 'Resume timer', action: () => startPomodoroTimer(25) }
    ]
  };
}

function predictNextActions(
  context: WorkContext,
  similarSessions: Session[]
): string[] {
  const actions: string[] = [];

  // Analyze what typically happens after similar work
  for (const session of similarSessions) {
    const nextActivities = getNextActivities(session);
    actions.push(...nextActivities.map(summarizeAction));
  }

  // Frequency-based ranking
  const actionFrequency = actions.reduce((acc, action) => {
    acc[action] = (acc[action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(actionFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([action]) => action);
}

// Output:
// {
//   context: {
//     task: 'coding',
//     lastWorkingOn: 'Editing src/components/UserProfile.tsx',
//     timeAway: 45, // minutes
//     files: ['src/components/UserProfile.tsx', 'src/types/user.ts', ...]
//   },
//   recommendations: {
//     nextActions: [
//       'Run tests for UserProfile component',
//       'Update UserProfile types',
//       'Commit changes',
//       'Open PR for review'
//     ],
//     filesToOpen: ['src/components/UserProfile.tsx', ...],
//     appsToLaunch: ['VSCode'],
//     estimatedResumeTime: '5-10 minutes...'
//   },
//   quickActions: [...]
// }
```

## 🔗 Related Skills

- **web-search-expert** - For researching solutions while tracking search activity
- **code-analyzer** - Combined with desktop context for development workflow analysis
- **project-architect** - Context-aware project structure recommendations
- **productivity-optimizer** - Advanced productivity analysis and recommendations

## 📖 Further Reading

- [ScreenPipe MCP Documentation](https://github.com/modelcontextprotocol/servers/tree/main/src/screenpipe)
- [Desktop Activity Tracking Best Practices](https://ethicalos.org/tracking-guidelines/)
- [Privacy-Preserving Activity Logging](https://www.eff.org/deeplinks/2020/07/privacy-principles-activity-logging)
- [Productivity Research - Cal Newport](https://www.calnewport.com/blog/)
- [Context Switching Costs](https://www.apa.org/research/action/multitask)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Perfect memory of desktop activity enables perfect context reconstruction.*
