
// Simple event bus for cross-component communication
type EventHandler = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventHandler[]>;

  constructor() {
    this.events = new Map();
  }

  // Subscribe to an event
  on(eventName: string, handler: EventHandler): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)?.push(handler);
  }

  // Unsubscribe from an event
  off(eventName: string, handler: EventHandler): void {
    const handlers = this.events.get(eventName);
    if (!handlers) return;
    
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  // Emit an event
  emit(eventName: string, ...args: any[]): void {
    const handlers = this.events.get(eventName);
    if (!handlers) return;
    
    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    });
  }
}

// Export a singleton instance
export const eventBus = new EventBus();

// Event name constants
export const PATCH_EVENTS = {
  PATCHES_UPDATED: 'patches:updated',
  PATCH_ADDED: 'patch:added',
  PATCH_DELETED: 'patch:deleted',
  PATCH_EDITED: 'patch:edited'
};
