export default function(hull, user={}, context={}){
  const { hullId, userId, anonymousId } = user;
  if(!hullId && !userId && !anonymousId) {
    return hull;
  }
  const as = {};

  if (hullId){ as.id = hullId; }
  if (userId){ as.external_id = userId; }
  if (anonymousId){ as.guest_id = anonymousId; }


  return hull.as(as);
}
