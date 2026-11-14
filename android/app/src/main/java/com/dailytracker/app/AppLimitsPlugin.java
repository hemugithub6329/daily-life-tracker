package com.dailytracker.app;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(name = "AppLimits")
public class AppLimitsPlugin extends Plugin {
    static final String PREFERENCES = "daily_tracker_app_limits";
    static final String CONFIG_KEY = "config";
    static final String USAGE_DAY_KEY = "usage_day";
    static final String USAGE_KEY = "usage_millis";

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        try {
            PackageManager manager = getContext().getPackageManager();
            Intent launcherIntent = new Intent(Intent.ACTION_MAIN);
            launcherIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> resolved = manager.queryIntentActivities(launcherIntent, 0);
            Set<String> protectedPackages = getProtectedPackages(manager);
            Collections.sort(resolved, new Comparator<ResolveInfo>() {
                @Override
                public int compare(ResolveInfo first, ResolveInfo second) {
                    return first.loadLabel(manager).toString().compareToIgnoreCase(second.loadLabel(manager).toString());
                }
            });

            JSArray apps = new JSArray();
            String ownPackage = getContext().getPackageName();
            Set<String> seenPackages = new HashSet<>();
            for (ResolveInfo item : resolved) {
                String packageName = item.activityInfo.packageName;
                if (packageName.equals(ownPackage)
                    || protectedPackages.contains(packageName)
                    || !seenPackages.add(packageName)) continue;
                JSObject app = new JSObject();
                app.put("packageName", packageName);
                app.put("name", item.loadLabel(manager).toString());
                apps.put(app);
            }
            JSObject result = new JSObject();
            result.put("apps", apps);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Unable to read the installed app list.", error);
        }
    }

    @PluginMethod
    public void getConfig(PluginCall call) {
        try {
            String value = getContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
                .getString(CONFIG_KEY, "{\"enabled\":true,\"apps\":[]}");
            JSObject config = new JSObject(value);
            call.resolve(config);
        } catch (JSONException error) {
            call.reject("Saved app limits could not be read.", error);
        }
    }

    @PluginMethod
    public void setConfig(PluginCall call) {
        try {
            JSObject config = call.getData();
            JSONArray apps = config.getJSONArray("apps");
            for (int index = 0; index < apps.length(); index++) {
                JSONObject app = apps.getJSONObject(index);
                if (TextUtils.isEmpty(app.optString("packageName"))) {
                    call.reject("An app limit is missing its package name.");
                    return;
                }
                if (getProtectedPackages(getContext().getPackageManager()).contains(app.optString("packageName"))
                    || getContext().getPackageName().equals(app.optString("packageName"))) {
                    call.reject("Daily Tracker, phone, emergency, Settings, and Home apps cannot be restricted.");
                    return;
                }
                int limit = app.optInt("dailyLimitMinutes", 0);
                if (limit < 0 || limit > 1440) {
                    call.reject("Daily limits must be between 0 and 1,440 minutes.");
                    return;
                }
                String start = app.optString("windowStart", "");
                String end = app.optString("windowEnd", "");
                if (!AppLimitsPolicy.isValidWindow(start, end)
                    || (limit == 0 && start.isEmpty())) {
                    call.reject("Each selected app needs a daily limit or a valid allowed-time window.");
                    return;
                }
            }
            getContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
                .edit()
                .putString(CONFIG_KEY, config.toString())
                .apply();
            call.resolve();
        } catch (JSONException error) {
            call.reject("The app limits could not be saved.", error);
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject status = new JSObject();
        status.put("usageAccess", hasUsageAccess(getContext()));
        status.put("accessibilityEnabled", isAccessibilityEnabled());
        call.resolve(status);
    }

    @PluginMethod
    public void openUsageAccessSettings(PluginCall call) {
        openSettings(call, new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            .setData(android.net.Uri.parse("package:" + getContext().getPackageName())));
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        openSettings(call, new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
    }

    @PluginMethod
    public void getUsage(PluginCall call) {
        try {
            JSObject result = new JSObject();
            result.put("day", currentDayKey());
            JSONObject usage = AppLimitsAccessibilityService.readTrackedUsage(getContext());
            if (hasUsageAccess(getContext())) {
                UsageStatsManager manager = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
                if (manager != null) {
                    long now = System.currentTimeMillis();
                    Map<String, UsageStats> stats = manager.queryAndAggregateUsageStats(startOfToday(), now);
                    for (Map.Entry<String, UsageStats> entry : stats.entrySet()) {
                        long systemMillis = entry.getValue().getTotalTimeInForeground();
                        long trackedMillis = usage.optLong(entry.getKey(), 0);
                        usage.put(entry.getKey(), Math.max(systemMillis, trackedMillis));
                    }
                }
            }
            result.put("usageMillis", usage);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Unable to read today's app usage.", error);
        }
    }

    private void openSettings(PluginCall call, Intent intent) {
        try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception error) {
            call.reject("Unable to open the required Android settings page.", error);
        }
    }

    static boolean hasUsageAccess(Context context) {
        AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
        if (appOps == null) return false;
        int mode;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            mode = appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                context.getPackageName()
            );
        } else {
            mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                context.getPackageName()
            );
        }
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    static Set<String> getProtectedPackages(PackageManager manager) {
        Set<String> packages = new HashSet<>();
        addResolvedPackages(manager, new Intent(Intent.ACTION_DIAL), packages);
        addResolvedPackages(manager, new Intent("android.intent.action.CALL_EMERGENCY"), packages);
        addResolvedPackages(manager, new Intent(Settings.ACTION_SETTINGS), packages);
        Intent homeIntent = new Intent(Intent.ACTION_MAIN);
        homeIntent.addCategory(Intent.CATEGORY_HOME);
        addResolvedPackages(manager, homeIntent, packages);
        return packages;
    }

    private static void addResolvedPackages(PackageManager manager, Intent intent, Set<String> packages) {
        for (ResolveInfo resolveInfo : manager.queryIntentActivities(intent, 0)) {
            if (resolveInfo.activityInfo != null) packages.add(resolveInfo.activityInfo.packageName);
        }
    }

    private boolean isAccessibilityEnabled() {
        boolean globallyEnabled = Settings.Secure.getInt(
            getContext().getContentResolver(),
            Settings.Secure.ACCESSIBILITY_ENABLED,
            0
        ) == 1;
        if (!globallyEnabled) return false;
        String enabledServices = Settings.Secure.getString(
            getContext().getContentResolver(),
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        if (TextUtils.isEmpty(enabledServices)) return false;
        ComponentName service = new ComponentName(getContext(), AppLimitsAccessibilityService.class);
        TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
        splitter.setString(enabledServices);
        while (splitter.hasNext()) {
            String enabled = splitter.next();
            if (enabled.equalsIgnoreCase(service.flattenToString())
                || enabled.equalsIgnoreCase(service.flattenToShortString())) return true;
        }
        return false;
    }

    private static long startOfToday() {
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTimeInMillis();
    }

    private static String currentDayKey() {
        Calendar calendar = Calendar.getInstance();
        return String.format(
            java.util.Locale.US,
            "%04d-%02d-%02d",
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH) + 1,
            calendar.get(Calendar.DAY_OF_MONTH)
        );
    }
}
