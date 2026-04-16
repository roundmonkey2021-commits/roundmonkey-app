import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Handle OPTIONS preflight requests
app.options("/*", (c) => {
  return c.text("", 204);
});

// Health check endpoint
app.get("/make-server-40b8c081/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================
// TRADES ROUTES
// ============================================

// Get all trades
app.get("/make-server-40b8c081/trades", async (c) => {
  try {
    const key = 'app:trades';
    const trades = await kv.get(key) || [];
    return c.json({ trades });
  } catch (error) {
    console.log(`Error fetching trades: ${error}`);
    return c.json({ error: 'Failed to fetch trades' }, 500);
  }
});

// Add a new trade
app.post("/make-server-40b8c081/trades", async (c) => {
  try {
    const trade = await c.req.json();
    const key = 'app:trades';
    const trades = await kv.get(key) || [];
    
    const newTrade = {
      ...trade,
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    trades.push(newTrade);
    await kv.set(key, trades);
    
    return c.json({ trade: newTrade });
  } catch (error) {
    console.log(`Error adding trade: ${error}`);
    return c.json({ error: 'Failed to add trade' }, 500);
  }
});

// Update a trade
app.put("/make-server-40b8c081/trades/:id", async (c) => {
  try {
    const tradeId = c.req.param('id');
    const updates = await c.req.json();
    const key = 'app:trades';
    const trades = await kv.get(key) || [];
    
    const updatedTrades = trades.map((t: any) => 
      t.id === tradeId ? { ...t, ...updates } : t
    );
    
    await kv.set(key, updatedTrades);
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error updating trade: ${error}`);
    return c.json({ error: 'Failed to update trade' }, 500);
  }
});

// Delete a trade
app.delete("/make-server-40b8c081/trades/:id", async (c) => {
  try {
    const tradeId = c.req.param('id');
    const key = 'app:trades';
    const trades = await kv.get(key) || [];
    
    const filteredTrades = trades.filter((t: any) => t.id !== tradeId);
    await kv.set(key, filteredTrades);
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting trade: ${error}`);
    return c.json({ error: 'Failed to delete trade' }, 500);
  }
});

// Clear all trades (for resetting to dummy data)
app.delete("/make-server-40b8c081/trades", async (c) => {
  try {
    const key = 'app:trades';
    await kv.set(key, []);
    
    return c.json({ success: true, message: 'All trades cleared' });
  } catch (error) {
    console.log(`Error clearing trades: ${error}`);
    return c.json({ error: 'Failed to clear trades' }, 500);
  }
});

// ============================================
// SETTINGS ROUTES
// ============================================

// Get app settings
app.get("/make-server-40b8c081/settings", async (c) => {
  try {
    const key = 'app:settings';
    const settings = await kv.get(key);
    return c.json({ settings: settings || null });
  } catch (error) {
    console.log(`Error fetching settings: ${error}`);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

// Update app settings
app.post("/make-server-40b8c081/settings", async (c) => {
  try {
    const settings = await c.req.json();
    const key = 'app:settings';
    await kv.set(key, settings);
    
    return c.json({ success: true, settings });
  } catch (error) {
    console.log(`Error updating settings: ${error}`);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// ============================================
// ROUTINES ROUTES
// ============================================

// Get app routines
app.get("/make-server-40b8c081/routines", async (c) => {
  try {
    const key = 'app:routines';
    const routines = await kv.get(key) || [];
    return c.json({ routines });
  } catch (error) {
    console.log(`Error fetching routines: ${error}`);
    return c.json({ error: 'Failed to fetch routines' }, 500);
  }
});

// Update app routines
app.post("/make-server-40b8c081/routines", async (c) => {
  try {
    const routines = await c.req.json();
    const key = 'app:routines';
    await kv.set(key, routines);
    
    return c.json({ success: true, routines });
  } catch (error) {
    console.log(`Error updating routines: ${error}`);
    return c.json({ error: 'Failed to update routines' }, 500);
  }
});

Deno.serve(app.fetch);