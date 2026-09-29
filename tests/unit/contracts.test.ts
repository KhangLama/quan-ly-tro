import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { mockDbStore } from "../../src/lib/supabase/mock-db.ts";
import {
  saveContract,
  getContractsByRoom,
  getContract,
  deleteContract,
} from "../../src/actions/contracts.ts";

describe("Contracts Service & Database Operations", () => {
  const roomId = "test-room-101";

  beforeEach(() => {
    mockDbStore.reset();
  });

  it("successfully creates a new contract for a room with HTML and form_data", async () => {
    const res = await saveContract({
      room_id: roomId,
      tenant_name: "Nguyễn Văn A",
      title: "HĐPT - P101 - Nguyễn Văn A",
      html_content: "<div>Hợp đồng phòng 101</div>",
      form_data: { monthlyPrice: 3000000, tenantName: "Nguyễn Văn A" },
      status: "draft",
    });

    assert.strictEqual(res.error, undefined);
    assert.ok(res.contract);
    assert.ok(res.contract.id);
    assert.strictEqual(res.contract.room_id, roomId);
    assert.strictEqual(res.contract.tenant_name, "Nguyễn Văn A");
    assert.strictEqual(res.contract.title, "HĐPT - P101 - Nguyễn Văn A");
    assert.strictEqual(res.contract.html_content, "<div>Hợp đồng phòng 101</div>");
    assert.deepStrictEqual(res.contract.form_data, { monthlyPrice: 3000000, tenantName: "Nguyễn Văn A" });
    assert.strictEqual(res.contract.status, "draft");
  });

  it("updates an existing contract (preserves ID, updates timestamp & content)", async () => {
    const createRes = await saveContract({
      room_id: roomId,
      tenant_name: "Trần Văn B",
      title: "HĐPT - P101 - Trần Văn B",
      html_content: "<p>Bản nháp 1</p>",
      status: "draft",
    });

    assert.ok(createRes.contract);
    const contractId = createRes.contract.id;

    // Update with edited HTML content
    const updateRes = await saveContract({
      id: contractId,
      room_id: roomId,
      tenant_name: "Trần Văn B (đã sửa)",
      title: "HĐPT - P101 - Trần Văn B (đã sửa)",
      html_content: "<p>Bản đã chỉnh sửa trực tiếp</p>",
      status: "draft",
    });

    assert.strictEqual(updateRes.error, undefined);
    assert.ok(updateRes.contract);
    assert.strictEqual(updateRes.contract.id, contractId);
    assert.strictEqual(updateRes.contract.tenant_name, "Trần Văn B (đã sửa)");
    assert.strictEqual(updateRes.contract.html_content, "<p>Bản đã chỉnh sửa trực tiếp</p>");
  });

  it("fetches all contracts for a room, ordered newest first", async () => {
    await saveContract({
      room_id: roomId,
      tenant_name: "Khách 1",
      title: "HĐ 1",
      html_content: "<p>1</p>",
    });

    await saveContract({
      room_id: roomId,
      tenant_name: "Khách 2",
      title: "HĐ 2",
      html_content: "<p>2</p>",
    });

    const { contracts, error } = await getContractsByRoom(roomId);
    assert.strictEqual(error, undefined);
    assert.strictEqual(contracts.length, 2);
  });

  it("fetches a single contract by id", async () => {
    const created = await saveContract({
      room_id: roomId,
      tenant_name: "Lê Thị C",
      title: "HĐPT - P101 - Lê Thị C",
      html_content: "<p>Nội dung C</p>",
    });

    assert.ok(created.contract);
    const fetched = await getContract(created.contract.id);
    assert.strictEqual(fetched.error, undefined);
    assert.ok(fetched.contract);
    assert.strictEqual(fetched.contract.tenant_name, "Lê Thị C");
  });

  it("deletes a contract by id", async () => {
    const created = await saveContract({
      room_id: roomId,
      tenant_name: "Khách xoá",
      title: "HĐ xoá",
      html_content: "<p>Xoá</p>",
    });

    assert.ok(created.contract);
    const deleteRes = await deleteContract(created.contract.id);
    assert.strictEqual(deleteRes.error, undefined);

    const { contracts } = await getContractsByRoom(roomId);
    assert.strictEqual(contracts.length, 0);
  });
});
