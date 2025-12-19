/**
 * Meeting Storage Utilities
 * Handles persistence of speaker names by meeting ID in localStorage
 */

/**
 * Extract meeting ID from Google Meet URL
 * Format: meet.google.com/abc-defg-hij
 */
export function getMeetingId(): string | null {
    const url = window.location.href;
    const match = url.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/);
    return match ? match[1] : null;
}

/**
 * Save speaker names for a specific meeting
 */
export function saveSpeakerNames(meetingId: string, speakerNames: Record<string, string>): void {
    try {
        const mappings = JSON.parse(localStorage.getItem('speaker_mappings') || '{}');

        mappings[meetingId] = {
            ...speakerNames,
            lastUpdated: Date.now()
        };

        localStorage.setItem('speaker_mappings', JSON.stringify(mappings));
        console.log('💾 Saved speaker names for meeting:', meetingId, speakerNames);
    } catch (error) {
        console.error('Failed to save speaker names:', error);
    }
}

/**
 * Load speaker names for a specific meeting
 */
export function loadSpeakerNames(meetingId: string): Record<string, string> | null {
    try {
        const mappings = JSON.parse(localStorage.getItem('speaker_mappings') || '{}');
        const meetingData = mappings[meetingId];

        if (!meetingData) {
            console.log('📭 No saved speaker names for meeting:', meetingId);
            return null;
        }

        // Remove metadata before returning
        const result: Record<string, string> = {};
        Object.keys(meetingData).forEach(key => {
            if (key !== 'lastUpdated') {
                result[key] = meetingData[key];
            }
        });

        console.log('✅ Loaded speaker names for meeting:', meetingId, result);
        return result;
    } catch (error) {
        console.error('Failed to load speaker names:', error);
        return null;
    }
}

/**
 * Clear old meeting data (default: 30 days)
 */
export function clearOldMeetings(daysOld: number = 30): void {
    try {
        const mappings = JSON.parse(localStorage.getItem('speaker_mappings') || '{}');
        const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        let removedCount = 0;

        Object.keys(mappings).forEach(meetingId => {
            const lastUpdated = mappings[meetingId].lastUpdated;
            if (lastUpdated && lastUpdated < cutoff) {
                delete mappings[meetingId];
                removedCount++;
            }
        });

        localStorage.setItem('speaker_mappings', JSON.stringify(mappings));
        console.log(`🧹 Cleaned up ${removedCount} old meetings (older than ${daysOld} days)`);
    } catch (error) {
        console.error('Failed to clear old meetings:', error);
    }
}

/**
 * Get all saved meetings
 */
export function getAllMeetings(): Record<string, any> {
    try {
        return JSON.parse(localStorage.getItem('speaker_mappings') || '{}');
    } catch (error) {
        console.error('Failed to get all meetings:', error);
        return {};
    }
}
