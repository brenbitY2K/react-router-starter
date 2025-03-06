import { pino } from "pino";

// TODO: Figure out a way to actually mock this
export const mockedLogger = pino({
  level: "silent",
});
