package com.dailytracker.app;

final class AppLimitsPolicy {
    private AppLimitsPolicy() {}

    static boolean isWithinAllowedWindow(String start, String end, int currentMinute) {
        int startMinute = parseMinute(start);
        int endMinute = parseMinute(end);
        if (startMinute < 0 || endMinute < 0 || startMinute == endMinute) return true;
        if (startMinute < endMinute) return currentMinute >= startMinute && currentMinute < endMinute;
        return currentMinute >= startMinute || currentMinute < endMinute;
    }

    static boolean isValidWindow(String start, String end) {
        if (start.isEmpty() && end.isEmpty()) return true;
        return parseMinute(start) >= 0 && parseMinute(end) >= 0;
    }

    static boolean isBlocked(
        int dailyLimitMinutes,
        long usedMillis,
        String start,
        String end,
        int currentMinute
    ) {
        boolean hasWindow = !start.isEmpty() && !end.isEmpty();
        if (hasWindow && !isWithinAllowedWindow(start, end, currentMinute)) return true;
        return dailyLimitMinutes > 0 && usedMillis >= dailyLimitMinutes * 60_000L;
    }

    private static int parseMinute(String value) {
        if (value == null || value.length() != 5 || value.charAt(2) != ':') return -1;
        try {
            int hour = Integer.parseInt(value.substring(0, 2));
            int minute = Integer.parseInt(value.substring(3, 5));
            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return -1;
            return hour * 60 + minute;
        } catch (NumberFormatException error) {
            return -1;
        }
    }
}
