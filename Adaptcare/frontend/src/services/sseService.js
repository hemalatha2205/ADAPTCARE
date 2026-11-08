export const sseService = {
  subscribe: (token, onMessage) => {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const url = `${apiBase}/sse/subscribe?token=${encodeURIComponent(token || '')}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener('NOTIFICATION', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (onMessage) onMessage('NOTIFICATION', data);
      } catch (err) {
        console.error('Error parsing SSE notification', err);
      }
    });

    eventSource.addEventListener('QUEUE_UPDATE', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (onMessage) onMessage('QUEUE_UPDATE', data);
      } catch (err) {
        console.error('Error parsing SSE queue update', err);
      }
    });

    eventSource.addEventListener('ADAPTATION_EVENT', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (onMessage) onMessage('ADAPTATION_EVENT', data);
      } catch (err) {
        console.error('Error parsing SSE adaptation event', err);
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
    };

    return eventSource;
  },
};
