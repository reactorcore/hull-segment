import { reduce } from "lodash";
import scoped from "../scope-hull-client";

export default function handleTrack(payload, { hull }) {
  const { context, anonymousId, event, properties, userId, originalTimestamp, sentAt, receivedAt, integrations = {} } = payload;

  const { metric, log } = hull.utils;

  const page = (context || {}).page || {};

  const created_at = originalTimestamp || sentAt || receivedAt;

  const aId = anonymousId || userId;
  let sId = (created_at || new Date().toISOString()).substring(0, 10);

  if (aId) {
    sId = [aId, sId].join("-");
  }

  const trackContext = reduce({
    ip: context.ip || "0",
    _bid: aId,
    _sid: sId,
    created_at,
    source: "segment",
    url: page.url,
    useragent: context.userAgent,
    referrer: page.referrer
  }, (p, v, k) => {
    if (v !== undefined) {
      p[k] = v;
    }
    return p;
  }, {});

  if (integrations.Hull && integrations.Hull.id === true) {
    payload.hullId = payload.userId;
    delete payload.userId;
  }

  const tracking = scoped(hull, payload).track(event, properties, trackContext);

  tracking.then(
    () => {
      log("track.success", { ...context, event, properties });
    },
    error => {
      metric("request.track.error");
      log("track.error", { error });
    }
  );

  return tracking;
}
