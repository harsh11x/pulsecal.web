const { google } = require('googleapis');
const logger = require('./logger');

class GoogleCalendarService {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CALENDAR_CLIENT_ID,
            process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
            process.env.GOOGLE_CALENDAR_REDIRECT_URI
        );
    }

    /**
     * Generate OAuth URL for user to authorize calendar access
     */
    getAuthUrl() {
        const scopes = [
            'https://www.googleapis.com/auth/calendar.events'
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent' // Force consent screen to get refresh token
        });
    }

    /**
     * Exchange authorization code for tokens
     */
    async getTokensFromCode(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            return tokens;
        } catch (error) {
            logger.error('Error getting tokens from code:', error);
            throw new Error('Failed to exchange authorization code for tokens');
        }
    }

    /**
     * Set credentials for the OAuth client
     */
    setCredentials(accessToken, refreshToken) {
        this.oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken
        });
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken) {
        try {
            this.oauth2Client.setCredentials({
                refresh_token: refreshToken
            });

            const { credentials } = await this.oauth2Client.refreshAccessToken();
            return credentials;
        } catch (error) {
            logger.error('Error refreshing access token:', error);
            throw new Error('Failed to refresh access token');
        }
    }

    /**
     * Create a calendar event for an appointment
     */
    async createEvent(accessToken, refreshToken, eventDetails) {
        try {
            this.setCredentials(accessToken, refreshToken);

            const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

            const event = {
                summary: eventDetails.summary,
                description: eventDetails.description,
                start: {
                    dateTime: eventDetails.startTime,
                    timeZone: eventDetails.timeZone || 'Asia/Kolkata',
                },
                end: {
                    dateTime: eventDetails.endTime,
                    timeZone: eventDetails.timeZone || 'Asia/Kolkata',
                },
                attendees: eventDetails.attendees || [],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 30 },
                    ],
                },
            };

            const response = await calendar.events.insert({
                calendarId: 'primary',
                resource: event,
                sendUpdates: 'all'
            });

            return response.data;
        } catch (error) {
            logger.error('Error creating calendar event:', error);

            // If token expired, try to refresh
            if (error.code === 401 || error.message?.includes('invalid_grant')) {
                const newTokens = await this.refreshAccessToken(refreshToken);
                // Retry with new token
                this.setCredentials(newTokens.access_token, refreshToken);
                return this.createEvent(newTokens.access_token, refreshToken, eventDetails);
            }

            throw new Error('Failed to create calendar event');
        }
    }

    /**
     * Update a calendar event
     */
    async updateEvent(accessToken, refreshToken, eventId, eventDetails) {
        try {
            this.setCredentials(accessToken, refreshToken);

            const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

            const event = {
                summary: eventDetails.summary,
                description: eventDetails.description,
                start: {
                    dateTime: eventDetails.startTime,
                    timeZone: eventDetails.timeZone || 'Asia/Kolkata',
                },
                end: {
                    dateTime: eventDetails.endTime,
                    timeZone: eventDetails.timeZone || 'Asia/Kolkata',
                },
            };

            const response = await calendar.events.update({
                calendarId: 'primary',
                eventId: eventId,
                resource: event,
                sendUpdates: 'all'
            });

            return response.data;
        } catch (error) {
            logger.error('Error updating calendar event:', error);

            if (error.code === 401) {
                const newTokens = await this.refreshAccessToken(refreshToken);
                this.setCredentials(newTokens.access_token, refreshToken);
                return this.updateEvent(newTokens.access_token, refreshToken, eventId, eventDetails);
            }

            throw new Error('Failed to update calendar event');
        }
    }

    /**
     * Delete a calendar event
     */
    async deleteEvent(accessToken, refreshToken, eventId) {
        try {
            this.setCredentials(accessToken, refreshToken);

            const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

            await calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
                sendUpdates: 'all'
            });

            return true;
        } catch (error) {
            logger.error('Error deleting calendar event:', error);

            if (error.code === 401) {
                const newTokens = await this.refreshAccessToken(refreshToken);
                this.setCredentials(newTokens.access_token, refreshToken);
                return this.deleteEvent(newTokens.access_token, refreshToken, eventId);
            }

            throw new Error('Failed to delete calendar event');
        }
    }

    /**
     * List calendar events
     */
    async listEvents(accessToken, refreshToken, timeMin, timeMax) {
        try {
            this.setCredentials(accessToken, refreshToken);

            const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin || new Date().toISOString(),
                timeMax: timeMax,
                maxResults: 50,
                singleEvents: true,
                orderBy: 'startTime',
            });

            return response.data.items || [];
        } catch (error) {
            logger.error('Error listing calendar events:', error);

            if (error.code === 401) {
                const newTokens = await this.refreshAccessToken(refreshToken);
                this.setCredentials(newTokens.access_token, refreshToken);
                return this.listEvents(newTokens.access_token, refreshToken, timeMin, timeMax);
            }

            throw new Error('Failed to list calendar events');
        }
    }
}

module.exports = new GoogleCalendarService();
