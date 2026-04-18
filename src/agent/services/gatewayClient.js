const { URLSearchParams } = require("url");
const agentConfig = require("../config/agentConfig");

class GatewayClient {
  constructor() {
    this.baseUrl = agentConfig.gatewayBaseUrl.replace(/\/$/, "");
    this.token = null;
  }

  async ensureAuthToken(forceRefresh = false) {
    if (this.token && !forceRefresh) {
      return this.token;
    }

    const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: agentConfig.authUsername,
        password: agentConfig.authPassword
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Unable to authenticate against the gateway");
    }

    this.token = payload.token;
    return this.token;
  }

  async request(path, { method = "GET", body, auth = false, query } = {}) {
    const doRequest = async () => {
      const headers = { "Content-Type": "application/json" };

      if (auth) {
        const token = await this.ensureAuthToken();
        headers.Authorization = `Bearer ${token}`;
      }

      const url = new URL(`${this.baseUrl}${path}`);
      if (query) url.search = new URLSearchParams(query).toString();

      return fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
    };

    let response = await doRequest();
    let payload = await response.json().catch(() => ({}));

    // Token expired — refresh once and retry
    if (response.status === 401 && auth) {
      this.token = null;
      await this.ensureAuthToken(true);
      response = await doRequest();
      payload = await response.json().catch(() => ({}));
    }

    if (!response.ok) {
      const message = payload.message || payload.error || "Gateway request failed";
      const error = new Error(message);
      error.statusCode = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  async queryFlights(params) {
    return this.request("/api/v1/flights/query", {
      method: "GET",
      query: params
    });
  }

  async buyTicket(payload) {
    return this.request("/api/v1/tickets/buy", {
      method: "POST",
      auth: true,
      body: payload
    });
  }

  async checkIn(payload) {
    return this.request("/api/v1/tickets/check-in", {
      method: "POST",
      body: payload
    });
  }

  async listPassengers(params) {
    return this.request("/api/v1/tickets/passengers", {
      method: "GET",
      auth: true,
      query: params
    });
  }
}

module.exports = new GatewayClient();
