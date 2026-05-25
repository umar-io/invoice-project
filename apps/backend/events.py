from collections import defaultdict

class EventBus:
    def __init__(self):
        self.listeners = defaultdict(list)

    def clear(self):
        self.listeners.clear()

    def subscribe(self, event_name, handler):
        self.listeners[event_name].append(handler)

    def emit(self, event_name, data):
        print(f"\n[EVENT] {event_name} triggered")
        for handler in self.listeners[event_name]:
            try:
                handler(data)
            except Exception as exc:
                print(f"[EVENT ERROR] {event_name} handler {handler.__name__} failed: {exc}")
            
event_bus = EventBus()
