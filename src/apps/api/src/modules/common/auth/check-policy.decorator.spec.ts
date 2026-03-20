import { CHECK_POLICY_KEY, CheckPolicy } from './check-policy.decorator'
import { IsAuthenticatedPolicy } from './is-authenticated.policy'

describe('CheckPolicy decorator', () => {
  it('sets correct metadata on the route handler', () => {
    class TestController {
      @CheckPolicy(IsAuthenticatedPolicy)
      testMethod() {}
    }

    const metadata = Reflect.getMetadata(CHECK_POLICY_KEY, TestController.prototype.testMethod)
    expect(metadata).toBe(IsAuthenticatedPolicy)
  })
})
