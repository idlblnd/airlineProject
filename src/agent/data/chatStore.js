const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const messageBus = require("./messageBus");

class MemoryChatStore {
  constructor() {
    this.sessions = new Map();
  }

  async createSession() {
    const id = crypto.randomUUID();
    const session = {
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    this.sessions.set(id, session);
    return session;
  }

  async getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  async addMessage(sessionId, message) {
    const session = await this.getSession(sessionId);

    if (!session) {
      return null;
    }

    const storedMessage = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...message
    };

    session.messages.push(storedMessage);
    session.updatedAt = new Date().toISOString();
    messageBus.publish(sessionId, storedMessage);

    return storedMessage;
  }
}

class FirestoreChatStore {
  constructor() {
    let admin;

    try {
      admin = require("firebase-admin");
    } catch (error) {
      throw new Error(
        "Firestore provider selected but firebase-admin is not installed. Run npm install first."
      );
    }

    if (!admin.apps.length) {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      if (serviceAccountPath) {
        const absolutePath = path.resolve(serviceAccountPath);
        const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, "utf8"));

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else {
        admin.initializeApp();
      }
    }

    this.db = admin.firestore();
    this.collection = this.db.collection("chatSessions");
  }

  async createSession() {
    const id = crypto.randomUUID();
    const session = {
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    await this.collection.doc(id).set(session);
    return session;
  }

  async getSession(sessionId) {
    const document = await this.collection.doc(sessionId).get();

    if (!document.exists) {
      return null;
    }

    return document.data();
  }

  async addMessage(sessionId, message) {
    const session = await this.getSession(sessionId);

    if (!session) {
      return null;
    }

    const storedMessage = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...message
    };

    const nextSession = {
      ...session,
      updatedAt: new Date().toISOString(),
      messages: [...(session.messages || []), storedMessage]
    };

    await this.collection.doc(sessionId).set(nextSession);
    messageBus.publish(sessionId, storedMessage);

    return storedMessage;
  }
}

const createChatStore = () => {
  if (process.env.CHAT_STORE_PROVIDER === "firestore") {
    return new FirestoreChatStore();
  }

  return new MemoryChatStore();
};

module.exports = createChatStore();
