import track from "./track";

export default function handlePage(payload = {}, context = {}) {
  const { ship = {} } = context;
  const { handle_pages } = ship.settings || {};
  if (!handle_pages) { return false; }
  const { path, search, title } = payload.properties || {};

  const page = {
    ...payload,
    event: "page",
    properties: {
      name: payload.name,
      ...properties
    }
  };

  return track(page, context);
}
