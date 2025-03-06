import { ApiKeySession, EventsApi } from "klaviyo-api";
import { serverConfig } from "~/config.server";

const session = new ApiKeySession(serverConfig.klaviyoPrivateApiKey);
export const eventsApi = new EventsApi(session);
