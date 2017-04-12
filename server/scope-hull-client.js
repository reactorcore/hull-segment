const EMAIL_REGEXP = /([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})/i;
const TEACHABLE_REGEX = /^[0-9]{7}$/;

export default function scope(hull, user = {} /* , context = {}*/) {
  const {
    hullId,
    userId,
    anonymousId,
    traits = {}
  } = user;

  if (!hullId && !userId && !anonymousId) {
    return hull;
  }
  const as = {};

  if (hullId || userId) {
    if (hullId) {
      as.id = hullId;
    }

    const fromAuth0 = userId.indexOf("auth0") === 0;
    const fromTeachable = TEACHABLE_REGEX.test(userId);
    const fromEmail = EMAIL_REGEXP.test(userId);

    if (userId && fromAuth0) {
      as.external_id = userId;
    }
    if (userId && fromTeachable) {
      // TODO: add teachable IDs to traits
      as.guest_id = `teachable:${userId}`;
    }
    if (userId && fromEmail) {
      as.email = userId.toLowerCase();
    }
    if (userId && !fromAuth0 && !fromTeachable && !fromEmail) {
      as.guest_id = userId;
    }
  }

  if (!userId && anonymousId) {
    as.guest_id = anonymousId;
  }

  if (traits.email && EMAIL_REGEXP.test(traits.email)) {
    as.email = traits.email.toLowerCase();
  }

  return hull.as(as);
}
