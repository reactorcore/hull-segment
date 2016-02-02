import { createHmac } from 'crypto';

export default function generateShipSecret(id, secret="") {
  return createHmac('sha256', secret).update(id).digest('hex');
}
