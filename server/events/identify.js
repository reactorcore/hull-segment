import { isEmpty, reduce, include } from 'lodash'

const TOP_LEVEL_FIELDS = [
  'name',
  'username',
  'first_name',
  'last_name',
  'email',
  'contact_email',
  'image',
  'picture',
  'phone',
  'address',
  'created_at'
];

const ALIASED_FIELDS = {
  lastname: 'last_name',
  firstname: 'first_name',
  createdat: 'created_at'
};

const IGNORED_TRAITS = [
  'id',
  'uniqToken',
  'visitToken'
];

function updateTraits(hull, userId, traits) {
  return hull.as(userId, false).traits(traits);
}

function updateUser(hull, user) {

  try {
    const { userId, anonymousId, properties, traits } = user;
    let client = hull;

    if (userId) {
      let hullAs = { external_id: userId };
      if (anonymousId) {
        hullAs.guest_id = anonymousId;
      }
      client = hull.as(hullAs);
    } else if (anonymousId) {
      properties._bid = anonymousId;
    }

    return client.put('me', properties).then((hullUser) => {
      return updateTraits(hull, hullUser.id, traits);
    }, (err) => {
      console.warn('Error ', err, err.stack);
    });
  } catch (err) {
    console.warn('Error on updateUser', err, err.stack);
  }

}

export default function handleIdentify(payload, { hull }) {
  const { context, traits, userId, anonymousId } = payload;
  const user = reduce((traits || {}), (u, v, k) => {
    if (v == null) return u;
    if (include(TOP_LEVEL_FIELDS, k)) {
      u.properties[k] = v;
    } else if (ALIASED_FIELDS[k.toLowerCase()]) {
      u.properties[ALIASED_FIELDS[k.toLowerCase()]] = v;
    } else if (!include(IGNORED_TRAITS, k)) {
      u.traits[k] = v;
    }
    return u;
  }, { userId, anonymousId, properties: {}, traits: {} });

  if (!isEmpty(user.traits) || !isEmpty(user.properties)) {
    return updateUser(hull, user);
  }
}
