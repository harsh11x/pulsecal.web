const axios = require('axios');
const logger = require('./logger');

class CalendlyService {
    constructor() {
        this.baseURL = 'https://api.calendly.com';
        this.clientId = process.env.CALENDLY_CLIENT_ID;
        this.clientSecret = process.env.CALENDLY_CLIENT_SECRET;
        this.redirectUri = process.env.CALENDLY_REDIRECT_URI;
        this.webhookSigningKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
    }

    /**
     * Generate OAuth URL for user to authorize Calendly access
     */
    getAuthUrl(state) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            redirect_uri: this.redirectUri,
            state: state || '',
        });

        return `https://auth.calendly.com/oauth/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async getTokensFromCode(code) {
        try {
            const response = await axios.post('https://auth.calendly.com/oauth/token', {
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.redirectUri,
                client_id: this.clientId,
                client_secret: this.clientSecret,
            });

            return response.data;
        } catch (error) {
            logger.error('Error getting tokens from code:', error.response?.data || error.message);
            throw new Error('Failed to exchange authorization code for tokens');
        }
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken) {
        try {
            const response = await axios.post('https://auth.calendly.com/oauth/token', {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: this.clientId,
                client_secret: this.clientSecret,
            });

            return response.data;
        } catch (error) {
            logger.error('Error refreshing access token:', error.response?.data || error.message);
            throw new Error('Failed to refresh access token');
        }
    }

    /**
     * Get user info from Calendly
     */
    async getUserInfo(accessToken) {
        try {
            const response = await axios.get(`${this.baseURL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data.resource;
        } catch (error) {
            logger.error('Error getting user info:', error.response?.data || error.message);
            throw new Error('Failed to get user info');
        }
    }

    /**
     * Get user's event types (scheduling links)
     */
    async getEventTypes(accessToken, userUri) {
        try {
            const response = await axios.get(`${this.baseURL}/event_types`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                params: {
                    user: userUri,
                },
            });

            return response.data.collection;
        } catch (error) {
            logger.error('Error getting event types:', error.response?.data || error.message);
            throw new Error('Failed to get event types');
        }
    }

    /**
     * Get scheduled events
     */
    async getScheduledEvents(accessToken, userUri, options = {}) {
        try {
            const response = await axios.get(`${this.baseURL}/scheduled_events`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                params: {
                    user: userUri,
                    min_start_time: options.minStartTime,
                    max_start_time: options.maxStartTime,
                    status: options.status || 'active',
                    count: options.count || 100,
                },
            });

            return response.data.collection;
        } catch (error) {
            logger.error('Error getting scheduled events:', error.response?.data || error.message);
            throw new Error('Failed to get scheduled events');
        }
    }

    /**
     * Cancel a scheduled event
     */
    async cancelEvent(accessToken, eventUri, reason) {
        try {
            const response = await axios.post(`${eventUri}/cancellation`, {
                reason: reason || 'Cancelled by user',
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error) {
            logger.error('Error cancelling event:', error.response?.data || error.message);
            throw new Error('Failed to cancel event');
        }
    }

    /**
     * Create a webhook subscription
     */
    async createWebhook(accessToken, organizationUri, events, url) {
        try {
            const response = await axios.post(`${this.baseURL}/webhook_subscriptions`, {
                url: url,
                events: events,
                organization: organizationUri,
                scope: 'organization',
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data.resource;
        } catch (error) {
            logger.error('Error creating webhook:', error.response?.data || error.message);
            throw new Error('Failed to create webhook');
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSigningKey)
            .update(payload)
            .digest('base64');

        return signature === expectedSignature;
    }
}

module.exports = new CalendlyService();
