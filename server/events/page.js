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
      path,
      search,
      title,
      name: payload.name
    }
  };

  return track(page, context);
}
