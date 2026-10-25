# Test Report

**Status: Not yet executed in the authoring environment.** Do not report these tests as passing until you run `pytest -q` from `backend` after installing requirements.

## Included automated cases
- New user can register and log in.
- Duplicate email registration is rejected.
- Vehicle listing requires authentication.
- Administrator can add a vehicle and list it.
- Purchase reduces quantity by one.
- Purchase fails when quantity is zero.
- Normal customer cannot add a vehicle.

## Execution record
- Date/time: [fill in]
- Python version: [fill in]
- Command: `pytest -q`
- Passed: [fill in]
- Failed: [fill in]
- Coverage: [run `pytest --cov=app --cov-report=term-missing` after installing `pytest-cov`, then fill in]
- Notes / fixes: [fill in]

## Manual acceptance checklist
- [ ] Register a customer and log in.
- [ ] Verify a request without a token receives HTTP 401.
- [ ] Verify a customer cannot use admin endpoints (HTTP 403).
- [ ] Promote a test account using the README bootstrap step and test admin CRUD.
- [ ] Purchase one unit and verify quantity decreases.
- [ ] Set quantity to zero and verify Purchase is disabled and API purchase returns HTTP 409.
- [ ] Test make, model, category, and price filters.
- [ ] Capture screenshots of the running UI.
