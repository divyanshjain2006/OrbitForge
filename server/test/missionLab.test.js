import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import Mission from "../src/models/mission.model.js";
import {
  createMissionController,
  getMissionsController,
  getMissionByIdController
} from "../src/controllers/mission.controller.js";

const originalMissionCreate = Mission.create;
const originalMissionFind = Mission.find;
const originalMissionFindById = Mission.findById;

afterEach(() => {
  Mission.create = originalMissionCreate;
  Mission.find = originalMissionFind;
  Mission.findById = originalMissionFindById;
});

test("createMissionController - success with workspace isolation", async () => {
  const req = {
    body: { name: "Test Mission", altitude: 500, inclination: 45, duration: 30 },
    workspaceId: "workspace-123",
    auth: { userId: "user-1" },
    requestId: "req-1"
  };
  
  const res = {
    statusCode: null,
    jsonResponse: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonResponse = data;
    }
  };

  Mission.create = async (data) => {
    assert.equal(data.workspaceId, "workspace-123");
    return { _id: "mission-1", ...data };
  };

  await createMissionController(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.jsonResponse.success, true);
  assert.equal(res.jsonResponse.mission.name, "Test Mission");
});

test("getMissionsController - workspace scoping", async () => {
  const req = {
    workspaceId: "workspace-123"
  };
  
  const res = {
    jsonResponse: null,
    json(data) {
      this.jsonResponse = data;
    }
  };

  Mission.find = (filter) => {
    assert.equal(filter.workspaceId, "workspace-123");
    return {
      sort: () => Promise.resolve([{ _id: "mission-1" }, { _id: "mission-2" }])
    };
  };

  await getMissionsController(req, res);

  assert.equal(res.jsonResponse.success, true);
  assert.equal(res.jsonResponse.missions.length, 2);
});

test("getMissionByIdController - not found", async () => {
  const req = {
    params: { id: "invalid-id" }
  };
  
  const res = {
    statusCode: null,
    jsonResponse: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonResponse = data;
    }
  };

  Mission.findById = async () => null;

  await getMissionByIdController(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.jsonResponse.success, false);
});
