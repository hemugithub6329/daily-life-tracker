package com.dailytracker.app;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class AppLimitsPolicyTest {
    @Test
    public void handlesRegularAndOvernightWindows() {
        assertTrue(AppLimitsPolicy.isWithinAllowedWindow("09:00", "17:00", 9 * 60));
        assertFalse(AppLimitsPolicy.isWithinAllowedWindow("09:00", "17:00", 17 * 60));
        assertTrue(AppLimitsPolicy.isWithinAllowedWindow("22:00", "06:00", 23 * 60));
        assertTrue(AppLimitsPolicy.isWithinAllowedWindow("22:00", "06:00", 5 * 60));
        assertFalse(AppLimitsPolicy.isWithinAllowedWindow("22:00", "06:00", 12 * 60));
    }

    @Test
    public void blocksAtDailyLimitAndTreatsMatchingTimesAsAllDay() {
        assertTrue(AppLimitsPolicy.isBlocked(30, 30 * 60_000L, "", "", 600));
        assertFalse(AppLimitsPolicy.isBlocked(30, 29 * 60_000L, "", "", 600));
        assertTrue(AppLimitsPolicy.isWithinAllowedWindow("08:00", "08:00", 1));
        assertFalse(AppLimitsPolicy.isValidWindow("08:00", ""));
        assertTrue(AppLimitsPolicy.isValidWindow("", ""));
    }
}
