
function getStatus(completedSteps, totalSteps = 8) {
  if (completedSteps === 0) return "planned";
  if (completedSteps === totalSteps) return "done";
  return "ongoing";
}

describe("Release status", () => {
  test("no completed steps means planned", () => {
    expect(getStatus(0)).toBe("planned");
  });

  test("some completed steps means ongoing", () => {
    expect(getStatus(3)).toBe("ongoing");
  });

  test("all completed steps means done", () => {
    expect(getStatus(8)).toBe("done");
  });
});
