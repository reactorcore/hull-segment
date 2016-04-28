import { isEmpty, reduce, include } from 'lodash'

const TOP_LEVEL_FIELDS = [
  'name',
  'description',
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
  'external_id',
  'guest_id',
  'uniqToken',
  'visitToken'
];

function updateUser(hull, user) {
  try {

    const { userId, anonymousId, properties, traits={} } = user;
    const user = { external_id: userId, guest_id: anonymousId }
    if (!user.guest_id && !user.external_id){ return false; }
    ​
    if(traits.email){
      //we enforce email unicity, so we never want to store email in the main email field
      //because we don't know if the customer is enforcing unicity.
      traits.contact_email = traits.email;
      delete traits.email;
    }
    ​
    return hull.as(user).post('firehose/traits', traits).then(
      response => {
        return { params, response }
      },
      error => {
        error.params = params;
        throw error
      }
    );
  } catch (err) {
    return Promise.reject(err);
  }
}

export default function handleIdentify(payload, { hull, ship, measure, log }) {
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
    const updating = updateUser(hull, user);

    updating.then(
      ({ params }) => {
        measure('request.identify.updateUser');
        log('identify.success', params);
      },
      error => {
        measure('request.identify.updateUser.error');
        log('identify.error', { error });
      }
    );

    return updating;
  }
}
