
// Simple event bus for cross-component communication
type EventHandler = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventHandler[]>;
  private debug: boolean;

  constructor(debug = false) {
    this.events = new Map();
    this.debug = debug;
  }

  // Subscribe to an event
  on(eventName: string, handler: EventHandler): void {
    if (this.debug) {
      console.log(`EventBus: Subscribing to event ${eventName}`);
    }
    
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)?.push(handler);
  }

  // Unsubscribe from an event
  off(eventName: string, handler: EventHandler): void {
    if (this.debug) {
      console.log(`EventBus: Unsubscribing from event ${eventName}`);
    }
    
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
    
    if (this.debug) {
      console.log(`EventBus: Emitting event ${eventName}`, 
        handlers ? `to ${handlers.length} handlers` : 'with no handlers',
        args
      );
    }
    
    if (!handlers || handlers.length === 0) return;
    
    // Create a copy of the handlers array to avoid issues if handlers are added/removed during emission
    const handlersToCall = [...handlers];
    
    handlersToCall.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    });
  }
}

// Export a singleton instance with debug mode enabled during development
export const eventBus = new EventBus(process.env.NODE_ENV !== 'production');

// Event name constants
export const PATCH_EVENTS = {
  PATCHES_UPDATED: 'patches:updated',
  PATCH_ADDED: 'patch:added',
  PATCH_DELETED: 'patch:deleted',
  PATCH_EDITED: 'patch:edited'
};
