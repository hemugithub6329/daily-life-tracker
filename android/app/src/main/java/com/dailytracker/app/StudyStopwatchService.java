package com.dailytracker.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.widget.RemoteViews;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;

import com.getcapacitor.JSObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class StudyStopwatchService extends Service {
    static final String ACTION_START = "com.dailytracker.app.study_stopwatch.START";
    static final String ACTION_STOP = "com.dailytracker.app.study_stopwatch.STOP";
    static final String EXTRA_ELAPSED_SECONDS = "elapsedSeconds";

    private static final String CHANNEL_ID = "study_stopwatch";
    private static final int NOTIFICATION_ID = 4201;
    private static final String PREFS_NAME = "study_stopwatch";
    private static final String KEY_RUNNING = "running";
    private static final String KEY_START_TIME = "startTime";
    private static final String KEY_START_ELAPSED_REALTIME = "startElapsedRealtime";
    private static final String KEY_ELAPSED_SECONDS = "elapsedSeconds";
    private static final String KEY_LAST_SESSION_ID = "lastSessionId";
    private static final String KEY_LAST_SESSION_START = "lastSessionStart";
    private static final String KEY_LAST_SESSION_END = "lastSessionEnd";
    private static final String KEY_LAST_SESSION_DURATION = "lastSessionDuration";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? ACTION_START : intent.getAction();
        if (ACTION_START.equals(action)) {
            if (intent == null && getPreferences(this).getBoolean(KEY_RUNNING, false)) {
                restoreTimer();
            } else {
                long elapsedSeconds = intent == null ? readElapsedSeconds(this) : intent.getLongExtra(EXTRA_ELAPSED_SECONDS, 0);
                startTimer(elapsedSeconds);
            }
        } else if (ACTION_STOP.equals(action)) {
            stopTimer(true);
        } else {
            stopSelf(startId);
        }
        return START_STICKY;
    }

    private void startTimer(long elapsedSeconds) {
        long startTime = System.currentTimeMillis() - Math.max(0, elapsedSeconds) * 1000L;
        long startElapsedRealtime = SystemClock.elapsedRealtime() - Math.max(0, elapsedSeconds) * 1000L;
        getPreferences(this).edit()
            .putBoolean(KEY_RUNNING, true)
            .putLong(KEY_START_TIME, startTime)
            .putLong(KEY_START_ELAPSED_REALTIME, startElapsedRealtime)
            .putLong(KEY_ELAPSED_SECONDS, Math.max(0, elapsedSeconds))
            .remove(KEY_LAST_SESSION_ID)
            .remove(KEY_LAST_SESSION_START)
            .remove(KEY_LAST_SESSION_END)
            .remove(KEY_LAST_SESSION_DURATION)
            .apply();

        startForegroundNotification(startElapsedRealtime);
    }

    private void restoreTimer() {
        android.content.SharedPreferences preferences = getPreferences(this);
        long startElapsedRealtime = preferences.getLong(KEY_START_ELAPSED_REALTIME, SystemClock.elapsedRealtime());
        startForegroundNotification(startElapsedRealtime);
    }

    private void startForegroundNotification(long startElapsedRealtime) {
        Notification notification = createNotification(startElapsedRealtime);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            );
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void stopTimer(boolean saveSession) {
        android.content.SharedPreferences preferences = getPreferences(this);
        if (preferences.getBoolean(KEY_RUNNING, false)) {
            long startTime = preferences.getLong(KEY_START_TIME, System.currentTimeMillis());
            long endTime = System.currentTimeMillis();
            long startElapsedRealtime = preferences.getLong(KEY_START_ELAPSED_REALTIME, SystemClock.elapsedRealtime());
            long duration = Math.max(0, (SystemClock.elapsedRealtime() - startElapsedRealtime) / 1000L);
            android.content.SharedPreferences.Editor editor = preferences.edit()
                .putBoolean(KEY_RUNNING, false)
                .putLong(KEY_ELAPSED_SECONDS, duration);
            if (saveSession && duration > 0) {
                editor.putString(KEY_LAST_SESSION_ID, "android-stopwatch-" + startTime)
                    .putLong(KEY_LAST_SESSION_START, startTime)
                    .putLong(KEY_LAST_SESSION_END, endTime)
                    .putLong(KEY_LAST_SESSION_DURATION, duration);
            }
            editor.apply();
        }
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    static void finishFromPlugin(Context context, boolean saveSession) {
        android.content.SharedPreferences preferences = getPreferences(context);
        if (preferences.getBoolean(KEY_RUNNING, false)) {
            long startTime = preferences.getLong(KEY_START_TIME, System.currentTimeMillis());
            long endTime = System.currentTimeMillis();
            long startElapsedRealtime = preferences.getLong(KEY_START_ELAPSED_REALTIME, SystemClock.elapsedRealtime());
            long duration = Math.max(0, (SystemClock.elapsedRealtime() - startElapsedRealtime) / 1000L);
            android.content.SharedPreferences.Editor editor = preferences.edit()
                .putBoolean(KEY_RUNNING, false)
                .putLong(KEY_ELAPSED_SECONDS, duration);
            if (saveSession && duration > 0) {
                editor.putString(KEY_LAST_SESSION_ID, "android-stopwatch-" + startTime)
                    .putLong(KEY_LAST_SESSION_START, startTime)
                    .putLong(KEY_LAST_SESSION_END, endTime)
                    .putLong(KEY_LAST_SESSION_DURATION, duration);
            } else if (!saveSession) {
                editor.clear();
            }
            editor.apply();
        } else if (!saveSession) {
            preferences.edit().clear().apply();
        }
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.cancel(NOTIFICATION_ID);
        }
        context.stopService(new Intent(context, StudyStopwatchService.class));
    }

    private Notification createNotification(long startElapsedRealtime) {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent contentIntent = null;
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            contentIntent = PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
        }

        Intent stopIntent = new Intent(this, StudyStopwatchService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);
        RemoteViews compactView = new RemoteViews(getPackageName(), R.layout.notification_study_stopwatch_compact);
        compactView.setChronometer(
            R.id.notification_stopwatch_chronometer,
            startElapsedRealtime,
            "%s",
            true
        );
        compactView.setOnClickPendingIntent(R.id.notification_stop_button, stopPendingIntent);
        RemoteViews expandedView = new RemoteViews(getPackageName(), R.layout.notification_study_stopwatch);
        expandedView.setChronometer(R.id.notification_stopwatch_chronometer, startElapsedRealtime, "%s", true);
        expandedView.setOnClickPendingIntent(R.id.notification_stop_button, stopPendingIntent);
        builder.setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("Study stopwatch")
            .setContentText("Study time is running")
            .setOngoing(true)
            .setCategory(Notification.CATEGORY_STOPWATCH)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setStyle(new Notification.DecoratedCustomViewStyle())
            .setCustomContentView(compactView)
            .setCustomBigContentView(expandedView)
            .addAction(android.R.drawable.ic_media_pause, "Stop", stopPendingIntent);
        if (contentIntent != null) {
            builder.setContentIntent(contentIntent);
        }
        return builder.build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Study stopwatch",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Shows the study stopwatch while it is running.");
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(channel);
    }

    static JSObject readState(Context context) {
        android.content.SharedPreferences preferences = getPreferences(context);
        boolean running = preferences.getBoolean(KEY_RUNNING, false);
        long startTime = preferences.getLong(KEY_START_TIME, 0);
        long elapsedSeconds = running
            ? Math.max(0, (SystemClock.elapsedRealtime() - preferences.getLong(KEY_START_ELAPSED_REALTIME, SystemClock.elapsedRealtime())) / 1000L)
            : preferences.getLong(KEY_ELAPSED_SECONDS, 0);

        JSObject state = new JSObject();
        state.put("running", running);
        state.put("startTime", startTime);
        state.put("elapsedSeconds", elapsedSeconds);
        String sessionId = preferences.getString(KEY_LAST_SESSION_ID, null);
        if (sessionId != null) {
            JSObject session = new JSObject();
            session.put("id", sessionId);
            session.put("startTime", formatIsoTime(preferences.getLong(KEY_LAST_SESSION_START, 0)));
            session.put("endTime", formatIsoTime(preferences.getLong(KEY_LAST_SESSION_END, 0)));
            session.put("duration", preferences.getLong(KEY_LAST_SESSION_DURATION, 0));
            state.put("lastSession", session);
        }
        return state;
    }

    private static long readElapsedSeconds(Context context) {
        return getPreferences(context).getLong(KEY_ELAPSED_SECONDS, 0);
    }

    private static String formatIsoTime(long time) {
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        formatter.setTimeZone(TimeZone.getTimeZone("UTC"));
        return formatter.format(new Date(time));
    }

    private static android.content.SharedPreferences getPreferences(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
