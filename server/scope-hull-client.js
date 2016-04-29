export default function(hull, user={}, context={}){
  const { hullId, userId, anonymousId } = user;
  if(!hullId && !userId && !anonymousId) {
    return hull;
  }
  return hull.as({ id: hullId, external_id: userId, guest_id: anonymousId });
}
