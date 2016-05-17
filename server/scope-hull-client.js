const EMAIL_REGEXP = /([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})/i

export default function(hull, user={}, context={}){
  const { hullId, userId, anonymousId, traits = {} } = user;
  if(!hullId && !userId && !anonymousId) {
    return hull;
  }
  const as = {};

  if (hullId || userId) {
    if (hullId) { as.id = hullId; }
    if (userId) { as.external_id = userId; }
  } else if (traits.email && EMAIL_REGEXP.test(traits.email)) {
    as.email = traits.email.toLowerCase();
  }

  if (anonymousId) {
    as.guest_id = anonymousId;
  }

  return hull.as(as);
}
