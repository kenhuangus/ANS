// Mock PKI Operations
// In a real system, this would interact with OpenSSL or a robust crypto library.

export const AGENT_REGISTRY_CERTIFICATE_PEM = `-----BEGIN CERTIFICATE-----
MIIDdzCCAl+gAwIBAgIJANzA0G97wzgwMA0GCSqGSIb3DQEBCwUAMFgxCzAJBgNV
BAYTAlVTMQswCQYDVQQIDAJDQTEUMBIGA1UEBwwLU2FuIEZyYW5jaXNjbzEVMBMG
A1UECgwMQWdlbnQgUmVnaXN0cnkxETAPBgNVBAMMCENvbXBhbnkyMB4XDTI0MDgw
MjE1MzUzNVoXDTI1MDgwMjE1MzUzNVowWDELMAkGA1UEBhMCVVMxCzAJBgNVBAgM
AkNBMRQwEgYDVQQHDAtTYW4gRnJhbmNpc2NvMRUwEwYDVQQKDAxBZ2VudCBSZWdp
c3RyeTERMA8GA1UEAwwIQ29tcGFueTIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAw
ggEKAoIBAQDRs5R2Z2h9x0L8s6z/k1e2wM9N8n3rE6zN3w+0tF6Z+s5F2e3k4v0K
M3vN7v9gB5sP/G3z8K5vP4g7j8N4c5v/s2v7X6xR8vN2d4K8P9o/A6k5O8fP8Y6
n3rE6zN3w+0tF6Z+s5F2e3k4v0KM3vN7v9gB5sP/G3z8K5vP4g7j8N4c5v/s2v7
X6xR8vN2d4K8P9o/A6k5O8fP8Y6q/C4n2k7U5e8V2A3w9mB6y9r/J5kP/t3n5G
q7z8V6l8r/O9X7s8P/w4U3K9N/o7R2m+E9v9Q7x/F3m+Y9vC8p7K/P7j6D+M8
N/R9qAgMBAAGjUDBOMB0GA1UdDgQWBBQG7sR4l8K7P8vF9G3sK8vK8vL8HTAf
BgNVHSMEGDAWgBQG7sR4l8K7P8vF9G3sK8vK8vL8HTAMBgNVHRMEBTADAQH/
MA0GCSqGSIb3DQEBCwUAA4IBAQBj7x9vP8k6N3s7P/u5M9g8K7v9vP8Y6q/C4
n2k7U5e8V2A3w9mB6y9r/J5kP/t3n5Gq7z8V6l8r/O9X7s8P/w4U3K9N/o7R2
m+E9v9Q7x/F3m+Y9vC8p7K/P7j6D+M8N/R9qAgMBAAE=
-----END CERTIFICATE-----`;

export const AGENT_REGISTRY_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDRs5R2Z2h9x0L8
s6z/k1e2wM9N8n3rE6zN3w+0tF6Z+s5F2e3k4v0KM3vN7v9gB5sP/G3z8K5vP4g7
j8N4c5v/s2v7X6xR8vN2d4K8P9o/A6k5O8fP8Y6q/C4n2k7U5e8V2A3w9mB6y9r
/J5kP/t3n5Gq7z8V6l8r/O9X7s8P/w4U3K9N/o7R2m+E9v9Q7x/F3m+Y9vC8p7K
/P7j6D+M8N/R9qAgMBAAECggEAX/u5v/r8K7P8vF9G3sK8vK8vL8HTAfBgNVHSM
EGDAWgBQG7sR4l8K7P8vF9G3sK8vK8vL8HTAMBgNVHRMEBTADAQH/MA0GCSqGSI
b3DQEBCwUAA4IBAQBj7x9vP8k6N3s7P/u5M9g8K7v9vP8Y6q/C4n2k7U5e8V2A
3w9mB6y9r/J5kP/t3n5Gq7z8V6l8r/O9X7s8P/w4U3K9N/o7R2m+E9v9Q7x/F3
m+Y9vC8p7K/P7j6D+M8N/R9qAgMBAAE=
-----END PRIVATE KEY-----`;

export const LOCAL_CA_CERTIFICATE_PEM = `-----BEGIN CERTIFICATE-----
MIIDdzCCAl+gAwIBAgIJAPLocalCA+zgwMA0GCSqGSIb3DQEBCwUAMFgxCzAJBgNV
BAYTAlVTMQswCQYDVQQIDAJDQTEUMBIGA1UEBwwLU2FuIEZyYW5jaXNjbzEVMBMG
A1UECgwMTG9jYWwgQ0EgT3JnMQ8wDQYDVQQDDAZMb2NhbENBMB4XDTI0MDgwMjE1
MzUzNVoXDTI1MDgwMjE1MzUzNVowWDELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAkNB
MRQwEgYDVQQHDAtTYW4gRnJhbmNpc2NvMRUwEwYDVQQKDAxMb2NhbCBDQSBPcmcx
DzANBgNVBAMMBkxvY2FsQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
AQDRs5R2Z2h9x0L8s6z/k1e2wM9N8n3rE6zN3w+0tF6Z+s5F2e3k4v0KM3vN7v9g
B5sP/G3z8K5vP4g7j8N4c5v/s2v7X6xR8vN2d4K8P9o/A6k5O8fP8Y6q/C4n2k7U
5e8V2A3w9mB6y9r/J5kP/t3n5Gq7z8V6l8r/O9X7s8P/w4U3K9N/o7R2m+E9v9Q
7x/F3m+Y9vC8p7K/P7j6D+M8N/R9qAgMBAAGjUDBOMB0GA1UdDgQWBBQG7sR4l8K7
P8vF9G3sK8vK8vL8HTAfBgNVHSMEGDAWgBQG7sR4l8K7P8vF9G3sK8vK8vL8HTAM
BgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQBj7x9vP8k6N3s7P/u5M9g8
K7v9vP8Y6q/C4n2k7U5e8V2A3w9mB6y9r/J5kP/t3n5Gq7z8V6l8r/O9X7s8P/w4
U3K9N/o7R2m+E9v9Q7x/F3m+Y9vC8p7K/P7j6D+M8N/R9qAgMBAAE=
-----END CERTIFICATE-----`;

export const LOCAL_CA_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDRs5R2Z2h9x0L8
s6z/k1e2wM9N8n3rE6zN3w+0tF6Z+s5F2e3k4v0KM3vN7v9gB5sP/G3z8K5vP4g7
j8N4c5v/s2v7X6xR8vN2d4K8P9o/A6k5O8fP8Y6q/C4n2k7U5e8V2A3w9mB6y9r
/J5kP/t3n5Gq7z8V6l8r/O9X7s8P/w4U3K9N/o7R2m+E9v9Q7x/F3m+Y9vC8p7K
/P7j6D+M8N/R9qAgMBAAECggEAX/u5v/r8K7P8vF9G3sK8vK8vL8HTAfBgNVHSM
EGDAWgBQG7sR4l8K7P8vF9G3sK8vK8vL8HTAMBgNVHRMEBTADAQH/MA0GCSqGSI
b3DQEBCwUAA4IBAQBj7x9vP8k6N3s7P/u5M9g8K7v9vP8Y6q/C4n2k7U5e8V2A
3w9mB6y9r/J5kP/t3n5Gq7z8V6l8r/O9X7s8P/w4U3K9N/o7R2m+E9v9Q7x/F3
m+Y9vC8p7K/P7j6D+M8N/R9qAgMBAAE=
-----END PRIVATE KEY-----`;


/**
 * MOCK: Generates a mock CA-signed certificate from a CSR.
 * In a real system, this would use OpenSSL to sign the CSR with the CA's private key.
 * @param csrPem The Certificate Signing Request in PEM format.
 * @param _caCertPem The CA's certificate (unused in mock).
 * @param _caKeyPem The CA's private key (unused in mock).
 * @returns A mock PEM-encoded certificate.
 */
export async function generateCertificate(
  csrPem: string,
  _caCertPem: string, // Typically LOCAL_CA_CERTIFICATE_PEM
  _caKeyPem: string  // Typically LOCAL_CA_PRIVATE_KEY_PEM
): Promise<string> {
  // Simulate CA signing by creating a new "certificate" based on the CSR
  // This is highly simplified and not cryptographically secure.
  const subjectMatch = csrPem.match(/Subject: ([^\n]+)/);
  const subject = subjectMatch ? subjectMatch[1] : "CN=Unknown Agent";
  
  const mockCert = `-----BEGIN CERTIFICATE-----
MIIDdzCCAl+gAwIBAgIBATANBgkqhkiG9w0BAQsFADBdMQswCQYDVQQGEwJVUzEL
MAkGA1UECAwCQ0ExEDAOBgNVBAcMB01vY2tDRVYxEjAQBgNVBAoMCUxvY2FsIENB
MRYwFAYDVQQDDA1Mb2NhbCBDQSBSb290MB4XDTI0MDExMDEwMDAwMDBaXDTI1MDEx
MDEwMDAwMDBaMFUxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJDQTEPMA0GA1UEBwwG
TW9ja2VkMRQwEgYDVQQKDAtBZ2VudCBNb2NrZWQxEjAQBgNVBAMMC${Buffer.from(subject).toString('base64').replace(/=/g, '').slice(0,10)}
... (rest of a plausible but fake certificate body) ...
-----END CERTIFICATE-----`;
  return mockCert;
}

/**
 * MOCK: Verifies a certificate chain.
 * In a real system, this would use OpenSSL or a crypto library.
 * @param certPem The certificate to verify.
 * @param trustedCaCertPem The trusted CA certificate.
 * @returns True if "valid" (mocked).
 */
export async function verifyCertificateChain(
  certPem: string,
  trustedCaCertPem: string
): Promise<boolean> {
  // Mock implementation: check if certs are non-empty and seem like PEMs
  if (certPem.startsWith("-----BEGIN CERTIFICATE-----") && trustedCaCertPem.startsWith("-----BEGIN CERTIFICATE-----")) {
    // In a real scenario, you'd parse certPem, get its issuer,
    // find the issuer's cert (potentially trustedCaCertPem or an intermediate),
    // verify signature, check dates, revocation status, etc., up to the trustedCaCertPem.
    return true; // Simplified: always true if format is okay.
  }
  return false;
}

/**
 * MOCK: Signs data with a private key.
 * @param data The data to sign.
 * @param _privateKeyPem The private key (unused in mock).
 * @returns A mock signature.
 */
export async function signData(data: string, _privateKeyPem: string): Promise<string> {
  // Simplified mock signature: hash of data + "signed"
  // This is not cryptographically secure.
  // Using a simple pseudo-hash for predictability in mock
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `mockSignature:${hash.toString(16)}`;
}

/**
 * MOCK: Verifies a signature.
 * @param data The original data.
 * @param signature The signature to verify.
 * @param _publicKeyPem The public key (unused in mock, but would be derived from a cert).
 * @returns True if "valid" (mocked).
 */
export async function verifySignature(
  data: string,
  signature: string,
  _publicKeyPemOrCertPem: string
): Promise<boolean> {
  // Mock verification: check if signature matches the mock signing logic
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  const expectedSignature = `mockSignature:${hash.toString(16)}`;
  return signature === expectedSignature;
}

/**
 * MOCK: Check certificate revocation status (CRL/OCSP).
 * @param _certPem The certificate to check.
 * @returns False (not revoked) by default in mock.
 */
export async function checkCertificateRevocation(_certPem: string): Promise<boolean> {
  // In a real system, this would query a CRL or OCSP responder.
  return false; // Assume not revoked for mock purposes.
}
