import { createBrowserRouter, Navigate } from "react-router";
import { TradeJournal } from "./components/TradeJournal";
import { TradeJournalPreview } from "./components/TradeJournalPreview";
import { TradeHistory } from "./components/TradeHistory";
import { Settings } from "./components/Settings";
import { PerformanceMetrics } from "./components/PerformanceMetrics";
import { EmotionOverview } from "./components/EmotionOverview";
import { RoutineTracker } from "./components/RoutineTracker";
import { DailyJournal } from "./components/DailyJournal";
import { DisciplineOverview } from "./components/DisciplineOverview";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard/performance-metrics" replace />,
  },
  {
    path: "/dashboard/performance-metrics",
    element: (
      <Layout>
        <PerformanceMetrics />
      </Layout>
    ),
  },
  {
    path: "/dashboard/emotion-overview",
    element: (
      <Layout>
        <EmotionOverview />
      </Layout>
    ),
  },
  {
    path: "/dashboard/discipline-overview",
    element: (
      <Layout>
        <DisciplineOverview />
      </Layout>
    ),
  },
  {
    path: "/routines",
    element: (
      <Layout>
        <RoutineTracker />
      </Layout>
    ),
  },
  {
    path: "/daily-journal",
    element: (
      <Layout>
        <DailyJournal />
      </Layout>
    ),
  },
  {
    path: "/journal",
    element: (
      <Layout>
        <TradeJournal />
      </Layout>
    ),
  },
  {
    path: "/journal-preview",
    element: (
      <Layout>
        <TradeJournalPreview />
      </Layout>
    ),
  },
  {
    path: "/history",
    element: (
      <Layout>
        <TradeHistory />
      </Layout>
    ),
  },
  {
    path: "/settings",
    element: (
      <Layout>
        <Settings />
      </Layout>
    ),
  },
  {
    path: "/analytics",
    element: <Navigate to="/dashboard/performance-metrics" replace />,
  },
  {
    path: "*",
    element: <Navigate to="/dashboard/performance-metrics" replace />,
  },
]);