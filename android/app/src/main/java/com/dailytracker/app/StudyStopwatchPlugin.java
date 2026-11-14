package com.dailytracker.app;

import android.Manifest;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "StudyStopwatch",
    permissions = {
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class StudyStopwatchPlugin extends Plugin {
    @PluginMethod
    public void start(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "startAfterNotificationPermission");
            return;
        }
        startService(call);
    }

    @PermissionCallback
    private void startAfterNotificationPermission(PluginCall call) {
        if (getPermissionState("notifications") != PermissionState.GRANTED) {
            call.reject("Notification permission is required to show the running stopwatch.");
            return;
        }
        startService(call);
    }

    private void startService(PluginCall call) {
        Intent intent = new Intent(getContext(), StudyStopwatchService.class);
        intent.setAction(StudyStopwatchService.ACTION_START);
        long elapsedSeconds = call.getInt("elapsedSeconds", 0);
        intent.putExtra(StudyStopwatchService.EXTRA_ELAPSED_SECONDS, elapsedSeconds);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }
            JSObject state = new JSObject();
            state.put("running", true);
            state.put("startTime", System.currentTimeMillis() - elapsedSeconds * 1000L);
            state.put("elapsedSeconds", elapsedSeconds);
            call.resolve(state);
        } catch (Exception error) {
            call.reject("Unable to start the stopwatch notification.", error);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            StudyStopwatchService.finishFromPlugin(getContext(), true);
            call.resolve(StudyStopwatchService.readState(getContext()));
        } catch (Exception error) {
            call.reject("Unable to stop the stopwatch.", error);
        }
    }

    @PluginMethod
    public void reset(PluginCall call) {
        try {
            StudyStopwatchService.finishFromPlugin(getContext(), false);
            call.resolve(StudyStopwatchService.readState(getContext()));
        } catch (Exception error) {
            call.reject("Unable to reset the stopwatch.", error);
        }
    }

    @PluginMethod
    public void getState(PluginCall call) {
        call.resolve(StudyStopwatchService.readState(getContext()));
    }

}
