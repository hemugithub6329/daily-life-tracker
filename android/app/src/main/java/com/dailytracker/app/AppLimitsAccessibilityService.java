package com.dailytracker.app;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityEvent;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public class AppLimitsAccessibilityService extends AccessibilityService {
    private static final long TICK_INTERVAL_MILLIS = 1000L;
    private static final long USAGE_STATS_REFRESH_MILLIS = 10_000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Set<String> launchablePackages = new HashSet<>();
    private final Map<String, Long> systemUsageCache = new HashMap<>();
    private String currentPackage = "";
    private String redirectedPackage = "";
    private long lastElapsedRealtime;
    private long lastWallTime;
    private long lastForegroundEventTime;
    private long lastUsageStatsRefresh;
    private boolean running;

    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            if (!running) return;
            accountForegroundTime();
            syncForegroundPackage();
            refreshSystemUsageIfNeeded();
            enforceCurrentPackage();
            handler.postDelayed(this, TICK_INTERVAL_MILLIS);
        }
    };

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        AccessibilityServiceInfo info = getServiceInfo();
        if (info != null) {
            info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
                | AccessibilityEvent.TYPE_WINDOWS_CHANGED;
            info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
            info.notificationTimeout = 100;
            setServiceInfo(info);
        }
        loadLaunchablePackages();
        running = true;
        lastElapsedRealtime = SystemClock.elapsedRealtime();
        lastWallTime = System.currentTimeMillis();
        lastForegroundEventTime = Math.max(0, System.currentTimeMillis() - 60_000L);
        syncForegroundPackage();
        refreshSystemUsageIfNeeded();
        handler.post(tick);
    }

    private boolean isScreenInteractive() {
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        return powerManager != null && powerManager.isInteractive();
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null || event.getPackageName() == null) return;
        String packageName = event.getPackageName().toString();
        if (!launchablePackages.contains(packageName)) return;
        if (!packageName.equals(currentPackage)) {
            accountForegroundTime();
            currentPackage = packageName;
            redirectedPackage = "";
            enforceCurrentPackage();
        }
    }

    @Override
    public void onInterrupt() {
        accountForegroundTime();
    }

    @Override
    public void onDestroy() {
        running = false;
        handler.removeCallbacks(tick);
        accountForegroundTime();
        super.onDestroy();
    }

    static JSONObject readTrackedUsage(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(
            AppLimitsPlugin.PREFERENCES,
            Context.MODE_PRIVATE
        );
        String today = dayKey(System.currentTimeMillis());
        if (!today.equals(preferences.getString(AppLimitsPlugin.USAGE_DAY_KEY, ""))) {
            return new JSONObject();
        }
        try {
            return new JSONObject(preferences.getString(AppLimitsPlugin.USAGE_KEY, "{}"));
        } catch (JSONException error) {
            android.util.Log.e("AppLimits", "Saved app usage is invalid.", error);
            return new JSONObject();
        }
    }

    private void loadLaunchablePackages() {
        launchablePackages.clear();
        Intent launcherIntent = new Intent(Intent.ACTION_MAIN);
        launcherIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        PackageManager manager = getPackageManager();
        List<ResolveInfo> apps = manager.queryIntentActivities(launcherIntent, 0);
        for (ResolveInfo app : apps) {
            launchablePackages.add(app.activityInfo.packageName);
        }
    }

    private void syncForegroundPackage() {
        if (!AppLimitsPlugin.hasUsageAccess(this)) return;
        UsageStatsManager manager = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        if (manager == null) return;
        try {
            long now = System.currentTimeMillis();
            long queryStart = Math.max(lastForegroundEventTime, now - 60_000L);
            UsageEvents events = manager.queryEvents(queryStart, now);
            UsageEvents.Event event = new UsageEvents.Event();
            String foreground = currentPackage;
            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                int type = event.getEventType();
                if (type == UsageEvents.Event.ACTIVITY_RESUMED
                    || type == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    foreground = event.getPackageName();
                } else if (type == UsageEvents.Event.ACTIVITY_PAUSED
                    || type == UsageEvents.Event.MOVE_TO_BACKGROUND) {
                    if (event.getPackageName().equals(foreground)) foreground = "";
                }
                lastForegroundEventTime = Math.max(lastForegroundEventTime, event.getTimeStamp());
            }
            if (!foreground.isEmpty() && !launchablePackages.contains(foreground)) {
                foreground = "";
            }
            if (!foreground.equals(currentPackage)) {
                accountForegroundTime();
                currentPackage = foreground;
                redirectedPackage = "";
            }
        } catch (RuntimeException error) {
            android.util.Log.e("AppLimits", "Could not determine the foreground app from usage events.", error);
        }
    }

    private void accountForegroundTime() {
        long elapsed = SystemClock.elapsedRealtime();
        long wall = System.currentTimeMillis();
        long delta = Math.max(0, elapsed - lastElapsedRealtime);
        String today = dayKey(wall);
        SharedPreferences preferences = getSharedPreferences(AppLimitsPlugin.PREFERENCES, MODE_PRIVATE);
        String savedDay = preferences.getString(AppLimitsPlugin.USAGE_DAY_KEY, "");
        JSONObject usage;
        try {
            usage = today.equals(savedDay)
                ? new JSONObject(preferences.getString(AppLimitsPlugin.USAGE_KEY, "{}"))
                : new JSONObject();
        } catch (JSONException error) {
            android.util.Log.e("AppLimits", "Could not read saved app usage.", error);
            usage = new JSONObject();
        }

        if (delta > 0 && isScreenInteractive() && !currentPackage.isEmpty() && isSelected(currentPackage)) {
            long deltaForToday = delta;
            if (wall >= lastWallTime) {
                long dayStart = startOfDay(wall);
                if (lastWallTime < dayStart) deltaForToday = Math.max(0, wall - dayStart);
            }
            if (deltaForToday > 0) {
                long total = usage.optLong(currentPackage, 0) + deltaForToday;
                try {
                    usage.put(currentPackage, total);
                } catch (JSONException error) {
                    android.util.Log.e("AppLimits", "Could not update daily app usage.", error);
                }
            }
        }

        preferences.edit()
            .putString(AppLimitsPlugin.USAGE_DAY_KEY, today)
            .putString(AppLimitsPlugin.USAGE_KEY, usage.toString())
            .apply();
        lastElapsedRealtime = elapsed;
        lastWallTime = wall;
    }

    private void enforceCurrentPackage() {
        if (!isScreenInteractive() || currentPackage.isEmpty() || currentPackage.equals(getPackageName())) return;
        JSONObject config = readConfig();
        if (!config.optBoolean("enabled", true) || !isBlocked(currentPackage, config)) return;
        if (currentPackage.equals(redirectedPackage)) return;
        if (performGlobalAction(GLOBAL_ACTION_HOME)) {
            redirectedPackage = currentPackage;
        } else {
            android.util.Log.e("AppLimits", "Android could not return to Home for a blocked app.");
            redirectedPackage = "";
        }
    }

    private boolean isBlocked(String packageName, JSONObject config) {
        JSONArray apps = config.optJSONArray("apps");
        if (apps == null) return false;
        JSONObject selected = null;
        for (int index = 0; index < apps.length(); index++) {
            JSONObject app = apps.optJSONObject(index);
            if (app != null && packageName.equals(app.optString("packageName"))) {
                selected = app;
                break;
            }
        }
        if (selected == null) return false;

        long usedMillis = readTrackedUsage(this).optLong(packageName, 0);
        int limitMinutes = selected.optInt("dailyLimitMinutes", 0);
        if (limitMinutes > 0) {
            usedMillis = Math.max(usedMillis, systemUsageCache.containsKey(packageName)
                ? systemUsageCache.get(packageName) : 0L);
        }
        Calendar now = Calendar.getInstance();
        int minuteOfDay = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);
        return AppLimitsPolicy.isBlocked(
            limitMinutes,
            usedMillis,
            selected.optString("windowStart", ""),
            selected.optString("windowEnd", ""),
            minuteOfDay
        );
    }

    private boolean isSelected(String packageName) {
        JSONArray apps = readConfig().optJSONArray("apps");
        if (apps == null) return false;
        for (int index = 0; index < apps.length(); index++) {
            JSONObject app = apps.optJSONObject(index);
            if (app != null && packageName.equals(app.optString("packageName"))) return true;
        }
        return false;
    }

    private JSONObject readConfig() {
        String value = getSharedPreferences(AppLimitsPlugin.PREFERENCES, MODE_PRIVATE)
            .getString(AppLimitsPlugin.CONFIG_KEY, "{\"enabled\":true,\"apps\":[]}");
        try {
            return new JSONObject(value);
        } catch (JSONException error) {
            android.util.Log.e("AppLimits", "Saved app limits are invalid.", error);
            return new JSONObject();
        }
    }

    private void refreshSystemUsageIfNeeded() {
        if (SystemClock.elapsedRealtime() - lastUsageStatsRefresh < USAGE_STATS_REFRESH_MILLIS) return;
        lastUsageStatsRefresh = SystemClock.elapsedRealtime();
        if (!AppLimitsPlugin.hasUsageAccess(this)) return;
        UsageStatsManager manager = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        if (manager == null) return;
        try {
            Map<String, UsageStats> usage = manager.queryAndAggregateUsageStats(
                startOfDay(System.currentTimeMillis()),
                System.currentTimeMillis()
            );
            systemUsageCache.clear();
            for (Map.Entry<String, UsageStats> entry : usage.entrySet()) {
                systemUsageCache.put(entry.getKey(), entry.getValue().getTotalTimeInForeground());
            }
        } catch (RuntimeException error) {
            android.util.Log.e("AppLimits", "Could not refresh Android app-usage totals.", error);
        }
    }

    private static long startOfDay(long timeMillis) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(timeMillis);
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTimeInMillis();
    }

    private static String dayKey(long timeMillis) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(timeMillis);
        return String.format(
            Locale.US,
            "%04d-%02d-%02d",
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH) + 1,
            calendar.get(Calendar.DAY_OF_MONTH)
        );
    }
}
