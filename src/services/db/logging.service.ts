import {RequestLog} from "../../models/request-logs.model";

export const logRequest = async (logEntry: Record<string, any>) => {
  try {
    await RequestLog.create(logEntry);
  } catch (error) {
    console.error("MongoDB logging error:", error);
  }
};
