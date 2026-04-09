const EventEmitter = require("events");

class MessageBus extends EventEmitter {
  publish(sessionId, payload) {
    this.emit(`session:${sessionId}`, payload);
  }

  subscribe(sessionId, listener) {
    const eventName = `session:${sessionId}`;
    this.on(eventName, listener);

    return () => {
      this.off(eventName, listener);
    };
  }
}

module.exports = new MessageBus();
