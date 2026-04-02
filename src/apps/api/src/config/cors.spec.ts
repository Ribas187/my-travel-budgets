import { buildCorsOrigin } from './cors';

describe('buildCorsOrigin', () => {
  const CORS_ORIGIN = 'http://localhost:5173,https://mybudget.cards';

  it('allows a listed origin', () => {
    const callback = jest.fn();
    buildCorsOrigin(CORS_ORIGIN)('https://mybudget.cards', callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('allows localhost origin', () => {
    const callback = jest.fn();
    buildCorsOrigin(CORS_ORIGIN)('http://localhost:5173', callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('allows server-to-server requests with no origin', () => {
    const callback = jest.fn();
    buildCorsOrigin(CORS_ORIGIN)(undefined, callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('rejects an unlisted origin', () => {
    const callback = jest.fn();
    buildCorsOrigin(CORS_ORIGIN)('https://evil.com', callback);
    const [err] = callback.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/not allowed/);
  });

  it('handles a single origin without commas', () => {
    const callback = jest.fn();
    buildCorsOrigin('https://mybudget.cards')('https://mybudget.cards', callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('handles extra whitespace in the env var', () => {
    const callback = jest.fn();
    buildCorsOrigin('http://localhost:5173 , https://mybudget.cards')('https://mybudget.cards', callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });
});
