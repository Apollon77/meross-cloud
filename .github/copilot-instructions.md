# meross-cloud

meross-cloud is a Node.js library for controlling Meross IoT devices via their cloud API. It connects to the Meross cloud servers, retrieves device information, and provides local and cloud control capabilities through MQTT and HTTP connections.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Prerequisites
- Node.js 16.x or higher is required (as specified in package.json engines field)
- No build step is required - this is a pure JavaScript library

### Setup and Dependencies
```bash
npm install
```
- NEVER CANCEL: Initial install takes ~15 seconds on first run, ~1 second on subsequent runs. Set timeout to 30+ seconds.
- Clean install (after removing node_modules and package-lock.json) takes ~15 seconds

### Testing
```bash
npm test
```
- NEVER CANCEL: Test suite runs in ~1 second. Uses istanbul for coverage and mocha for testing. Set timeout to 30+ seconds.
- Tests will attempt network connections to Meross servers but handle failures gracefully
- Tests use mocked network calls and do not require real Meross credentials
- Coverage reports are generated in `coverage/` directory

### Linting
The project uses ESLint with an older configuration format (.eslintrc). However, the current configuration has compatibility issues with modern ESLint versions:
```bash
# This will show errors but provides useful feedback:
npx eslint@8 index.js
```
- The ESLint configuration is deprecated and will show warnings
- Do NOT upgrade ESLint or change the configuration unless specifically requested
- Common linting issues include complexity violations and unused expressions

## Validation

### Manual Testing Scenarios
After making any changes to the core library (index.js), always test:

1. **Basic API validation:**
```javascript
const MerossCloud = require('./index.js');
const options = {
    email: 'test@example.com',
    password: 'testpassword',
    logger: console.log,
    localHttpFirst: true,
    timeout: 3000
};
const meross = new MerossCloud(options);
console.log('Instance created successfully');
```

2. **Event handling validation:**
```javascript
meross.on('error', (error) => console.log('Error handled:', error.message));
meross.connect((error) => console.log('Connect attempt completed'));
```

3. **TypeScript definitions validation:**
```bash
npx tsc --noEmit index.d.ts
```

4. **Complete functional validation:**
```javascript
// Test all major functionality without real credentials
const meross = new MerossCloud({
    email: 'test@example.com', 
    password: 'test',
    mfaCode: '123456',  // Optional MFA testing
    localHttpFirst: true,
    timeout: 2000
});

// Test event listeners
meross.on('deviceInitialized', (deviceId, deviceDef, device) => {
    console.log('Device ready:', deviceId);
});

meross.on('error', (error) => {
    console.log('Error handled correctly:', error.message);
});

// Test connection (will fail with network error - expected)
meross.connect((error) => {
    console.log('Connection test completed:', error?.message);
});
```

### Always Run Before Committing
```bash
npm test
```
- Ensure all tests still pass
- Do NOT fix unrelated test failures - only address failures caused by your changes

## Common Tasks

### Key Project Files
```
├── index.js          # Main library implementation (809 lines)
├── index.d.ts        # TypeScript definitions
├── package.json      # Project configuration and dependencies
├── lib/
│   └── errorcodes.js # Error code mappings for Meross API
├── example/
│   └── example.js    # Usage example
├── test/
│   └── test.js       # Test suite
└── .github/
    └── workflows/
        └── test-and-release.yml  # CI/CD pipeline
```

### Repository Structure
```
/home/runner/work/meross-cloud/meross-cloud/
├── index.js          # Main MerossCloud class and device connection logic
├── lib/errorcodes.js # Maps Meross API error codes to human readable messages
├── example/          # Complete working example (requires real credentials)
├── test/             # Mocha test suite with network mocking
└── .github/workflows/ # GitHub Actions for testing and NPM publishing
```

### Main API Methods (from index.js)
- `constructor(options)` - Initialize with email, password, optional MFA code
- `connect(callback)` - Login and connect to devices
- `getTokenData()` - Retrieve stored authentication tokens
- `getDevice(uuid)` - Get specific device instance
- `disconnectAll(force)` - Disconnect from all devices
- `logout(callback)` - Clean logout from Meross servers

### Dependencies and Security
The project has some known security vulnerabilities in dependencies:
- Uses deprecated `request` library (scheduled for replacement)
- form-data and tough-cookie have security advisories
- Do NOT run `npm audit fix` as it may break compatibility
- These are acceptable for this library's use case but should be noted

### Configuration Files
- `.eslintrc` - ESLint configuration (deprecated format, but functional)
- `.github/workflows/test-and-release.yml` - CI runs tests on Node 18.x, 20.x, 22.x, 24.x
- `package.json` - Defines test script using istanbul + mocha

## Timing Expectations

| Operation | Time | Notes |
|-----------|------|-------|
| `npm install` (fresh) | ~15s | NEVER CANCEL - Set timeout to 30+ seconds |
| `npm install` (cached) | ~1s | Very fast with existing node_modules |
| `npm test` | ~1s | Fast test suite with mocked network |
| `npx tsc --noEmit index.d.ts` | ~3s | TypeScript validation |
| ESLint execution | ~5s | Shows many warnings but completes |
| Basic API validation | <1s | Instantiation and method checks |

## Important Notes

### Network Dependencies
- The library connects to `iotx.meross.com` for authentication
- MQTT connections go to `eu-iotx.meross.com` 
- Without real Meross credentials, network operations will fail (expected behavior)
- Tests and examples handle network failures gracefully
- Local HTTP mode (`localHttpFirst: true`) tries device IP addresses first

### Development Guidelines
- This is a production library used by ioBroker adapters
- Make minimal changes - the API is stable and widely used
- The library supports MFA (Multi-Factor Authentication) via mfaCode option
- Device control works both locally (HTTP) and via cloud (MQTT)
- Token data can be cached and reused to avoid repeated logins

### Error Handling
- All errors from Meross API are mapped in `lib/errorcodes.js`
- Network timeouts default to 3 seconds (configurable via timeout option)
- The library emits events for device connections, errors, and data
- Always check the example/example.js for proper event handling patterns