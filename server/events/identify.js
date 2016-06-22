import { isEmpty, reduce, includes } from "lodash";
import scoped from "../scope-hull-client";

const ALIASED_FIELDS = {
  lastname: "last_name",
  firstname: "first_name",
  createdat: "created_at"
};

const IGNORED_TRAITS = [
  "id",
  "external_id",
  "guest_id",
  "uniqToken",
  "visitToken"
];

function updateUser(hull, user) {
  try {
    const { userId, anonymousId, traits = {} } = user;
    if (!userId && !anonymousId) { return false; }

    return scoped(hull, user).traits(traits).then(
      (/* response*/) => {
        return { traits };
      },
      (error) => {
        error.params = traits;
        throw error;
      }
    );
  } catch (err) {
    return Promise.reject(err);
  }
}

export default function handleIdentify(payload, { hull /* , ship*/ }) {
  const { /* context, */ traits, userId, anonymousId, integrations = {} } = payload;
  const { metric, log } = hull.utils;
  const user = reduce((traits || {}), (u, v, k) => {
    if (v == null) return u;
    if (ALIASED_FIELDS[k.toLowerCase()]) {
      u.traits[ALIASED_FIELDS[k.toLowerCase()]] = v;
    } else if (!includes(IGNORED_TRAITS, k)) {
      u.traits[k] = v;
    }
    return u;
  }, { userId, anonymousId, traits: {} });

  if (integrations.Hull && integrations.Hull.id === true) {
    user.hullId = user.userId;
    delete user.userId;
  }
  if (!isEmpty(user.traits)) {
    const updating = updateUser(hull, user);

    updating.then(
      ({ t }) => {
        metric("request.identify.updateUser");
        log("identify.success", t);
      },
      error => {
        metric("request.identify.updateUser.error");
        log("identify.error", { error });
      }
    );

    return updating;
  }
  return user;
}
