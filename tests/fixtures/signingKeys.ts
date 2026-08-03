export const signingKeyDocument = {
  creationTime: 1_722_470_400,
  expirationTime: 1_817_030_400,
  jwe: 'eyJraWQiOiJzaWduaW5nLWtleS0xMjMifQ',
  privateKey: '-----BEGIN PRIVATE KEY-----\nprivate-key\n-----END PRIVATE KEY-----',
  publicKey: '-----BEGIN PUBLIC KEY-----\npublic-key\n-----END PUBLIC KEY-----',
  signingKeyCipher: 'ED25519',
  signingKeyId: 'signing-key-123',
};

export const retrievableSigningKeyDocument = {
  creationTime: 1_722_470_400,
  expirationTime: 1_817_030_400,
  jwe: 'eyJraWQiOiJzaWduaW5nLWtleS0xMjMifQ',
  publicKey: '-----BEGIN PUBLIC KEY-----\npublic-key\n-----END PUBLIC KEY-----',
  signingKeyCipher: 'ED25519',
  signingKeyId: 'signing-key-123',
};

export const signingKeyCollectionDocument = {
  signingKeys: [
    retrievableSigningKeyDocument,
    {
      creationTime: 1_725_148_800,
      expirationTime: 1_819_708_800,
      jwe: 'eyJraWQiOiJzaWduaW5nLWtleS00NTYifQ',
      publicKey: '-----BEGIN PUBLIC KEY-----\nsecond-public-key\n-----END PUBLIC KEY-----',
      signingKeyCipher: 'RSA',
      signingKeyId: 'signing-key-456',
    },
  ],
};
