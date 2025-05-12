import mongoose from "mongoose";

const requestLogSchema = new mongoose.Schema({
  requestId: String,
  timestamp: Date,
  ipAddress: String,
  method: String,
  url: String,
  requestBody: mongoose.Schema.Types.Mixed,
  responseStatus: Number,
  responseBody: mongoose.Schema.Types.Mixed,
  duration: Number,
});

export const RequestLog = mongoose.model("RequestLog", requestLogSchema);
