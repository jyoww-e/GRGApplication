"use strict";

function isTraceEnabled(args = process.argv) {
  return (
    args.some((argument) => argument === "-trace" || argument === "--trace") ||
    process.env.npm_config_trace === "true"
  );
}

function trace(event, details, args = process.argv) {
  if (!isTraceEnabled(args)) return;
  const suffix = details === undefined ? "" : ` ${JSON.stringify(details)}`;
  console.info(`[BR08 TRACE ${new Date().toISOString()}] ${event}${suffix}`);
}

module.exports = { isTraceEnabled, trace };
