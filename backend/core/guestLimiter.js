// core/guestLimiter.js
// In-memory IP-based usage tracking for guest users
// Resets every 24 hours per IP. Max 2 analyses per guest.

const GUEST_ANALYSIS_LIMIT = 2;
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Map: ip -> { count, resetAt }
const guestStore = new Map();

/**
 * Get real client IP (works behind proxies)
 */
function getClientIP(req) {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        'unknown'
    );
}

/**
 * Returns current usage info for a guest IP
 */
function getGuestUsage(ip) {
    const now = Date.now();
    let record = guestStore.get(ip);

    // Auto-reset if expired
    if (!record || now > record.resetAt) {
        record = { count: 0, resetAt: now + RESET_INTERVAL_MS };
        guestStore.set(ip, record);
    }

    return record;
}

/**
 * Express middleware — blocks guests who have exceeded 2 analyses.
 * Skips check if req.user is set (logged-in user).
 */
function guestAnalysisLimit(req, res, next) {
    // Logged-in users have their own UsageLimit model — skip here
    if (req.user) return next();

    const ip = getClientIP(req);
    const record = getGuestUsage(ip);

    if (record.count >= GUEST_ANALYSIS_LIMIT) {
        return res.status(429).json({
            detail: `Guest limit reached. You can analyze up to ${GUEST_ANALYSIS_LIMIT} resumes for free every 24 hours. Please sign up for unlimited access.`,
            guest_limit: GUEST_ANALYSIS_LIMIT,
            analyses_used: record.count,
            resets_at: new Date(record.resetAt).toISOString()
        });
    }

    next();
}

/**
 * Call after a successful guest analysis to increment their counter.
 */
function incrementGuestUsage(req) {
    if (req.user) return; // not a guest
    const ip = getClientIP(req);
    const record = getGuestUsage(ip);
    record.count += 1;
    guestStore.set(ip, record);
}

/**
 * Returns remaining guest analyses for the current IP (for UI display).
 */
function getGuestRemaining(req) {
    if (req.user) return null;
    const ip = getClientIP(req);
    const record = getGuestUsage(ip);
    return Math.max(0, GUEST_ANALYSIS_LIMIT - record.count);
}

// Clean up old entries every hour to avoid memory accumulation
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of guestStore.entries()) {
        if (now > record.resetAt) {
            guestStore.delete(ip);
        }
    }
}, 60 * 60 * 1000);

module.exports = { guestAnalysisLimit, incrementGuestUsage, getGuestRemaining };
