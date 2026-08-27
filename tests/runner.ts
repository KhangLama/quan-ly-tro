import "./setup.ts";
import "./unit/calculation.test.ts";
import "./unit/zalo-template.test.ts";
import "./unit/auth-session.test.ts";
import "./unit/components-m2.test.ts";
import "./unit/mock-db-node.test.ts";
import "./unit/empirical-m1-challenge.test.ts";
import "./unit/empirical-m2-challenge.test.ts";
import "./unit/empirical-m3-challenge.test.ts";
import "./unit/empirical-m4-challenge.test.ts";
import "./unit/empirical-m5-challenge.test.ts";
import "./unit/empirical-m6-challenge.test.ts";
import "./integration/invoice-chain.test.ts";
import "./integration/route-guard.test.ts";
import "./e2e/tier1-features.test.ts";
import "./e2e/tier2-boundaries.test.ts";
import "./e2e/tier3-pairwise.test.ts";
import "./e2e/tier4-lifecycle.test.ts";

import { runAllTests } from "vitest";

if (typeof runAllTests === "function") {
  await runAllTests();
}
