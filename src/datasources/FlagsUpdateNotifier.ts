import {ConfigurationNotification} from "@appflags/common";

export default class FlagsUpdateNotifier {

    private lastEvent: string|undefined = undefined;

    constructor(baseUrl: string, clientKey: string, callback: (published: number) => void) {
        this.connect(baseUrl, clientKey, callback)
            .catch(err => console.error("Error subscribing to AppFlags updates", err));
    }

    async connect(baseUrl: string, clientKey: string, callback: (published: number) => void) {
        let sseUrl = await this.getSseUrl(baseUrl, clientKey);

        if (this.lastEvent) {
            sseUrl += '&lastEvent=' + this.lastEvent
        }
        const eventSource = new EventSource(sseUrl);

        // handle messages
        eventSource.onmessage = (event) => {
            this.lastEvent = event.lastEventId;
            const message = JSON.parse(event.data);
            const notification = JSON.parse(message.data) as ConfigurationNotification;
            callback(notification.published);
        }

        // handle errors
        eventSource.onerror = (msg: Event) => {
            // @ts-ignore
            const err = JSON.parse(msg.data);
            const isTokenErr = err.code >= 40140 && err.code < 40150;
            if(isTokenErr) {
                eventSource.close();
                this.connect(baseUrl, clientKey, callback);
            } else {
                console.error("Error listening to AppFlags updates", err);
            }
        }
    }

    async getSseUrl(baseUrl: string, clientKey: string): Promise<string> {
        const url = `${baseUrl}/realtimeToken/${clientKey}/eventSource`;
        const res = await fetch(url, {
            method: "GET"
        });
        const json = await res.json() as {url: string}
        return json.url;
    }

}